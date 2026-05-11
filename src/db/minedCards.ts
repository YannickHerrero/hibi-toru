import { getDb } from './client';

export type SyncState = 'pending' | 'syncing' | 'synced' | 'failed';

export interface MinedCardRow {
  id: string;
  surface: string;
  reading: string;
  sentenceJp: string;
  sentenceEn: string | null;
  glosses: string[];
  grammarNote: string | null;
  kanjiList: { kanji: string; meaning: string | null; wanikaniLevel: number | null }[];
  furigana: { base: string; reading: string }[];
  tags: string[];
  audioUri: string | null;
  audioStartMs: number;
  audioEndMs: number;
  thumbnailUri: string | null;
  sourceEntryId: string | null;
  sourceCueIndex: number | null;
  syncState: SyncState;
  syncError: string | null;
  syncedAt: number | null;
  createdAt: number;
}

interface RawRow {
  id: string;
  surface: string;
  reading: string;
  sentence_jp: string;
  sentence_en: string | null;
  glosses_json: string;
  grammar_note: string | null;
  kanji_list_json: string;
  furigana_json: string;
  tags_json: string;
  audio_uri: string | null;
  audio_start_ms: number;
  audio_end_ms: number;
  thumbnail_uri: string | null;
  source_entry_id: string | null;
  source_cue_index: number | null;
  sync_state: SyncState;
  sync_error: string | null;
  synced_at: number | null;
  created_at: number;
}

function hydrate(raw: RawRow): MinedCardRow {
  return {
    id: raw.id,
    surface: raw.surface,
    reading: raw.reading,
    sentenceJp: raw.sentence_jp,
    sentenceEn: raw.sentence_en,
    glosses: JSON.parse(raw.glosses_json) as string[],
    grammarNote: raw.grammar_note,
    kanjiList: JSON.parse(raw.kanji_list_json),
    furigana: JSON.parse(raw.furigana_json),
    tags: JSON.parse(raw.tags_json) as string[],
    audioUri: raw.audio_uri,
    audioStartMs: raw.audio_start_ms,
    audioEndMs: raw.audio_end_ms,
    thumbnailUri: raw.thumbnail_uri,
    sourceEntryId: raw.source_entry_id,
    sourceCueIndex: raw.source_cue_index,
    syncState: raw.sync_state,
    syncError: raw.sync_error,
    syncedAt: raw.synced_at,
    createdAt: raw.created_at,
  };
}

export type NewMinedCard = Omit<MinedCardRow, 'syncState' | 'syncError' | 'syncedAt' | 'createdAt'>;

export async function insertMinedCard(card: NewMinedCard): Promise<MinedCardRow> {
  const db = await getDb();
  const createdAt = Date.now();
  await db.runAsync(
    `INSERT INTO mined_cards (
       id, surface, reading, sentence_jp, sentence_en, glosses_json, grammar_note,
       kanji_list_json, furigana_json, tags_json, audio_uri, audio_start_ms, audio_end_ms,
       thumbnail_uri, source_entry_id, source_cue_index, sync_state, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    card.id,
    card.surface,
    card.reading,
    card.sentenceJp,
    card.sentenceEn,
    JSON.stringify(card.glosses),
    card.grammarNote,
    JSON.stringify(card.kanjiList),
    JSON.stringify(card.furigana),
    JSON.stringify(card.tags),
    card.audioUri,
    card.audioStartMs,
    card.audioEndMs,
    card.thumbnailUri,
    card.sourceEntryId,
    card.sourceCueIndex,
    createdAt,
  );
  return { ...card, syncState: 'pending', syncError: null, syncedAt: null, createdAt };
}

export async function markSyncing(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE mined_cards SET sync_state = 'syncing', sync_error = NULL WHERE id = ?`,
    id,
  );
}

export async function markSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE mined_cards SET sync_state = 'synced', sync_error = NULL, synced_at = ? WHERE id = ?`,
    Date.now(),
    id,
  );
}

export async function markFailed(id: string, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE mined_cards SET sync_state = 'failed', sync_error = ? WHERE id = ?`,
    error,
    id,
  );
}

export async function getMinedCard(id: string): Promise<MinedCardRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<RawRow | null>(
    `SELECT * FROM mined_cards WHERE id = ? LIMIT 1`,
    id,
  );
  return row ? hydrate(row) : null;
}

export async function listPendingMinedCards(): Promise<MinedCardRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM mined_cards
     WHERE sync_state IN ('pending', 'failed')
     ORDER BY created_at ASC`,
  );
  return rows.map(hydrate);
}

export async function listAllMinedCards(): Promise<MinedCardRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<RawRow>(
    `SELECT * FROM mined_cards ORDER BY created_at DESC`,
  );
  return rows.map(hydrate);
}

export async function deleteMinedCard(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM mined_cards WHERE id = ?`, id);
}
