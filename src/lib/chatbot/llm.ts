// Server only: imported by the API route, never by client components (the key must not reach the browser).
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export type ChatMessage = { role: "user" | "assistant"; content: string };

// Shared persona for every chat mode. Fixed UI texts stay German (smileunion only
// operates in Germany); only LLM answers follow the customer's language.
export const PERSONA =
  "You are smileunion's AI assistant, with the tone of a good patient coordinator: warm, professional, concise. Never claim to be a human. Use 'du'. Reply in the customer's language (default German).";

export type GenerateInput = { system: string; messages: ChatMessage[] };

type Provider = (input: GenerateInput) => Promise<string>;

// Current stable free-tier Flash model (checked against the models list on 28/10/2026).
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";

let gemini: GoogleGenAI | null = null;

const generateWithGemini: Provider = async ({ system, messages }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  gemini ??= new GoogleGenAI({ apiKey });

  const response = await gemini.models.generateContent({
    model: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    config: {
      systemInstruction: system,
      temperature: 0.2,
      maxOutputTokens: 400,
      responseMimeType: "application/json",
      // Thinking tokens count against maxOutputTokens; the default level used ~300 of them.
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  });
  return response.text ?? "";
};

// Add new providers here (e.g. "claude"); the route only calls generate().
const providers: Record<string, Provider> = {
  gemini: generateWithGemini,
};

export function generate(input: GenerateInput): Promise<string> {
  const name = process.env.CHAT_PROVIDER || "gemini";
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown CHAT_PROVIDER: ${name}`);
  return provider(input);
}
