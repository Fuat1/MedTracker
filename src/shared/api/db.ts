import { open, type DB } from '@op-engineering/op-sqlite';
import { DB_CONFIG } from '../config';
import { getOrCreateEncryptionKey } from '../lib/encryption-key';

let db: DB | null = null;

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS bp_records (
    id TEXT PRIMARY KEY NOT NULL,
    systolic INTEGER NOT NULL CHECK(systolic BETWEEN 40 AND 300),
    diastolic INTEGER NOT NULL CHECK(diastolic BETWEEN 30 AND 200),
    pulse INTEGER CHECK(pulse BETWEEN 30 AND 250),
    timestamp INTEGER NOT NULL,
    timezone_offset INTEGER DEFAULT 0,
    location TEXT DEFAULT 'left_arm',
    posture TEXT DEFAULT 'sitting',
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_synced INTEGER DEFAULT 0,
    CHECK(systolic > diastolic)
  );
`;

const CREATE_INDEX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_bp_records_timestamp
  ON bp_records(timestamp DESC);
`;

const CREATE_BP_TAGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS bp_tags (
    id         TEXT PRIMARY KEY NOT NULL,
    record_id  TEXT NOT NULL,
    tag        TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (record_id) REFERENCES bp_records(id) ON DELETE CASCADE
  );
`;

const CREATE_BP_TAGS_IDX_RECORD_SQL = `
  CREATE INDEX IF NOT EXISTS idx_bp_tags_record_id ON bp_tags(record_id);
`;

const CREATE_BP_TAGS_IDX_TAG_SQL = `
  CREATE INDEX IF NOT EXISTS idx_bp_tags_tag ON bp_tags(tag);
`;

export async function initDatabase(): Promise<DB> {
  if (db) {
    return db;
  }

  try {
    const encryptionKey = await getOrCreateEncryptionKey();
    db = open({ name: DB_CONFIG.name, encryptionKey });

    // Create tables
    db.execute(CREATE_TABLE_SQL);
    db.execute(CREATE_INDEX_SQL);
    db.execute(CREATE_BP_TAGS_TABLE_SQL);
    db.execute(CREATE_BP_TAGS_IDX_RECORD_SQL);
    db.execute(CREATE_BP_TAGS_IDX_TAG_SQL);

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export function getDatabase(): DB {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database closed');
  }
}
