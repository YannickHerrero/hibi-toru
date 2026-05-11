import type { KanjiEntry } from 'hibi-client';

const KANJI_RE = /[㐀-䶿一-鿿豈-﫿]/;

/**
 * Returns unique kanji characters from `focusWord`. Meaning/WaniKani level
 * are left null; the server (or a later enrichment pass against the local
 * WaniKani cache) can fill them in.
 */
export function extractKanjiList(focusWord: string): KanjiEntry[] {
  const seen = new Set<string>();
  const out: KanjiEntry[] = [];
  for (const ch of focusWord) {
    if (!KANJI_RE.test(ch) || seen.has(ch)) continue;
    seen.add(ch);
    out.push({ kanji: ch, meaning: '', wanikaniLevel: null });
  }
  return out;
}
