import type { CreateCardInput } from 'hibi-client';
import type { Cue, DictName, LibraryEntry } from '@/types';
import type { DictEntry } from '@/analysis/dict';
import { effectiveStartMs, effectiveEndMs } from '@/utils/time';
import { uuid } from '@/utils/uuid';
import { segmentFurigana, katakanaToHiragana } from './furigana';
import { extractKanjiList } from './kanjiList';
import { extractCardAudio, extractCardThumbnail, type ExtractedClip } from './media';

const DEFAULT_AUDIO_PADDING_BEFORE_MS = 500;
const DEFAULT_AUDIO_PADDING_AFTER_MS = 500;

export interface BuildCardArgs {
  entry: LibraryEntry;
  cue: Cue;
  dict: DictName;
  dictEntry: DictEntry;
  videoUri: string;
  /** Optional padding overrides; default 500 ms / 500 ms. */
  audioPaddingBeforeMs?: number;
  audioPaddingAfterMs?: number;
}

export interface BuiltCard {
  /** Stable id used as `mined_cards.id` + filename prefix. */
  id: string;
  /** Hibi payload — submit verbatim to client.cards.create (after media upload). */
  payload: Omit<CreateCardInput, 'imageKey' | 'audioKey'>;
  /** Local file URIs to upload via client.uploads.*. */
  thumbnailUri: string;
  clip: ExtractedClip;
  sourceEntryId: string;
  sourceCueIndex: number;
}

function shortId(): string {
  return uuid().replace(/-/g, '').slice(0, 12);
}

function focusReadingFor(dictEntry: DictEntry): string {
  return katakanaToHiragana(dictEntry.readings[0] ?? '');
}

function focusWordFor(dictEntry: DictEntry): string {
  return dictEntry.forms[0] ?? dictEntry.readings[0] ?? '';
}

function flattenGlosses(dictEntry: DictEntry): string[] {
  const out: string[] = [];
  for (const sense of dictEntry.senses) {
    for (const g of sense.glosses) {
      if (!out.includes(g)) out.push(g);
    }
  }
  return out;
}

function sourceTag(entry: LibraryEntry): string[] {
  const tags: string[] = ['mined'];
  if (entry.seriesName) tags.push(entry.seriesName);
  return tags;
}

/**
 * Builds a Hibi card payload from a cue + focused dict entry. Extracts the
 * cue-midpoint thumbnail and a padded audio clip; both are written to the
 * app cache. The caller is expected to upload the media via the Hibi
 * client and pass imageKey/audioKey back before calling cards.create.
 */
export async function buildCard(args: BuildCardArgs): Promise<BuiltCard> {
  const { entry, cue, dictEntry, videoUri } = args;
  const beforeMs = args.audioPaddingBeforeMs ?? DEFAULT_AUDIO_PADDING_BEFORE_MS;
  const afterMs = args.audioPaddingAfterMs ?? DEFAULT_AUDIO_PADDING_AFTER_MS;

  const id = shortId();
  const startV = effectiveStartMs(cue, entry.retimerState);
  const endV = effectiveEndMs(cue, entry.retimerState);
  const midV = Math.max(0, Math.floor((startV + endV) / 2));

  const thumbnailUri = await extractCardThumbnail(videoUri, id, midV);
  const clip = await extractCardAudio({
    videoUri,
    cardId: id,
    startMs: Math.max(0, startV - beforeMs),
    endMs: endV + afterMs,
  });

  const focusWord = focusWordFor(dictEntry);
  const focusWordReading = focusReadingFor(dictEntry);
  const furigana = segmentFurigana(focusWord, focusWordReading);
  const kanjiList = extractKanjiList(focusWord);

  const payload: BuiltCard['payload'] = {
    sentence: cue.text,
    focusWord,
    focusWordReading,
    furigana,
    english: cue.translation || '',
    glosses: flattenGlosses(dictEntry),
    grammarNote: cue.grammarNote ?? null,
    kanjiList,
    source: 'hibi-toru',
    tags: sourceTag(entry),
  };

  return {
    id,
    payload,
    thumbnailUri,
    clip,
    sourceEntryId: entry.id,
    sourceCueIndex: cue.index,
  };
}
