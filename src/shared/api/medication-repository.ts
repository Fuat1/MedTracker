import { getDatabase } from './db';
import { generateUUID } from '../lib';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  reminder_times: string; // stringified JSON array of times "HH:mm"
  created_at: number;
  updated_at: number;
}

export interface MedicationInput {
  name: string;
  dosage: string;
  frequency: string;
  reminder_times?: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  timestamp: number;
  status: 'taken' | 'skipped' | 'missed';
  created_at: number;
}

export interface MedicationLogInput {
  medication_id: string;
  timestamp: number;
  status: 'taken' | 'skipped' | 'missed';
}

/**
 * Fetch all medications, ordered by creation date descending
 */
export async function getMedications(): Promise<Medication[]> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM medications ORDER BY created_at DESC');
  
  const medications: Medication[] = [];
  if (result.rows && result.rows.length > 0) {
    for (let i = 0; i < result.rows.length; i++) {
      medications.push(result.rows[i] as unknown as Medication);
    }
  }
  return medications;
}

/**
 * Insert a new medication
 */
export async function insertMedication(input: MedicationInput): Promise<Medication> {
  const db = getDatabase();
  const id = generateUUID();
  const now = Math.floor(Date.now() / 1000);

  // default reminder times to empty JSON array
  const reminders = input.reminder_times || '[]';

  await db.execute(
    `INSERT INTO medications (id, name, dosage, frequency, reminder_times, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, input.name, input.dosage, input.frequency, reminders, now, now]
  );

  return {
    id,
    name: input.name,
    dosage: input.dosage,
    frequency: input.frequency,
    reminder_times: reminders,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Update an existing medication
 */
export async function updateMedication(
  id: string,
  updates: Partial<MedicationInput>
): Promise<void> {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) {
    setClauses.push('name = ?');
    params.push(updates.name);
  }
  if (updates.dosage !== undefined) {
    setClauses.push('dosage = ?');
    params.push(updates.dosage);
  }
  if (updates.frequency !== undefined) {
    setClauses.push('frequency = ?');
    params.push(updates.frequency);
  }
  if (updates.reminder_times !== undefined) {
    setClauses.push('reminder_times = ?');
    params.push(updates.reminder_times);
  }

  if (setClauses.length === 0) return;

  setClauses.push('updated_at = ?');
  params.push(now);

  params.push(id); // For WHERE clause

  await db.execute(
    `UPDATE medications SET ${setClauses.join(', ')} WHERE id = ?`,
    params
  );
}

/**
 * Delete a medication. This triggers ON DELETE CASCADE in the database to clear logs automatically.
 */
export async function deleteMedication(id: string): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM medications WHERE id = ?', [id]);
}

/**
 * Insert a log record for taking or missing a dose
 */
export async function insertMedicationLog(input: MedicationLogInput): Promise<MedicationLog> {
  const db = getDatabase();
  const id = generateUUID();
  const now = Math.floor(Date.now() / 1000);

  await db.execute(
    `INSERT INTO medication_logs (id, medication_id, timestamp, status, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, input.medication_id, input.timestamp, input.status, now]
  );

  return {
    id,
    medication_id: input.medication_id,
    timestamp: input.timestamp,
    status: input.status,
    created_at: now,
  };
}

/**
 * Fetch today's logs specifically (between start of day and end of day based on current device timezone)
 */
export async function getMedicationLogsByDateRange(
  startEpochSeconds: number, 
  endEpochSeconds: number
): Promise<MedicationLog[]> {
  const db = getDatabase();
  
  const result = await db.execute(
    'SELECT * FROM medication_logs WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC',
    [startEpochSeconds, endEpochSeconds]
  );

  const logs: MedicationLog[] = [];
  if (result.rows && result.rows.length > 0) {
    for (let i = 0; i < result.rows.length; i++) {
      logs.push(result.rows[i] as unknown as MedicationLog);
    }
  }
  
  return logs;
}
