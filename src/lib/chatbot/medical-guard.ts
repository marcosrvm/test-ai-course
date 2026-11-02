import { stem } from "./stem";

/*
 * Medical guard: runs in code before the cache, retrieval and any LLM call.
 * Any health question or complaint goes to the dentist team. When unsure, a message
 * counts as medical: a false positive is acceptable, a missed health question is not.
 *
 * Match types (list entries and the message are normalised the same way:
 * lowercase, ä → ae, ö → oe, ü → ue, ß → ss, other accents removed (é → e, ñ → n),
 * then light stemming). Terms in German, English and Spanish:
 *   word   – whole word only:        "wund" matches "wunde", not "wunderschön"
 *   start  – at the start of a word: "Krone" matches "Kronen"
 *   inside – anywhere in a word:     "schmerz" matches "Kieferschmerzen"
 *   phrase – consecutive words:      "tut weh"
 * "Kiefer" alone is deliberately missing: it matches "Kieferorthopädie" from the website.
 */
type TermList = { word?: string[]; start?: string[]; inside?: string[]; phrase?: string[] };

const MEDICAL: TermList = {
  word: [
    "weh", "wund", "Wunde", "locker", "Fieber", "Eiter", "Karies", "fever", "swollen",
    "herida", "flojo", "floja", "fiebre", "pus", "llaga", "afta",
  ],
  start: [
    "Krone", "Druckstelle", "Zahnfleisch", "geschwollen", "Aphthe", "Infektion", "wackel",
    "Implantat", "Wurzelbehandlung", "Weisheitszahn", "Parodontitis", "Allerg", "Ausschlag",
    "Medikament", "schwanger", "Taubheit", "Knack", "Unfall",
    "wehtu", "wehgetan", "wehtat",           // "wehtut", "wehtun", "weh getan" – like "tut weh"
    "Verfeinerungsschiene", "Refinement",    // refinement trays are clinical
    // English basics ("allergic" is already covered by "Allerg")
    "pain", "hurt", "bleed", "swell", "infect", "toothache",
    // Spanish, same topics: "duele" / "dolor" like "weh" / "Schmerz" ("¿Duele el tratamiento?"
    // counts as medical, like "Tut die Behandlung weh?" and "Does the treatment hurt?").
    "dolor", "duel", "doli", "sangr", "hinch", "inflam", "infecci", "encia", "corona", "implante",
    "endodoncia", "absceso", "alergi", "erupci", "medicament", "embaraz", "entumec", "accidente",
    "refinamiento",
  ],
  inside: ["schmerz", "blut", "entzünd", "schwell"],
  phrase: ["tut weh", "Loch im Zahn", "muela del juicio", "agujero en el diente"],
};

// Aligner fit (kind "fit" → 6_aligner_fit / fit_issues): only together with an
// aligner word ("Der Termin passt mir nicht" and "Engstand" are not medical).
const FIT: TermList = {
  word: ["eng", "enge", "enger", "engen", "locker", "tight", "loose", "apretado", "apretada", "suelto", "suelta", "flojo", "floja"],
  start: ["drückt", "scharf", "Kante", "aprieta", "borde", "afilad", "roza"],
  phrase: ["passt nicht", "sitzt nicht", "doesn t fit", "does not fit", "doesnt fit", "no encaja", "no ajusta", "no queda bien"],
};
const ALIGNER: TermList = {
  word: ["Schiene", "Schienen", "Aligner", "Zahnschiene", "aligners", "tray", "trays", "férula", "alineador", "alineadores"],
};

// Progress photos only when the customer asks for a judgement ("Sind die Fotos ok?").
const PHOTOS: TermList = { inside: ["foto"] };
const JUDGEMENT: TermList = { word: ["ok", "okay", "normal", "bien"], start: ["richtig", "anschau", "bewert", "revis"] };

// A broken tooth: "abgebrochen" only together with "Zahn"/"Zähne" as a whole word
// ("Meine Zahnschiene ist abgebrochen" is not medical).
const BROKEN: TermList = { word: ["abgebrochen", "broken", "roto", "rota", "partido", "partida", "rompió"] };
const TOOTH: TermList = { word: ["Zahn", "Zähne", "tooth", "teeth", "diente", "dientes", "muela", "muelas"] };

// Urgent (red alert for the team). Any urgent match is also medical.
const URGENT: TermList = {
  word: ["Fieber", "Eiter", "fever", "swollen", "fiebre", "pus"],
  start: ["geschwollen", "Unfall", "bleed", "swell", "hinch", "sangr", "accidente"],
  inside: ["blut", "schwell"],
};
// Urgent only in the same message as PAIN ("starken Schmerzen", "unerträglichen Schmerzen").
const INTENSITY: TermList = {
  start: ["stark", "extrem", "unerträglich", "severe", "strong", "unbearable", "fuert", "insoport", "intens", "mucho"],
};
const PAIN: TermList = { inside: ["schmerz"], start: ["pain", "hurt", "dolor", "duel"] };

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
