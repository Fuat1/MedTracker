# Database Schema & Validation Rules

MedTracker uses `op-sqlite` (JSI bindings) with SQLCipher encryption.

## bp_records Table

```sql
CREATE TABLE IF NOT EXISTS bp_records (
  id TEXT PRIMARY KEY NOT NULL,           -- UUID v4
  systolic INTEGER NOT NULL CHECK(systolic BETWEEN 40 AND 300),
  diastolic INTEGER NOT NULL CHECK(diastolic BETWEEN 30 AND 200),
  pulse INTEGER CHECK(pulse BETWEEN 30 AND 250),
  timestamp INTEGER NOT NULL,             -- Unix Epoch (seconds)
  timezone_offset INTEGER DEFAULT 0,      -- Minutes from UTC
  location TEXT DEFAULT 'left_arm',       -- 'left_arm' | 'right_arm' | 'wrist'
  posture TEXT DEFAULT 'sitting',         -- 'sitting' | 'standing' | 'lying_down'
  notes TEXT,                             -- Optional user notes
  created_at INTEGER NOT NULL,            -- Unix Epoch (seconds)
  updated_at INTEGER NOT NULL,            -- Unix Epoch (seconds)
  is_synced INTEGER DEFAULT 0             -- 0 = not synced, 1 = synced to cloud
);

CREATE INDEX IF NOT EXISTS idx_bp_records_timestamp
  ON bp_records(timestamp DESC);
```

## bp_tags Table (Future - Lifestyle Tagging)

```sql
CREATE TABLE IF NOT EXISTS bp_tags (
  id TEXT PRIMARY KEY NOT NULL,
  bp_record_id TEXT NOT NULL,
  tag_type TEXT NOT NULL,                 -- 'salt' | 'stress' | 'alcohol' | 'exercise' | 'medication'
  created_at INTEGER NOT NULL,
  FOREIGN KEY (bp_record_id) REFERENCES bp_records(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bp_tags_record_id
  ON bp_tags(bp_record_id);
```

## Validation Rules (MUST Enforce)

### Hard Limits (Database Constraints)

- **Systolic**: 40-300 mmHg (CHECK constraint)
- **Diastolic**: 30-200 mmHg (CHECK constraint)
- **Pulse**: 30-250 BPM (CHECK constraint, optional field)

### Application-Level Validation

**MUST implement in `entities/blood-pressure/lib.ts` → `validateBPValues()`**:

```typescript
export function validateBPValues(
  systolic: number,
  diastolic: number,
  pulse?: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Range checks
  if (systolic < 40 || systolic > 300) {
    errors.push(i18n.t('validation:errors.systolicRange', { min: 40, max: 300 }));
  }
  if (diastolic < 30 || diastolic > 200) {
    errors.push(i18n.t('validation:errors.diastolicRange', { min: 30, max: 200 }));
  }
  if (pulse !== undefined && (pulse < 30 || pulse > 250)) {
    errors.push(i18n.t('validation:errors.pulseRange', { min: 30, max: 250 }));
  }

  // Logic check
  if (systolic <= diastolic) {
    errors.push(i18n.t('validation:errors.systolicMustBeGreater'));
  }

  return { valid: errors.length === 0, errors };
}
```

## Database Access Patterns (MUST)

**ALWAYS use parameterized queries** to prevent SQL injection:

```typescript
// ✓ CORRECT
await db.execute(
  `INSERT INTO bp_records (id, systolic, diastolic, pulse, timestamp, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [id, systolic, diastolic, pulse, timestamp, now, now]
);

// ❌ WRONG - SQL injection risk
await db.execute(
  `INSERT INTO bp_records (id, systolic, diastolic) VALUES ('${id}', ${systolic}, ${diastolic})`
);
```

## TypeScript Types (Single Source of Truth)

**Location**: `src/entities/blood-pressure/types.ts`

```typescript
export interface BPRecord {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp: number;              // Unix seconds
  timezone_offset: number;        // Minutes from UTC
  location: 'left_arm' | 'right_arm' | 'wrist';
  posture: 'sitting' | 'standing' | 'lying_down';
  notes?: string;
  created_at: number;             // Unix seconds
  updated_at: number;             // Unix seconds
  is_synced: boolean;
}

export interface BPRecordInput {
  systolic: number;
  diastolic: number;
  pulse?: number;
  timestamp?: number;             // Defaults to current time if omitted
  location?: 'left_arm' | 'right_arm' | 'wrist';
  posture?: 'sitting' | 'standing' | 'lying_down';
  notes?: string;
}
```

## Database Initialization

**Location**: `src/shared/api/db.ts`

```typescript
import { open } from '@op-engineering/op-sqlite';

export const db = open({
  name: 'medtracker.db',
  encryptionKey: 'your-secure-key-from-keychain', // MUST use secure key storage
});

// Run migrations on app start
export async function initDatabase() {
  await db.execute(`CREATE TABLE IF NOT EXISTS bp_records (...)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_bp_records_timestamp ...`);
}
```

## Backup Strategy

- **Local database file**: `medtracker.db` (SQLCipher encrypted)
- **Google Drive backup**: Upload encrypted `.db` file to `appDataFolder` scope
- **Export formats**: PDF (clinical reports), CSV (spreadsheet)
- **NO plain-text exports** of medical data by default

**Last Updated**: 2026-02-14
