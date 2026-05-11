// Sync orchestrator for mined cards:
//   1. upload thumbnail + audio clip to Hibi → imageKey + audioKey
//   2. POST /v1/cards
//   3. mark mined_cards row synced; delete temp files
// Per-row failures are caught and recorded as sync_state = 'failed' so the
// settings screen can offer a retry.

import {
  getMinedCard,
  listPendingMinedCards,
  markFailed,
  markSynced,
  markSyncing,
  type MinedCardRow,
} from '@/db/minedCards';
import { getHibiClient, HIBI_BASE_URL } from './hibiClient';
import { deleteLocalMedia } from './media';

export type SyncProgress = {
  done: number;
  total: number;
  current: MinedCardRow;
};

export async function syncCard(id: string): Promise<void> {
  const card = await getMinedCard(id);
  if (!card) throw new Error(`mined card ${id} not found`);
  await syncRow(card);
}

export async function syncAllPending(opts?: {
  onProgress?: (p: SyncProgress) => void;
}): Promise<{ ok: number; failed: number; total: number }> {
  const pending = await listPendingMinedCards();
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < pending.length; i++) {
    const row = pending[i];
    opts?.onProgress?.({ done: i, total: pending.length, current: row });
    try {
      await syncRow(row);
      ok += 1;
    } catch (err) {
      failed += 1;
      console.warn('[hibi-sync] row failed', row.id, err);
    }
  }
  return { ok, failed, total: pending.length };
}

async function syncRow(card: MinedCardRow): Promise<void> {
  const tag = `[hibi-sync ${card.id.slice(0, 8)}]`;
  await markSyncing(card.id);
  try {
    const client = await getHibiClient();
    if (!client) throw new Error('Hibi API key not configured.');

    let imageKey: string | null = null;
    if (card.thumbnailUri) {
      try {
        const filename = card.thumbnailUri.split('/').pop() ?? `hibi_${card.id}.jpg`;
        const res = await client.uploads.image({
          uri: card.thumbnailUri,
          name: filename,
          type: 'image/jpeg',
        });
        imageKey = res.key;
      } catch (err) {
        throw decorateNetworkError(err, 'uploads/image');
      }
    }

    let audioKey: string | null = null;
    if (card.audioUri) {
      try {
        const filename = card.audioUri.split('/').pop() ?? `hibi_${card.id}.m4a`;
        const mime = filename.endsWith('.ogg')
          ? 'audio/ogg'
          : filename.endsWith('.aac')
            ? 'audio/aac'
            : 'audio/mp4';
        const res = await client.uploads.audio({
          uri: card.audioUri,
          name: filename,
          type: mime,
        });
        audioKey = res.key;
      } catch (err) {
        throw decorateNetworkError(err, 'uploads/audio');
      }
    }

    try {
      await client.cards.create({
        sentence: card.sentenceJp,
        focusWord: card.surface,
        focusWordReading: card.reading,
        furigana: card.furigana,
        english: card.sentenceEn ?? '',
        glosses: card.glosses,
        grammarNote: card.grammarNote,
        kanjiList: card.kanjiList,
        imageKey,
        audioKey,
        source: 'hibi-toru',
        tags: card.tags,
      });
    } catch (err) {
      throw decorateNetworkError(err, 'cards');
    }

    await markSynced(card.id);
    deleteLocalMedia(card.thumbnailUri);
    deleteLocalMedia(card.audioUri);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(tag, 'failed:', message);
    await markFailed(card.id, message);
    throw err;
  }
}

function decorateNetworkError(err: unknown, endpoint: string): Error {
  if (err instanceof TypeError && /Network request failed/i.test(err.message)) {
    return new Error(
      `Network request failed: cannot reach ${HIBI_BASE_URL}/v1/${endpoint}. ` +
        `Check connectivity and that your Hibi API key is valid.`,
    );
  }
  if (err instanceof Error) return err;
  return new Error(String(err));
}
