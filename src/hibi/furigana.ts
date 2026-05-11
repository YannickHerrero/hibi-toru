import type { FuriganaPair } from 'hibi-client';

const KANJI_RE = /[㐀-䶿一-鿿豈-﫿]/;

function isKanji(ch: string): boolean {
  return KANJI_RE.test(ch);
}

export function katakanaToHiragana(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCharCode(code - 0x60);
    } else {
      out += s[i];
    }
  }
  return out;
}

type Run = { kind: 'kanji' | 'kana'; text: string };

function segmentSurface(surface: string): Run[] {
  const runs: Run[] = [];
  let i = 0;
  while (i < surface.length) {
    const ch = surface[i];
    const kind: Run['kind'] = isKanji(ch) ? 'kanji' : 'kana';
    let j = i + 1;
    while (j < surface.length && (isKanji(surface[j]) ? 'kanji' : 'kana') === kind) j++;
    runs.push({ kind, text: surface.slice(i, j) });
    i = j;
  }
  return runs;
}

/**
 * Segments a (surface, reading) pair into the FuriganaPair[] shape Hibi
 * stores per card. Kana runs carry empty reading; kanji runs carry the
 * slice of the (hiragana-normalised) reading aligned to them. Falls back
 * to a single whole-word pair on pathological inputs.
 */
export function segmentFurigana(surface: string, reading: string | null): FuriganaPair[] {
  if (!surface) return [];
  const fallback = (): FuriganaPair[] => [{ base: surface, reading: reading ?? '' }];

  if (!reading) return fallback();
  const r = katakanaToHiragana(reading);
  const runs = segmentSurface(surface);

  if (runs.every((run) => run.kind === 'kana')) {
    return runs.map((run) => ({ base: run.text, reading: '' }));
  }

  const out: FuriganaPair[] = [];
  let cursor = 0;
  for (let idx = 0; idx < runs.length; idx++) {
    const run = runs[idx];
    if (run.kind === 'kana') {
      const runHira = katakanaToHiragana(run.text);
      const at = r.indexOf(runHira, cursor);
      if (at !== cursor) return fallback();
      out.push({ base: run.text, reading: '' });
      cursor = at + runHira.length;
      continue;
    }
    let end = r.length;
    for (let k = idx + 1; k < runs.length; k++) {
      if (runs[k].kind === 'kana') {
        const nextHira = katakanaToHiragana(runs[k].text);
        const at = r.indexOf(nextHira, cursor);
        if (at < 0) return fallback();
        end = at;
        break;
      }
    }
    if (end < cursor) return fallback();
    out.push({ base: run.text, reading: r.slice(cursor, end) });
    cursor = end;
  }

  return out;
}
