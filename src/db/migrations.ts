import type * as SQLite from 'expo-sqlite';

type Migration = {
  version: number;
  up: string;
};

const migrations: Migration[] = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS mined_cards (
        id                TEXT PRIMARY KEY NOT NULL,
        surface           TEXT NOT NULL,
        reading           TEXT NOT NULL,
        sentence_jp       TEXT NOT NULL,
        sentence_en       TEXT,
        glosses_json      TEXT NOT NULL,
        grammar_note      TEXT,
        kanji_list_json   TEXT NOT NULL,
        furigana_json     TEXT NOT NULL,
        tags_json         TEXT NOT NULL,
        audio_uri         TEXT,
        audio_start_ms    INTEGER NOT NULL,
        audio_end_ms      INTEGER NOT NULL,
        thumbnail_uri     TEXT,
        source_entry_id   TEXT,
        source_cue_index  INTEGER,
        sync_state        TEXT NOT NULL DEFAULT 'pending',
        sync_error        TEXT,
        synced_at         INTEGER,
        created_at        INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_mined_cards_sync_state
        ON mined_cards (sync_state);
      CREATE INDEX IF NOT EXISTS idx_mined_cards_source
        ON mined_cards (source_entry_id, source_cue_index);
    `,
  },
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY NOT NULL);',
  );

  const row = await db.getFirstAsync<{ version: number } | null>(
    'SELECT version FROM schema_version LIMIT 1;',
  );
  const current = row?.version ?? 0;

  for (const m of migrations) {
    if (m.version <= current) continue;
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(m.up);
      await txn.runAsync('DELETE FROM schema_version;');
      await txn.runAsync('INSERT INTO schema_version (version) VALUES (?);', m.version);
    });
  }
}

export const latestSchemaVersion = migrations.at(-1)?.version ?? 0;
