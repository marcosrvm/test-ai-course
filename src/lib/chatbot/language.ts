// Rough language detection for the customer's last message (DE / EN / ES), used to tell
// the model which language to answer in and whether a retrieval miss is worth translating.
// No LLM call: counts common function words and language-specific characters.
export type Language = "de" | "en" | "es";

export const LANGUAGE_NAMES: Record<Language, string> = { de: "German", en: "English", es: "Spanish" };

const MARKERS: Record<Language, Set<string>> = {
  de: new Set([
    "ich", "du", "und", "ist", "die", "der", "das", "nicht", "wie", "was", "kann", "mit", "für", "ein", "eine",
    "habe", "hallo", "danke", "auch", "bei", "wann", "lange", "kostet", "mein", "meine", "gibt", "zu", "welche", "welcher",
  ]),
  en: new Set([
    "the", "is", "are", "how", "what", "can", "i", "you", "do", "does", "my", "much", "it", "with", "hello",
    "hi", "thanks", "thank", "who", "will", "would", "your", "and", "of", "to", "long", "cost", "there",
  ]),
  es: new Set([
    "el", "la", "los", "las", "que", "qué", "es", "y", "por", "para", "cómo", "como", "cuánto", "cuanto",
    "puedo", "tengo", "hola", "gracias", "un", "una", "del", "mi", "se", "con", "cuesta", "hay", "quién",
  ]),
};

export function detectLanguage(text: string): Language | null {
  const lower = text.toLowerCase();
  const words = lower.split(/[^\p{L}]+/u).filter(Boolean);
  const scores: Record<Language, number> = { de: 0, en: 0, es: 0 };
  for (const word of words) {
    for (const language of Object.keys(MARKERS) as Language[]) {
      if (MARKERS[language].has(word)) scores[language]++;
    }
  }
  if (/[äöüß]/.test(lower)) scores.de += 2;
  if (/[ñ¿¡]|[áéíóú]/.test(lower)) scores.es += 2;

  const ranked = (Object.keys(scores) as Language[]).sort((a, b) => scores[b] - scores[a]);
  const [best, second] = ranked;
  return scores[best] > 0 && scores[best] > scores[second] ? best : null;
}

// Appended to every system prompt: the answer follows the customer's LAST message.
export function languageRule(text: string): string {
  const language = detectLanguage(text);
  return language
    ? `Language: the customer's last message is in ${LANGUAGE_NAMES[language]}. Write "answer" in ${LANGUAGE_NAMES[language]}, even if earlier messages or the sections are in another language.`
    : `Language: write "answer" in the language of the customer's last message, even if earlier messages or the sections are in another language (default German).`;
}
