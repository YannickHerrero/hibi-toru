import { insertMinedCard } from '@/db/minedCards';
import type { BuiltCard } from './buildCard';
import { syncCard } from './sync';

/**
 * Persists a freshly built card to the local DB then kicks off a sync.
 * Sync failures are surfaced as throws so the caller can show feedback;
 * the row stays in the DB with sync_state = 'failed' for later retry.
 */
export async function submitMinedCard(built: BuiltCard): Promise<void> {
  await insertMinedCard({
    id: built.id,
    surface: built.payload.focusWord,
    reading: built.payload.focusWordReading,
    sentenceJp: built.payload.sentence,
    sentenceEn: built.payload.english || null,
    glosses: built.payload.glosses,
    grammarNote: built.payload.grammarNote,
    kanjiList: built.payload.kanjiList,
    furigana: built.payload.furigana,
    tags: built.payload.tags,
    audioUri: built.clip.audioUri,
    audioStartMs: built.clip.audioStartMs,
    audioEndMs: built.clip.audioEndMs,
    thumbnailUri: built.thumbnailUri,
    sourceEntryId: built.sourceEntryId,
    sourceCueIndex: built.sourceCueIndex,
  });
  await syncCard(built.id);
}
