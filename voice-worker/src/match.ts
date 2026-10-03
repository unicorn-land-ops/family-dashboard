// Fuzzy "which chore / reward did they mean" for voice input.
// Case- and accent-insensitive; works the same for German or English titles.

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents: ä→a, é→e
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // drop emoji / punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function score(query: string, title: string): number {
  if (!query || !title) return 0;
  if (title === query) return 100;
  if (title.startsWith(query)) return 80;
  if (title.includes(query)) return 60;
  if (query.includes(title)) return 50; // "I emptied the dishwasher" vs "dishwasher"
  // Word overlap: "teeth brushing" vs "Brush teeth".
  // Words under 4 letters (the, and, die, ich) are noise here; contains-match above covers short titles.
  const words = query.split(' ').filter((w) => w.length >= 4);
  const titleWords = title.split(' ').filter((t) => t.length >= 4);
  const hits = words.filter((w) => titleWords.some((t) => t.startsWith(w) || w.startsWith(t)));
  return hits.length ? 10 + (30 * hits.length) / words.length : 0;
}

/** Best match by title, or null. Ties go to the shorter (more specific) title. */
export function bestMatch<T extends { title: string }>(query: string, items: T[]): T | null {
  const q = normalize(query);
  let best: T | null = null;
  let bestScore = 0;
  for (const item of items) {
    const t = normalize(item.title);
    const s = score(q, t);
    if (s > bestScore || (s === bestScore && s > 0 && best && t.length < normalize(best.title).length)) {
      best = item;
      bestScore = s;
    }
  }
  return best;
}
