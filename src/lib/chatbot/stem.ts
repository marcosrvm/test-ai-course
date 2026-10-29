// Light German stemmer shared by retrieval and the medical guard: strips common
// inflection endings so "kostet" and "Kosten" (or "reinige" and "Reinigung" via
// prefix search) meet at the same stem.
const SUFFIXES = ["ern", "em", "en", "er", "es", "et", "st", "e", "n", "s", "t"];

export function stem(term: string): string {
  for (const suffix of SUFFIXES) {
    if (term.endsWith(suffix) && term.length - suffix.length >= 4) {
      return term.slice(0, -suffix.length);
    }
  }
  return term;
}
