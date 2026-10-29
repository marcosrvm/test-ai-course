import { generate, type ChatMessage } from "./llm";
import type { MedicalCheck } from "./medical-guard";
import {
  getCategory,
  listCategories,
  type CategoryKey,
  type Handling,
  type Priority,
  type Queue,
} from "./taxonomy";

/*
 * Ticket classification for the human handover.
 * - Medical guard fired → the rule decides, NO LLM call (health data stays out of the AI).
 * - Otherwise one LLM call suggests category, sub-category, priority, sentiment and summary
 *   (kept as ai_suggestion); the final values come from the taxonomy routing_rules in code.
 * - LLM failure → the ticket is still created, unclassified and handled manually.
 */

export type Sentiment = "positive" | "neutral" | "negative" | "high_agitation";
export type QuizContext = {
  q1?: string | null;
  q2?: string | null;
  q3?: string | null;
  q4?: string | null;
  q5?: string | null;
  q6?: string | null;
  result_type: "retainer" | "strong_crowding" | "suitable";
};

export type AiSuggestion = {
  category: CategoryKey;
  sub_category: string;
  priority: Priority;
  queue: Queue;  // default queue of the suggested sub-category
  sentiment: Sentiment;
  summary: string;
  confidence: number;
};

export type FinalTicketValues = {
  category: CategoryKey | null;
  sub_category: string | null;
  priority: Priority;
  queue: Queue;
  automation_level: Handling;
  alert: "none" | "red";
  summary: string;
};

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative", "high_agitation"];
const PRIORITIES: Priority[] = ["P1", "P2", "P3"];

const lastCustomerMessage = (messages: ChatMessage[]) =>
  [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

// Contact data never goes to the LLM: the contact form is not passed in, and e-mail
// addresses or phone numbers typed into the chat are masked.
const redact = (text: string) =>
  text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[E-Mail]")
    .replace(/\+?\d[\d\s\-/()]{6,}\d/g, "[Telefon]");

function taxonomyForPrompt(): string {
  return listCategories()
    .map((c) => {
      const subs = c.subcategories.map((s) => `    - ${s.key}: ${s.label}`).join("\n");
      const examples = c.example_questions_de.slice(0, 2).map((q) => `    „${q}“`).join("\n");
      return `${c.key} – ${c.label}\n  Unterkategorien:\n${subs}\n  Beispiele:\n${examples}`;
    })
    .join("\n\n");
}

const SYSTEM_PROMPT = `Du klassifizierst Kundenanfragen von smileunion (unsichtbare Zahnschienen) für das Support-Team.
Die Kundin bzw. der Kunde möchte mit einem Menschen sprechen; du bereitest das Ticket vor.

Taxonomie (category – Label, darunter sub_category-Schlüssel):

${taxonomyForPrompt()}

Regeln:
- Wähle genau eine category und eine sub_category aus der Taxonomie (nur die Schlüssel verwenden).
- priority: P1 (dringend), P2 (hoch) oder P3 (mittel).
- sentiment: positive, neutral, negative oder high_agitation (sehr verärgert, Abwanderungsgefahr).
- summary: Deutsch, 1–2 Sätze, nur Fakten aus dem Gespräch, nichts erfinden, keine Namen oder Kontaktdaten.
- confidence: Zahl zwischen 0 und 1, wie sicher du bei category und sub_category bist.

Antworte ausschließlich mit JSON:
{"category": string, "sub_category": string, "priority": string, "sentiment": string, "summary": string, "confidence": number}`;

function transcript(messages: ChatMessage[], quiz?: QuizContext | null): string {
  const lines = messages.map((m) => `${m.role === "user" ? "Kunde" : "Assistent"}: ${redact(m.content)}`);
  const quizLine = quiz ? `\n\nSelbsttest-Ergebnis: ${quiz.result_type}` : "";
  return `Gespräch:\n${lines.join("\n")}${quizLine}`;
}

function parseSuggestion(raw: string): AiSuggestion | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const category = getCategory(String(data.category));
  const sub = category?.subcategories.find((s) => s.key === data.sub_category);
  if (!category || !sub) return null;
  if (!PRIORITIES.includes(data.priority as Priority)) return null;
  if (!SENTIMENTS.includes(data.sentiment as Sentiment)) return null;
  if (typeof data.summary !== "string" || !data.summary.trim()) return null;
  const confidence = Number(data.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;
  return {
    category: category.key,
    sub_category: sub.key,
    priority: data.priority as Priority,
    queue: sub.queue,
    sentiment: data.sentiment as Sentiment,
    summary: data.summary.trim(),
    confidence,
  };
}

// taxonomy.json routing_rules, applied in code (first match wins); rule 1 for the guard is handled above.
function applyRoutingRules(ai: AiSuggestion, quiz?: QuizContext | null): FinalTicketValues {
  const sub = getCategory(ai.category)!.subcategories.find((s) => s.key === ai.sub_category)!;
  const final: FinalTicketValues = {
    category: ai.category,
    sub_category: ai.sub_category,
    priority: sub.priority,
    queue: sub.queue,
    automation_level: sub.handling,
    alert: "none",
    summary: ai.summary,
  };

  if (ai.category === "8_medical") {
    // Rule 1, second safety layer: the AI recognised a medical topic the guard missed.
    Object.assign(final, { priority: "P1", queue: "dental", automation_level: "dentist_handover" });
  } else if (quiz?.result_type === "retainer") {
    // Rule 2: category and priority stay as classified.
    final.queue = "dental";
  } else if (ai.category === "7_complaints") {
    // Rule 3.
    final.queue = "senior";
    if (ai.sentiment === "high_agitation") final.priority = "P1";
  }

  // A handover ticket is never zero touch: the bot could not resolve it.
  if (final.automation_level === "zero_touch") final.automation_level = "ai_draft_approval";
  return final;
}

export async function classifyTicket({
  messages,
  guard,
  quiz,
}: {
  messages: ChatMessage[];
  guard: MedicalCheck;
  quiz?: QuizContext | null;
}): Promise<{ ai: AiSuggestion | null; final: FinalTicketValues }> {
  const last = lastCustomerMessage(messages);

  if (guard.medical) {
    const fit = guard.kind === "fit";
    const topic = fit ? "Passformproblem mit der Schiene" : "Gesundheitliche Frage oder Beschwerde";
    return {
      ai: null,
      final: {
        category: fit ? "6_aligner_fit" : "8_medical",
        sub_category: fit ? "fit_issues" : null,
        priority: "P1",
        queue: "dental",
        automation_level: "dentist_handover",
        alert: guard.urgent ? "red" : "none",
        summary: `${guard.urgent ? "Dringend: " : ""}${topic} – vom medizinischen Guard erkannt (ohne KI), Prüfung durch das Zahnärzteteam. Letzte Kundennachricht: „${last}“`,
      },
    };
  }

  try {
    const raw = await generate({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: transcript(messages, quiz) }],
    });
    const ai = parseSuggestion(raw);
    if (ai) return { ai, final: applyRoutingRules(ai, quiz) };
    console.error("classify: invalid LLM output");
  } catch (error) {
    const status = (error as { status?: number }).status;
    console.error(`classify: LLM call failed${status ? ` (status ${status})` : ""}`);
  }

  // The CRM works without AI: unclassified ticket, handled manually.
  return {
    ai: null,
    final: {
      category: null,
      sub_category: null,
      priority: "P3",
      queue: "general",
      automation_level: "manual",
      alert: "none",
      summary: `Automatische Klassifizierung nicht verfügbar. Letzte Kundennachricht: „${last}“`,
    },
  };
}
