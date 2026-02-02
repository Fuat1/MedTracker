import {open, type DB} from '@op-engineering/op-sqlite';

let db: DB | null = null;

const DB_NAME = 'medtracker.db';

const CREATE_BP_RECORDS_TABLE = `
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
    is_synced INTEGER DEFAULT 0
  );
`;

const CREATE_BP_TIMESTAMP_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_bp_records_timestamp
  ON bp_records(timestamp DESC);
`;

export async function initDatabase(): Promise<DB> {
  if (db) {
    return db;
  }

  db = open({name: DB_NAME});

  // Create tables
  db.execute(CREATE_BP_RECORDS_TABLE);
  db.execute(CREATE_BP_TIMESTAMP_INDEX);

  return db;
}

export function getDatabase(): DB {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    db.close();
    db = null;
  }
}
