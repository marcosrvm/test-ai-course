// Phase 5 – evaluation of the chatbot pipeline, run as in production (medical guard first).
// Run: npm run eval   (= tsx --env-file=.env.local scripts/eval.ts)
// Prints a results table and writes docs/evaluation-results.md. Prints no secrets.
import { readFileSync, writeFileSync } from "node:fs";
import { POST as chat } from "@/app/api/chat/route";
import { classifyTicket } from "@/lib/chatbot/classify";
import { detectLanguage, type Language } from "@/lib/chatbot/language";
import { checkConversation, checkMedical } from "@/lib/chatbot/medical-guard";
import { EU_FINANCING_ID, MIN_SCORE, retrieve } from "@/lib/chatbot/retrieve";
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

/*
 * Chat scenarios (language, financing, Spanish guard). "guard" and "retrieval" run offline;
 * "chat" goes through the real /api/chat pipeline (guard → retrieval → translation → LLM),
 * one or two LLM calls each.
 */
type ChatReply = { answer: string; sources: { title: string; url: string }[]; route: string; fallback: boolean; offerTeam?: boolean };
type Scenario = { name: string; text: string } & (
  | { kind: "guard"; medical: boolean }
  | { kind: "retrieval"; check: (ids: string[]) => boolean }
  | { kind: "chat"; check: (reply: ChatReply) => string | null }
);

const EU_SOURCE = "smileunion.eu";
const FORBIDDEN_EU_WORDING =
  /another website|other website|international (web)?site|english version|andere[nrsm]? (web)?seite|andere[nrsm]? website|internationale[nrsm]? (web)?seite|englische[nrsm]? version|otra (página|web)|versión (en )?inglés/i;
const hasEuSource = (r: ChatReply) => r.sources.some((s) => s.url.includes(EU_SOURCE));
// Returns the first failed expectation, or null.
const expect = (...checks: [boolean, string][]) => checks.find(([ok]) => !ok)?.[1] ?? null;
const inLanguage = (r: ChatReply, language: Language): [boolean, string] => [
  detectLanguage(r.answer) === language,
  `answer not in ${language} (detected ${detectLanguage(r.answer) ?? "unknown"})`,
];
const answered = (r: ChatReply): [boolean, string] => [r.route === "general" && !r.fallback, `route ${r.route}, fallback ${r.fallback}`];

const SCENARIOS: Scenario[] = [
  {
    name: "Instalments (DE): .de offer only",
    text: "Kann ich die Behandlung in Raten zahlen?",
    kind: "chat",
    check: (r) => expect(answered(r), [!hasEuSource(r), ".eu source shown"], [!/klarna|splitit/i.test(r.answer), "mentions Klarna/Splitit"], [/72/.test(r.answer), "72 months missing"]),
  },
  {
    name: "Instalments (ES): .de offer only, in Spanish",
    text: "¿Puedo pagar el tratamiento a plazos?",
    kind: "chat",
    check: (r) => expect(answered(r), inLanguage(r, "es"), [!hasEuSource(r), ".eu source shown"], [!/klarna|splitit/i.test(r.answer), "mentions Klarna/Splitit"]),
  },
  {
    name: "Klarna: .eu chunk, one answer, handover",
    text: "Kann ich auch mit Klarna bezahlen?",
    kind: "chat",
    check: (r) =>
      expect(
        answered(r),
        [hasEuSource(r), ".eu source missing"],
        [r.offerTeam === true, "no handover offered"],
        [/72/.test(r.answer) && /klarna/i.test(r.answer), "not both offers"],
        [!FORBIDDEN_EU_WORDING.test(r.answer), "mentions another website / version"],
      ),
  },
  {
    name: "36 months: both financing chunks retrieved",
    text: "Can I pay over 36 months?",
    kind: "retrieval",
    check: (ids) => ids.includes(EU_FINANCING_ID) && ids.includes("ratenzahlung-bedingungen"),
  },
  {
    name: "36 months (EN): both offers, in English, handover",
    text: "Can I pay over 36 months?",
    kind: "chat",
    check: (r) =>
      expect(
        answered(r),
        inLanguage(r, "en"),
        [/72/.test(r.answer) && /36/.test(r.answer), "not both offers"],
        [r.offerTeam === true, "no handover offered"],
        [!FORBIDDEN_EU_WORDING.test(r.answer), "mentions another website / version"],
      ),
  },
  {
    name: "General financing never retrieves the .eu chunk",
    text: "Wie funktioniert die Ratenzahlung?",
    kind: "retrieval",
    check: (ids) => !ids.includes(EU_FINANCING_ID),
  },
  {
    name: "Payment methods: one-off / instalments, handover",
    text: "Welche Zahlungsmethoden gibt es? Kreditkarte oder PayPal?",
    kind: "chat",
    check: (r) =>
      expect(
        answered(r),
        [r.offerTeam === true, "no handover offered"],
        [!hasEuSource(r), ".eu source shown"],
        [!/nicht auf (der|unserer) (web)?seite|not on (the|our) website/i.test(r.answer), "says it is not on the website"],
      ),
  },
  {
    name: "Off-topic (EN): answer in English",
    text: "Who won the football match yesterday?",
    kind: "chat",
    check: (r) => expect([r.route === "general", `route ${r.route}`], inLanguage(r, "en")),
  },
  {
    name: "Off-topic (ES): answer in Spanish",
    text: "¿Quién ganó el partido de fútbol ayer?",
    kind: "chat",
    check: (r) => expect([r.route === "general", `route ${r.route}`], inLanguage(r, "es")),
  },
  {
    name: "Price (ES): finds the price chunk",
    text: "¿Cuánto cuesta el tratamiento?",
    kind: "chat",
    check: (r) => expect(answered(r), inLanguage(r, "es"), [r.sources.some((s) => s.url.includes("/pages/pricing")), "no pricing source"]),
  },
  { name: "Medical (ES): toothache", text: "Me duele mucho la muela desde ayer, ¿qué hago?", kind: "guard", medical: true },
  { name: "Medical (ES): bleeding gums", text: "Me sangran las encías cuando me pongo la férula.", kind: "guard", medical: true },
  { name: "Medical (ES): aligner too tight, sore", text: "La férula me aprieta mucho y tengo una herida en la encía.", kind: "guard", medical: true },
  // Same as "Tut die Behandlung weh?" / "Does the treatment hurt?", which the guard also flags.
  { name: "Medical (ES): ¿duele el tratamiento? (like DE/EN)", text: "¿Duele el tratamiento?", kind: "guard", medical: true },
  { name: "Not medical (ES): price question", text: "¿Cuánto cuesta el tratamiento?", kind: "guard", medical: false },
];

async function askChat(text: string): Promise<ChatReply> {
  const request = new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "eval" },
    body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
  });
  return (await (await chat(request)).json()) as ChatReply;
}

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

  // 5. Chat scenarios (language, financing, Spanish guard).
  const scenarioRows: { s: Scenario; ok: boolean; detail: string }[] = [];
  for (const s of SCENARIOS) {
    if (s.kind === "guard") {
      const result = checkMedical(s.text);
      scenarioRows.push({ s, ok: result.medical === s.medical, detail: result.medical ? `guard: ${result.matched.join(", ")}` : "guard: no match" });
    } else if (s.kind === "retrieval") {
      const ids = retrieve(s.text).filter((c) => c.score >= MIN_SCORE).map((c) => c.id);
      scenarioRows.push({ s, ok: s.check(ids), detail: ids.join(", ") || "no chunk" });
    } else {
      await sleep(LLM_GAP_MS);
      const reply = await askChat(s.text);
      const failure = s.check(reply);
      scenarioRows.push({ s, ok: failure === null, detail: failure ?? `„${reply.answer.replace(/\s+/g, " ").slice(0, 160)}…“` });
    }
    process.stdout.write(scenarioRows.at(-1)!.ok ? "+" : "!");
  }
  process.stdout.write("\n");
  const spanishMedical = scenarioRows.filter((r) => r.s.kind === "guard" && r.s.medical);

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
    `| Medical guard – Spanish medical cases | ${pct(spanishMedical.filter((r) => r.ok).length, spanishMedical.length)} |`,
    `| Chat scenarios passed (language, financing, guard) | ${pct(scenarioRows.filter((r) => r.ok).length, scenarioRows.length)} |`,
    ...security.map((s) => `| Security – ticket table, ${s.check} | ${s.ok ? "✓" : "✗"} ${s.result} |`),
  ].join("\n");

  const scenarioTable = [
    "| Scenario | Question | Result | Detail |",
    "|---|---|---|---|",
    ...scenarioRows.map((r) => `| ${r.s.name} | ${r.s.text} | ${r.ok ? "✓" : "✗"} | ${r.detail.replace(/\|/g, "/")} |`),
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

  // Earlier runs are kept below the current one (everything from the first "## Before" heading).
  let previous = "";
  try {
    const old = readFileSync("docs/evaluation-results.md", "utf8");
    const at = old.indexOf("## Before");
    if (at >= 0) previous = `\n${old.slice(at)}`;
  } catch {
    // first run: nothing to keep
  }

  const report = `# Evaluation results

## Current: ${date}

Date: ${date} · Model: ${model} · Test set: ${cases.length} questions (${allExamples.length} taxonomy examples + ${PO_SCENARIOS.length} demo scenarios from Po) · Run as in production: medical guard first, LLM only for questions the guard does not flag.

${table}

Note: Most test questions were generated with AI when the taxonomy was created; next step: evaluate on real tickets.

Known limit (multilingual safety): the keyword guard covers German, English and Spanish. In the chat, the LLM's health flag is a second safety layer for any other language (a health answer is replaced by the dentist answer), and an English or Spanish message that finds no chunk is translated to German and checked again. At handover, the server re-checks with the keyword guard only: in other languages the ticket still reaches the dentist through the classification's second layer (AI says 8_medical → P1, dental), but without an automatic red alert.

### Chat scenarios (language, financing, Spanish guard)

${scenarioTable}

${details}
${previous}`;
  writeFileSync("docs/evaluation-results.md", report);
  console.log(`\nModel: ${model} · ${cases.length} questions\n\n${table}\n\nSaved to docs/evaluation-results.md`);
}

main().catch((error) => {
  originalError(error instanceof Error ? error.message : error);
  process.exit(1);
});
