import MiniSearch from "minisearch";
import knowledgeBase from "./knowledge-base.json";

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

// Light German stemmer: strips common inflection endings so "kostet" and "Kosten"
// (or "reinige" and "Reinigung" via prefix search) meet at the same stem.
const SUFFIXES = ["ern", "em", "en", "er", "es", "et", "st", "e", "n", "s", "t"];

function stem(term: string): string {
  for (const suffix of SUFFIXES) {
    if (term.endsWith(suffix) && term.length - suffix.length >= 4) {
      return term.slice(0, -suffix.length);
    }
  }
  return term;
}

// Query-side synonyms (by stem): "kostet" alone also hits every "kostenlos", so cost
// questions additionally search for "Preis".
const SYNONYMS: Record<string, string> = {
  kost: "preis",
  teuer: "preis",
  bezahl: "preis",
};

function expandQuery(query: string): string {
  const extra = query
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .map((word) => SYNONYMS[stem(word)])
    .filter(Boolean);
  return [query, ...extra].join(" ");
}

// Single place to change when more sources are added (company documents, a database table).
function loadKnowledge(): Chunk[] {
  return knowledgeBase as Chunk[];
}

const chunks = loadKnowledge();

const index = new MiniSearch<Chunk>({
  fields: ["title", "text"],
  storeFields: ["id", "title", "text", "source", "category"],
  processTerm: (term) => {
    const t = term.toLowerCase();
    return STOPWORDS.has(t) ? null : stem(t);
  },
  searchOptions: {
    boost: { title: 2 },
    prefix: true,
    fuzzy: 0.2,
  },
});
index.addAll(chunks);

export function retrieve(query: string): RetrievedChunk[] {
  return index
    .search(expandQuery(query))
    .slice(0, TOP_K)
    .map((r) => ({
      id: r.id as string,
      title: r.title as string,
      category: r.category as string,
      text: r.text as string,
      source: r.source as string,
      score: r.score,
    }));
}
