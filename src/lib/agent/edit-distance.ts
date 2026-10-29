// Normalised edit distance between the AI draft and the text the agent sent:
// Levenshtein distance (characters, whitespace collapsed) / length of the longer text, as 0–100.
export function editPercentage(draft: string, final: string): number {
  const a = draft.replace(/\s+/g, " ").trim();
  const b = final.replace(/\s+/g, " ").trim();
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 0;

  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return Math.round((previous[b.length] / longest) * 1000) / 10;
}
