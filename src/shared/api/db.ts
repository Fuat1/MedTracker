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

const CREATE_CUSTOM_TAGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS custom_tags (
    id         TEXT PRIMARY KEY NOT NULL,
    label      TEXT NOT NULL,
    icon       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`;

const CREATE_MEDICATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS medications (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    reminder_times TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`;

const CREATE_MEDICATION_LOGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS medication_logs (
    id TEXT PRIMARY KEY NOT NULL,
    medication_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
  );
`;

const CREATE_MEDICATION_LOGS_IDX_TIMESTAMP_SQL = `
  CREATE INDEX IF NOT EXISTS idx_medication_logs_timestamp ON medication_logs(timestamp DESC);
`;

const CREATE_MEDICATION_LOGS_IDX_MED_ID_SQL = `
  CREATE INDEX IF NOT EXISTS idx_medication_logs_med_id ON medication_logs(medication_id);
`;

const CREATE_WEATHER_READINGS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS weather_readings (
    id              TEXT PRIMARY KEY NOT NULL,
    record_id       TEXT NOT NULL UNIQUE,
    temperature     REAL NOT NULL,
    feels_like      REAL,
    pressure        REAL NOT NULL,
    humidity        INTEGER NOT NULL,
    wind_speed      REAL,
    weather_code    INTEGER NOT NULL,
    weather_desc    TEXT NOT NULL,
    latitude        REAL NOT NULL,
    longitude       REAL NOT NULL,
    city_name       TEXT,
    fetched_at      INTEGER NOT NULL,
    created_at      INTEGER NOT NULL,
    FOREIGN KEY (record_id) REFERENCES bp_records(id) ON DELETE CASCADE
  );
`;

const CREATE_WEATHER_READINGS_IDX_SQL = `
  CREATE INDEX IF NOT EXISTS idx_weather_record_id ON weather_readings(record_id);
`;

const CREATE_LINKED_USERS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS linked_users (
    uid TEXT PRIMARY KEY NOT NULL,
    display_name TEXT NOT NULL,
    last_synced_at INTEGER NOT NULL DEFAULT 0,
    relationship_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`;

export async function initDatabase(): Promise<DB> {
  if (db) {
    return db;
  }

  try {
    const encryptionKey = await getOrCreateEncryptionKey();
    db = open({ name: DB_CONFIG.name, encryptionKey });

    // Create tables
    await db.execute(CREATE_TABLE_SQL);
    await db.execute(CREATE_INDEX_SQL);
    await db.execute(CREATE_BP_TAGS_TABLE_SQL);
    await db.execute(CREATE_BP_TAGS_IDX_RECORD_SQL);
    await db.execute(CREATE_BP_TAGS_IDX_TAG_SQL);
    await db.execute(CREATE_CUSTOM_TAGS_TABLE_SQL);
    await db.execute(CREATE_MEDICATIONS_TABLE_SQL);
    await db.execute(CREATE_MEDICATION_LOGS_TABLE_SQL);
    await db.execute(CREATE_MEDICATION_LOGS_IDX_TIMESTAMP_SQL);
    await db.execute(CREATE_MEDICATION_LOGS_IDX_MED_ID_SQL);
    await db.execute(CREATE_WEATHER_READINGS_TABLE_SQL);
    await db.execute(CREATE_WEATHER_READINGS_IDX_SQL);
    await db.execute(CREATE_LINKED_USERS_TABLE_SQL);

    // Migrations — use PRAGMA + executeSync so errors are caught synchronously
    const tableInfo = db.executeSync('PRAGMA table_info(bp_records)');
    const columns = tableInfo.rows as Array<{ name: string }>;

    const hasWeight = columns.some((row) => row.name === 'weight');
    if (!hasWeight) {
      db.executeSync(
        'ALTER TABLE bp_records ADD COLUMN weight REAL CHECK(weight IS NULL OR weight BETWEEN 20 AND 500)',
      );
    }

    const hasOwnerUid = columns.some((row) => row.name === 'owner_uid');
    if (!hasOwnerUid) {
      db.executeSync('ALTER TABLE bp_records ADD COLUMN owner_uid TEXT');
    }

    if (__DEV__) console.log('Database initialized successfully');
    return db;
  } catch (error) {
    if (__DEV__) console.error('Database initialization error:', error);
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
    if (__DEV__) console.log('Database closed');
  }
}
