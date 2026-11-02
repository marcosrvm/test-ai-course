import MiniSearch from "minisearch";
import knowledgeBase from "./knowledge-base.json";
import { stem } from "./stem";

export type Chunk = {
  id: string;
  title: string;
  category: string;
  text: string;
  source: string;
};

export type RetrievedChunk = Chunk & { score: number };

/*
 * Minimum MiniSearch score a chunk needs to count as a hit. Chosen by running
 * on-topic and off-topic questions against the knowledge base: the lowest right
 * chunk for an on-topic question scored 7.8 ("Was ist in der Abdruckbox?"), while
 * off-topic questions ("Wie wird das Wetter morgen?", "Tut das weh?") reached at
 * most 2.8 through fuzzy or prefix matches of a single word. 6 lies between the two.
 * Off-topic questions that share a real keyword ("Wie viel kostet ein Auto?") still
 * pass; the model then answers with answered = false.
 */
export const MIN_SCORE = 6;
const TOP_K = 3;

// Small list of German function words and question words that carry no topic.
const STOPWORDS = new Set([
  "aber", "alle", "als", "also", "am", "an", "auch", "auf", "aus", "bei", "bin", "bis", "bist",
  "da", "damit", "dann", "das", "dass", "dein", "deine", "dem", "den", "der", "des", "dich", "die",
  "dir", "doch", "du", "ein", "eine", "einem", "einen", "einer", "es", "etwas", "euch", "für",
  "gibt", "hab", "habe", "haben", "hat", "hier", "ich", "ihr", "im", "in", "ist", "ja", "kann",
  "kannst", "man", "mich", "mir", "mit", "muss", "musst", "noch", "nur", "ob", "oder", "sie", "sind",
  "so", "über", "um", "und", "uns", "vom", "von", "vor", "war", "was", "welche", "welcher", "wenn",
  "wer", "werde", "werden", "wie", "wieso", "wir", "wird", "wo", "zu", "zum", "zur",
  "mein", "meine", "meinem", "meinen", "meiner", "ihr", "ihre", "euer", "eure", "sich",
  "bitte", "denn", "mal", "nicht", "kein", "keine", "sein", "soll", "sollte", "würde",
]);

// Query-side synonyms (by stem): "kostet" alone also hits every "kostenlos", so cost
// questions additionally search for "Preis"; "Garantie" is only part of longer words.
const SYNONYMS: Record<string, string> = {
  kost: "preis",
  teuer: "preis",
  bezahl: "preis",
  garanti: "bestpreisgarantie zufriedenheitsversprechen",
  // Financing → the "Ratenzahlung: Laufzeit, Zinsen und Rechenbeispiel" chunk ("in Raten" → "raten").
  rate: "ratenzahlung monatsraten zinsen laufzeit",
  ratenzahlung: "ratenzahlung monatsraten zinsen laufzeit",
  finanzierung: "ratenzahlung monatsraten zinsen laufzeit",
  abzahl: "ratenzahlung monatsraten zinsen laufzeit",
  monatlich: "ratenzahlung monatsraten zinsen laufzeit",
  // Payment methods → the price chunk (one-off payment or instalments).
  zahlungsmethod: "einmalzahlung ratenzahlung",
  zahlungsart: "einmalzahlung ratenzahlung",
  zahlungsmittel: "einmalzahlung ratenzahlung",
  kreditkart: "einmalzahlung ratenzahlung",
  paypal: "einmalzahlung ratenzahlung",
  lastschrif: "einmalzahlung ratenzahlung",
  überweisung: "einmalzahlung ratenzahlung",
};

// English questions: German search terms for the German knowledge base (query side only).
// Words German uses too ("Plan", "Aligner", "Retainer") are left out so German queries don't change.
const ENGLISH: Record<string, string> = {
  cost: "kosten preis",
  costs: "kosten preis",
  price: "preis",
  prices: "preis",
  expensive: "preis",
  pay: "zahlung ratenzahlung",
  payment: "zahlung ratenzahlung",
  methods: "einmalzahlung ratenzahlung",
  card: "einmalzahlung ratenzahlung",
  instalment: "ratenzahlung",
  instalments: "ratenzahlung",
  installment: "ratenzahlung",
  installments: "ratenzahlung",
  financing: "ratenzahlung",
  monthly: "ratenzahlung monat",
  treatment: "behandlung",
  impression: "abdruck abdruckbox",
  impressions: "abdruck abdruckbox",
  kit: "abdruckbox",
  appointment: "termin partnerpraxis",
  insurance: "krankenkasse",
  wear: "tragen tragezeit",
  clean: "reinigung",
  cleaning: "reinigung",
  duration: "dauer behandlungsdauer",
  shipping: "versand",
  delivery: "versand lieferung",
  refund: "rückerstattung",
  guarantee: "garantie bestpreisgarantie zufriedenheitsversprechen",
  warranty: "garantie zufriedenheitsversprechen",
  suitable: "geeignet eignung",
  photos: "fotos",
  support: "kundenservice",
};
// English function words, removed from English queries before searching.
const ENGLISH_STOPWORDS = new Set([
  "the", "a", "is", "are", "do", "does", "did", "how", "much", "many", "what", "which", "when", "where",
  "why", "who", "my", "i", "you", "your", "can", "could", "to", "of", "for", "and", "or", "with", "it",
  "me", "we", "this", "that", "be", "have", "has", "get", "about", "please",
]);

function expandQuery(query: string): string {
  const words = query.toLowerCase().split(/[^\p{L}]+/u);
  const extra = [...words.map((word) => SYNONYMS[stem(word)]), ...words.map((word) => ENGLISH[word])].filter(Boolean);
  return [query, ...extra].join(" ");
}

// Single place to change when more sources are added (company documents, a database table).
function loadKnowledge(): Chunk[] {
  return knowledgeBase as Chunk[];
}

const chunks = loadKnowledge();

/*
 * The one smileunion.eu chunk (Klarna/Splitit, 2–36 months). smileunion.de offers 72 months
 * at 6,9 %, so general financing questions must never see it: it is not in the search index
 * and is only added when the message names Klarna, Splitit, 36 months or smileunion.eu –
 * always together with the smileunion.de financing chunk, so both offers are answered.
 */
export const EU_FINANCING_ID = "ratenzahlung-klarna-splitit-eu";
const DE_FINANCING_ID = "ratenzahlung-bedingungen";
const EU_FINANCING_TRIGGER = /klarna|splitit|smileunion\.eu|\b36\s*-?\s*(monat|month|mes|rate|install|cuota)/i;

export const mentionsEuFinancing = (text: string) => EU_FINANCING_TRIGGER.test(text);

const index = new MiniSearch<Chunk>({
  fields: ["title", "text"],
  storeFields: ["id", "title", "text", "source", "category"],
  processTerm: (term) => {
    const t = term.toLowerCase();
    return STOPWORDS.has(t) || ENGLISH_STOPWORDS.has(t) ? null : stem(t);
  },
  searchOptions: {
    boost: { title: 2 },
    prefix: true,
    fuzzy: 0.2,
  },
});
index.addAll(chunks.filter((c) => c.id !== EU_FINANCING_ID));

export function retrieve(query: string): RetrievedChunk[] {
  const hits = index.search(expandQuery(query)).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    category: r.category as string,
    text: r.text as string,
    source: r.source as string,
    score: r.score,
  }));
  if (!mentionsEuFinancing(query)) return hits.slice(0, TOP_K);

  // Klarna / Splitit / 36 months: the .de offer first, then the .eu chunk, then the best other hit.
  const forced = getChunksById([DE_FINANCING_ID, EU_FINANCING_ID]).map((c) => ({
    ...c,
    score: Math.max(MIN_SCORE, hits.find((h) => h.id === c.id)?.score ?? 0),
  }));
  return [...forced, ...hits.filter((h) => h.id !== DE_FINANCING_ID)].slice(0, TOP_K);
}

// Chunks by id, in the given order; unknown ids are skipped (e.g. saved draft sources).
export function getChunksById(ids: string[]): Chunk[] {
  return ids.map((id) => chunks.find((c) => c.id === id)).filter((c): c is Chunk => c !== undefined);
}
