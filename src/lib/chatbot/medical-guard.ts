import { stem } from "./stem";

/*
 * Medical guard: runs in code before the cache, retrieval and any LLM call.
 * Any health question or complaint goes to the dentist team. When unsure, a message
 * counts as medical: a false positive is acceptable, a missed health question is not.
 *
 * Match types (list entries and the message are normalised the same way:
 * lowercase, ä → ae, ö → oe, ü → ue, ß → ss, then light stemming):
 *   word   – whole word only:        "wund" matches "wunde", not "wunderschön"
 *   start  – at the start of a word: "Krone" matches "Kronen"
 *   inside – anywhere in a word:     "schmerz" matches "Kieferschmerzen"
 *   phrase – consecutive words:      "tut weh"
 * "Kiefer" alone is deliberately missing: it matches "Kieferorthopädie" from the website.
 */
type TermList = { word?: string[]; start?: string[]; inside?: string[]; phrase?: string[] };

const MEDICAL: TermList = {
  word: ["weh", "wund", "Wunde", "locker", "Fieber", "Eiter", "Karies"],
  start: [
    "Krone", "Druckstelle", "Zahnfleisch", "geschwollen", "Aphthe", "Infektion", "wackel",
    "Implantat", "Wurzelbehandlung", "Weisheitszahn", "Parodontitis", "Allerg", "Ausschlag",
    "Medikament", "schwanger", "Taubheit", "Knack", "Unfall",
  ],
  inside: ["schmerz", "blut", "entzünd", "schwell"],
  phrase: ["tut weh", "Loch im Zahn"],
};

// Medical only together with an aligner word ("Der Termin passt mir nicht" is not medical).
const ALIGNER_COMPLAINT: TermList = {
  start: ["drückt"],
  phrase: ["passt nicht", "sitzt nicht", "zu eng"],
};
const ALIGNER: TermList = { word: ["Schiene", "Schienen", "Aligner", "Zahnschiene"] };

// A broken tooth: "abgebrochen" only together with "Zahn"/"Zähne" as a whole word
// ("Meine Zahnschiene ist abgebrochen" is not medical).
const BROKEN: TermList = { word: ["abgebrochen"] };
const TOOTH: TermList = { word: ["Zahn", "Zähne"] };

// Urgent (red alert for the team). Any urgent match is also medical.
const URGENT: TermList = {
  word: ["Fieber", "Eiter"],
  start: ["geschwollen", "Unfall"],
  inside: ["blut", "schwell"],
};
// Urgent only in the same message as PAIN ("starken Schmerzen", "unerträglichen Schmerzen").
const INTENSITY: TermList = { start: ["stark", "extrem", "unerträglich"] };
const PAIN: TermList = { inside: ["schmerz"] };

const normalize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .split(/[^a-z]+/)
    .filter(Boolean);

type Message = { words: string[]; stems: string[]; text: string };

function matches(message: Message, list: TermList): boolean {
  const entries = (terms: string[] = []) => terms.map((t) => stem(normalize(t).join(" ")));
  return (
    entries(list.word).some((s) => message.stems.includes(s)) ||
    entries(list.start).some((s) => message.words.some((w) => w.startsWith(s))) ||
    entries(list.inside).some((s) => message.words.some((w) => w.includes(s))) ||
    (list.phrase ?? []).some((p) => message.text.includes(` ${normalize(p).join(" ")} `))
  );
}

export function checkMedical(text: string): { medical: boolean; urgent: boolean } {
  const words = normalize(text);
  const message: Message = { words, stems: words.map(stem), text: ` ${words.join(" ")} ` };

  const brokenTooth = matches(message, BROKEN) && matches(message, TOOTH);
  const urgent =
    brokenTooth ||
    matches(message, URGENT) ||
    (matches(message, INTENSITY) && matches(message, PAIN));
  const medical =
    urgent ||
    matches(message, MEDICAL) ||
    (matches(message, ALIGNER_COMPLAINT) && matches(message, ALIGNER));

  return { medical, urgent };
}
