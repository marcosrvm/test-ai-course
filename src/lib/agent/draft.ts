import "server-only";
import { generate } from "@/lib/chatbot/llm";
import { getChunksById, MIN_SCORE, retrieve, type Chunk, type RetrievedChunk } from "@/lib/chatbot/retrieve";
import { getCategory } from "@/lib/chatbot/taxonomy";

/*
 * AI reply drafts for non-clinical tickets (German, "du"), written only from the
 * knowledge-base chunks that match the customer's messages. The agent edits and sends.
 * Contact data never goes to the LLM – only the first name for the greeting.
 */

export const VERIFIED_CONFIDENCE = 0.85; // Po's QA guardrail: below this → "Needs verification"

export type DraftSource = { title: string; url: string };
// sourceIds: chunks the LLM says it used, limited to the retrieved ones (saved as source_chunk_ids).
export type Draft = { text: string; confidence: number; sourceIds: string[]; sources: DraftSource[] };

// E-mail addresses or phone numbers typed into a message are masked before the LLM call.
const redact = (text: string) =>
  text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[E-Mail]").replace(/\+?\d[\d\s\-/()]{6,}\d/g, "[Telefon]");

const greetingName = (firstName: string | null) => (firstName ?? "").replace(/\s*\(Demo\)\s*$/, "").trim();

// The chunks a draft may use.
function draftChunks(customerMessages: string[]): RetrievedChunk[] {
  const byId = new Map<string, RetrievedChunk>();
  // Each message on its own, then all together; keep the best score per chunk.
  for (const query of [...customerMessages, customerMessages.join(" ")]) {
    for (const chunk of retrieve(query)) {
      if (chunk.score < MIN_SCORE) continue;
      const known = byId.get(chunk.id);
      if (!known || known.score < chunk.score) byId.set(chunk.id, chunk);
    }
  }
  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 4);
}

const toSources = (chunks: Chunk[]): DraftSource[] => chunks.map((c) => ({ title: c.title, url: c.source }));

function systemPrompt(category: string | null, chunks: RetrievedChunk[]): string {
  const behaviour = category ? getCategory(category)?.bot_behaviour : undefined;
  const context = chunks.map((c) => `### id: ${c.id}\nTitel: ${c.title}\n${c.text}`).join("\n\n");
  return `Du schreibst einen Antwortentwurf des smileunion-Teams auf eine Kundenanfrage. Ein Mensch prüft und sendet ihn.

Regeln:
- Deutsch, per "du", freundlich, 3–6 Sätze, ohne Werbe-Superlative.
- Beginne mit der Anrede aus der Nachricht des Systems und ende mit "Viele Grüße\\nDein smileunion-Team".
- Verwende NUR Informationen aus den Abschnitten unten. Erfinde keine Preise, Fristen oder Bedingungen.
- Was die Abschnitte nicht beantworten: schreibe, dass das Team das prüft und sich meldet.
- Keine medizinischen Ratschläge, keine Aussage, ob jemand für eine Behandlung geeignet ist.
${behaviour ? `- Hinweis zur Kategorie (intern, englisch): ${behaviour}\n` : ""}
Antworte ausschließlich mit JSON:
{"draft": string, "used_ids": string[], "fully_answered": boolean, "confidence": number}
"used_ids": die ids der Abschnitte, die du für den Entwurf verwendet hast.
"confidence" (0–1): wie vollständig die Abschnitte die Anfrage abdecken.

Abschnitte:

${context}`;
}

export async function generateDraft(input: {
  category: string | null;
  firstName: string | null;
  customerMessages: string[];
}): Promise<Draft> {
  const name = greetingName(input.firstName);
  const salutation = name ? `Hallo ${name},` : "Hallo,";
  const chunks = draftChunks(input.customerMessages);

  // Nothing in the knowledge base: a holding reply without the LLM, clearly unverified.
  if (chunks.length === 0) {
    return {
      text: `${salutation}\n\ndanke für deine Nachricht. Wir prüfen dein Anliegen und melden uns so schnell wie möglich bei dir.\n\nViele Grüße\nDein smileunion-Team`,
      confidence: 0,
      sourceIds: [],
      sources: [],
    };
  }

  const raw = await generate({
    system: systemPrompt(input.category, chunks),
    messages: [
      {
        role: "user",
        content: `Anrede: ${salutation}\n\nNachrichten der Kundin bzw. des Kunden:\n${input.customerMessages.map((m) => `- ${redact(m)}`).join("\n")}`,
      },
    ],
  });

  const data = JSON.parse(raw) as { draft?: unknown; used_ids?: unknown; fully_answered?: unknown; confidence?: unknown };
  if (typeof data.draft !== "string" || !data.draft.trim()) throw new Error("invalid draft output");

  // Like used_ids in /api/chat: ids that were not retrieved are ignored.
  const usedIds = Array.isArray(data.used_ids) ? data.used_ids.filter((id): id is string => typeof id === "string") : [];
  const used = chunks.filter((c) => usedIds.includes(c.id));
  let confidence = Math.min(1, Math.max(0, Number(data.confidence) || 0));
  // Guardrails: no cited chunk → at most 0.5; partly answered → at most 0.7.
  if (used.length === 0) confidence = Math.min(confidence, 0.5);
  if (data.fully_answered !== true) confidence = Math.min(confidence, 0.7);

  return {
    text: data.draft.trim(),
    confidence: Math.round(confidence * 100) / 100,
    sourceIds: used.map((c) => c.id),
    sources: toSources(used),
  };
}

// Saved source_chunk_ids → titles and URLs from knowledge-base.json (no new search).
export const sourcesFromIds = (ids: unknown): DraftSource[] =>
  Array.isArray(ids) ? toSources(getChunksById(ids.filter((id): id is string => typeof id === "string"))) : [];
