// Phase 5 – evaluation of the chatbot pipeline, run as in production (medical guard first).
// Run: npm run eval   (= tsx --env-file=.env.local scripts/eval.ts)
// Prints a results table and writes docs/evaluation-results.md. Prints no secrets.
import { readFileSync, writeFileSync } from "node:fs";
import { classifyTicket } from "@/lib/chatbot/classify";
import { checkConversation } from "@/lib/chatbot/medical-guard";
import { MIN_SCORE, retrieve } from "@/lib/chatbot/retrieve";
import { listCategories } from "@/lib/chatbot/taxonomy";

const MAX_LLM_CALLS = 40;
const LLM_GAP_MS = 13_000; // free tier: about 5 requests per minute

type Case = { text: string; expected: string; medical: boolean; source: string };

// Examples have no sub-category label: these are the fit_issues examples of 6_aligner_fit.
const FIT_EXAMPLES = [
  "Die neue Schiene hat eine scharfe Kante und kratzt an der Zunge.",
  "Meine Schiene sitzt seit gestern total locker.",
  "Die Schiene ist so eng, dass es richtig wehtut.",
];

const PO_SCENARIOS: Case[] = [
  {
    text: "Ich habe heute meine 3D-Simulation bekommen. Kann ich die 1.790 € in Raten zahlen? Und wie lange dauert der Versand, wenn ich zusage?",
    expected: "4_payment",
    medical: false,
    source: "Po scenario 1",
  },
  {
    text: "Ich bin bei Schiene 3, die untere Schiene sitzt locker und ein Zahn ist empfindlich. Was soll ich tun?",
    expected: "6_aligner_fit",
    medical: true,
    source: "Po scenario 2",
  },
  {
    text: "Ich möchte die Abdruckbox für 9 € bestellen, habe aber Angst, die Abdruckmasse falsch anzumischen. Gibt es eine Anleitung?",
    expected: "2_kit_appointment",
    medical: false,
    source: "Po scenario 3",
  },
];

const allExamples = listCategories().flatMap((c) => c.example_questions_de.map((text) => ({ text, category: c.key })));
for (const fit of FIT_EXAMPLES) {
  if (!allExamples.some((e) => e.text === fit && e.category === "6_aligner_fit")) throw new Error(`fit example not found: ${fit}`);
}
const cases: Case[] = [
  ...allExamples.map((e) => ({
    text: e.text,
    expected: e.category,
    medical: e.category === "8_medical" || FIT_EXAMPLES.includes(e.text),
    source: "taxonomy",
  })),
  ...PO_SCENARIOS,
];

const pct = (n: number, d: number) => (d === 0 ? "–" : `${Math.round((n / d) * 100)} % (${n}/${d})`);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const model = process.env.GEMINI_MODEL || /DEFAULT_GEMINI_MODEL = "([^"]+)"/.exec(readFileSync("src/lib/chatbot/llm.ts", "utf8"))?.[1] || "unknown";

// classifyTicket logs LLM failures via console.error; capture them (status only, no content).
let lastLlmError: string | null = null;
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const text = args.map(String).join(" ");
  if (text.startsWith("classify:")) lastLlmError = text;
  else originalError(...args);
};

async function main() {
  // 1. Medical guard.
  const guardResults = cases.map((c) => ({ c, guard: checkConversation([c.text]) }));
  const medical = guardResults.filter((r) => r.c.medical);
  const others = guardResults.filter((r) => !r.c.medical);
  const recall = medical.filter((r) => r.guard.medical).length;
  const falsePositives = others.filter((r) => r.guard.medical);

  // 2. Retrieval (non-medical questions).
  const retrievalHits = others.filter((r) => retrieve(r.c.text).some((chunk) => chunk.score >= MIN_SCORE));
  const retrievalMisses = others.filter((r) => !retrievalHits.includes(r));

  // 3. Classification – guard first; the LLM only for messages the guard did not flag.
  let llmCalls = 0;
  let llmFailures = 0;
  let quotaStop = false;
  const rows: { c: Case; category: string | null; sub: string | null; via: "guard" | "llm" | "failed" | "skipped"; error?: string }[] = [];
  for (const { c, guard } of guardResults) {
    if (!guard.medical && (llmCalls >= MAX_LLM_CALLS || quotaStop)) {
      rows.push({ c, category: null, sub: null, via: "skipped" });
      continue;
    }
    if (!guard.medical) {
      if (llmCalls > 0) await sleep(LLM_GAP_MS);
      llmCalls++;
    }
    lastLlmError = null;
    const { ai, final } = await classifyTicket({ messages: [{ role: "user", content: c.text }], guard });
    const via = guard.medical ? "guard" : ai ? "llm" : "failed";
    if (via === "failed") {
      llmFailures++;
      // Daily free-tier quota: stop calling (the remaining questions are reported as skipped).
      // (set inside the console.error hook, so TypeScript cannot see the assignment)
      if ((lastLlmError as string | null)?.includes("429")) quotaStop = true;
    }
    rows.push({ c, category: final.category, sub: final.sub_category, via, error: via === "failed" ? (lastLlmError ?? undefined) : undefined });
    process.stdout.write(via === "guard" ? "g" : via === "llm" ? "." : "x");
  }
  process.stdout.write("\n");

  const classified = rows.filter((r) => r.via === "guard" || r.via === "llm");
  const correct = classified.filter((r) => r.category === r.c.expected);
  const llmRows = rows.filter((r) => r.via === "llm");
  const llmCorrect = llmRows.filter((r) => r.category === r.c.expected);
  const wrong = classified.filter((r) => r.category !== r.c.expected);
  const subDistribution = new Map<string, number>();
  for (const r of classified) {
    const key = `${r.category ?? "null"} / ${r.sub ?? "–"}`;
    subDistribution.set(key, (subDistribution.get(key) ?? 0) + 1);
  }

  // 4. Security: reading the ticket table without the secret key must fail or return nothing.
  const url = process.env.SUPABASE_URL;
  const security: { check: string; result: string; ok: boolean }[] = [];
  if (url) {
    const read = async (label: string, key: string | null) => {
      const headers: Record<string, string> = key ? { apikey: key, Authorization: `Bearer ${key}` } : {};
      const response = await fetch(`${url}/rest/v1/ticket?select=id&limit=5`, { headers });
      const body = await response.json().catch(() => null);
      const rowsReturned = Array.isArray(body) ? body.length : 0;
      const ok = !response.ok || rowsReturned === 0;
      security.push({ check: label, result: response.ok ? `HTTP ${response.status}, ${rowsReturned} rows` : `HTTP ${response.status} denied`, ok });
    };
    await read("No key", null);
    await read("Invalid key", "invalid-key-for-evaluation");
    if (process.env.SUPABASE_PUBLISHABLE_KEY) await read("Publishable key", process.env.SUPABASE_PUBLISHABLE_KEY);
    else security.push({ check: "Publishable key", result: "not run (SUPABASE_PUBLISHABLE_KEY not set)", ok: true });
  }

  const skipped = rows.filter((r) => r.via === "skipped").length;
  const date = new Date().toISOString().slice(0, 10);
  const table = [
    "| Metric | Result |",
    "|---|---|",
    `| Medical guard – recall (8_medical + fit_issues) | ${pct(recall, medical.length)} |`,
    `| Medical guard – false positives (other questions) | ${pct(falsePositives.length, others.length)} |`,
    `| Retrieval – non-medical questions with a chunk ≥ ${MIN_SCORE} | ${pct(retrievalHits.length, others.length)} |`,
    `| Classification – correct category (guard + LLM) | ${pct(correct.length, classified.length)} |`,
    `| Classification – correct category (LLM only) | ${pct(llmCorrect.length, llmRows.length)} |`,
    `| LLM calls / failed / skipped | ${llmCalls} / ${llmFailures} / ${skipped}${quotaStop ? " (stopped: quota)" : ""} |`,
    ...security.map((s) => `| Security – ticket table, ${s.check} | ${s.ok ? "✓" : "✗"} ${s.result} |`),
  ].join("\n");

  const details = [
    falsePositives.length ? `**Guard false positives:**\n${falsePositives.map((r) => `- ${r.c.expected}: „${r.c.text}“`).join("\n")}` : "**Guard false positives:** none",
    medical.some((r) => !r.guard.medical)
      ? `**Guard misses:**\n${medical.filter((r) => !r.guard.medical).map((r) => `- ${r.c.expected}: „${r.c.text}“`).join("\n")}`
      : "**Guard misses:** none",
    rows.some((r) => r.via === "failed")
      ? `**LLM failures (not counted in the accuracy):**\n${rows.filter((r) => r.via === "failed").map((r) => `- ${r.c.expected}: „${r.c.text}“ – ${r.error ?? "unknown"}`).join("\n")}`
      : "",
    retrievalMisses.length ? `**No chunk above the threshold:**\n${retrievalMisses.map((r) => `- ${r.c.expected}: „${r.c.text}“`).join("\n")}` : "",
    wrong.length
      ? `**Wrong category:**\n${wrong.map((r) => `- expected ${r.c.expected}, got ${r.category ?? "null"} (${r.via}): „${r.c.text}“`).join("\n")}`
      : "**Wrong category:** none",
    `**Sub-category distribution (no labels, for information):**\n${[...subDistribution.entries()].sort().map(([k, n]) => `- ${k}: ${n}`).join("\n")}`,
  ].filter(Boolean).join("\n\n");

  const report = `# Evaluation results

Date: ${date} · Model: ${model} · Test set: ${cases.length} questions (${allExamples.length} taxonomy examples + ${PO_SCENARIOS.length} demo scenarios from Po) · Run as in production: medical guard first, LLM only for questions the guard does not flag.

${table}

Note: Most test questions were generated with AI when the taxonomy was created; next step: evaluate on real tickets.

${details}
`;
  writeFileSync("docs/evaluation-results.md", report);
  console.log(`\nModel: ${model} · ${cases.length} questions\n\n${table}\n\nSaved to docs/evaluation-results.md`);
}

main().catch((error) => {
  originalError(error instanceof Error ? error.message : error);
  process.exit(1);
});
