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
    "wehtu", "wehgetan", "wehtat",           // "wehtut", "wehtun", "weh getan" – like "tut weh"
    "Verfeinerungsschiene", "Refinement",    // refinement trays are clinical
  ],
  inside: ["schmerz", "blut", "entzünd", "schwell"],
  phrase: ["tut weh", "Loch im Zahn"],
};

// Aligner fit (kind "fit" → 6_aligner_fit / fit_issues): only together with an
// aligner word ("Der Termin passt mir nicht" and "Engstand" are not medical).
const FIT: TermList = {
  word: ["eng", "enge", "enger", "engen", "locker"],
  start: ["drückt", "scharf", "Kante"],
  phrase: ["passt nicht", "sitzt nicht"],
};
const ALIGNER: TermList = { word: ["Schiene", "Schienen", "Aligner", "Zahnschiene"] };

// Progress photos only when the customer asks for a judgement ("Sind die Fotos ok?").
const PHOTOS: TermList = { inside: ["foto"] };
const JUDGEMENT: TermList = { word: ["ok", "okay", "normal"], start: ["richtig", "anschau", "bewert"] };

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

export type MedicalCheck = {
  medical: boolean;
  urgent: boolean;
  // "fit" = aligner fit problem (6_aligner_fit), "medical" = other health topic (8_medical).
  kind: "fit" | "medical" | null;
  // List entries that fired – for tests and the team, never sent to an LLM.
  matched: string[];
};

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

// Returns the list entries (as written above) that match the message.
function find(message: Message, list: TermList): string[] {
  const key = (term: string) => stem(normalize(term).join(" "));
  return [
    ...(list.word ?? []).filter((t) => message.stems.includes(key(t))),
    ...(list.start ?? []).filter((t) => message.words.some((w) => w.startsWith(key(t)))),
    ...(list.inside ?? []).filter((t) => message.words.some((w) => w.includes(key(t)))),
    ...(list.phrase ?? []).filter((t) => message.text.includes(` ${normalize(t).join(" ")} `)),
  ];
}

// Both lists must match; returns the matches of both, or nothing.
const both = (message: Message, a: TermList, b: TermList): string[] => {
  const left = find(message, a);
  const right = left.length > 0 ? find(message, b) : [];
  return right.length > 0 ? [...left, ...right] : [];
};

export function checkMedical(text: string): MedicalCheck {
  const words = normalize(text);
  const message: Message = { words, stems: words.map(stem), text: ` ${words.join(" ")} ` };

  const fit = both(message, FIT, ALIGNER);
  const urgentMatches = [
    ...find(message, URGENT),
    ...both(message, INTENSITY, PAIN),
    ...both(message, BROKEN, TOOTH),
  ];
  const medicalMatches = [...find(message, MEDICAL), ...both(message, PHOTOS, JUDGEMENT)];

  const matched = [...new Set([...fit, ...urgentMatches, ...medicalMatches])];
  const medical = matched.length > 0;
  return {
    medical,
    urgent: urgentMatches.length > 0,
    kind: fit.length > 0 ? "fit" : medical ? "medical" : null,
    matched,
  };
}

// Server-side check over a whole conversation: medical if any customer message is.
export function checkConversation(customerMessages: string[]): MedicalCheck {
  const checks = customerMessages.map(checkMedical);
  const medical = checks.some((c) => c.medical);
  return {
    medical,
    urgent: checks.some((c) => c.urgent),
    kind: checks.some((c) => c.kind === "fit") ? "fit" : medical ? "medical" : null,
    matched: [...new Set(checks.flatMap((c) => c.matched))],
  };
}
