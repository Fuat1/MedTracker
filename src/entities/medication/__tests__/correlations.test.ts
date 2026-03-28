import {
  computeMissedDoseCorrelations,
  summariseMissedDoseCorrelations,
  MissedDoseCorrelation,
} from '../correlations';
import type { MedicationLog } from '../../../shared/api/medication-repository';
import type { BPRecord } from '../../../shared/api/bp-repository';
import type { MeasurementLocation, MeasurementPosture } from '../../../shared/config';

const BASE_EPOCH = 1700000000; // some fixed reference time

function makeMedLog(
  overrides: Partial<MedicationLog> = {},
): MedicationLog {
  return {
    id: 'log-1',
    medication_id: 'med-1',
    timestamp: BASE_EPOCH,
    status: 'missed',
    created_at: BASE_EPOCH,
    ...overrides,
  };
}

function makeBPRecord(
  systolic: number,
  diastolic: number,
  timestamp: number,
  overrides: Partial<BPRecord> = {},
): BPRecord {
  return {
    id: 'bp-1',
    systolic,
    diastolic,
    pulse: null,
    timestamp,
    timezoneOffset: 0,
    location: 'left_arm' as MeasurementLocation,
    posture: 'sitting' as MeasurementPosture,
    notes: null,
    weight: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    isSynced: false,
    ownerUid: null,
    ...overrides,
  };
}

const MED_NAMES: Record<string, string> = {
  'med-1': 'Amlodipine',
  'med-2': 'Lisinopril',
};

describe('computeMissedDoseCorrelations', () => {
  test('returns empty array when no missed logs', () => {
    const taken = makeMedLog({ status: 'taken' });
    const bp = makeBPRecord(120, 75, BASE_EPOCH + 3600);
    const result = computeMissedDoseCorrelations([taken], [bp], MED_NAMES);
    expect(result).toHaveLength(0);
  });

  test('returns empty array when no BP reading in window', () => {
    const missed = makeMedLog({ status: 'missed' });
    // BP reading is BEFORE the missed dose — outside window
    const bp = makeBPRecord(145, 90, BASE_EPOCH - 3600);
    const result = computeMissedDoseCorrelations([missed], [bp], MED_NAMES);
    expect(result).toHaveLength(0);
  });

  test('returns empty array when BP reading is normal after missed dose', () => {
    const missed = makeMedLog({ status: 'missed' });
    const bp = makeBPRecord(118, 74, BASE_EPOCH + 1800); // normal
    const result = computeMissedDoseCorrelations([missed], [bp], MED_NAMES);
    expect(result).toHaveLength(0);
  });

  test('flags elevated systolic after missed dose within window', () => {
    const missed = makeMedLog({ status: 'missed' });
    const bp = makeBPRecord(145, 75, BASE_EPOCH + 3600); // elevated systolic
    const result = computeMissedDoseCorrelations([missed], [bp], MED_NAMES);
    expect(result).toHaveLength(1);
    expect(result[0].bp_elevated).toBe(true);
    expect(result[0].medication_name).toBe('Amlodipine');
    expect(result[0].bp_reading?.systolic).toBe(145);
  });

  test('flags elevated diastolic after missed dose within window', () => {
    const missed = makeMedLog({ status: 'missed' });
    const bp = makeBPRecord(125, 90, BASE_EPOCH + 1800); // elevated diastolic only
    const result = computeMissedDoseCorrelations([missed], [bp], MED_NAMES);
    expect(result).toHaveLength(1);
    expect(result[0].bp_elevated).toBe(true);
  });

  test('ignores BP reading just outside the 4-hour window', () => {
    const missed = makeMedLog({ status: 'missed' });
    // 4 hours + 1 second = outside window
    const bp = makeBPRecord(150, 95, BASE_EPOCH + 4 * 3600 + 1);
    const result = computeMissedDoseCorrelations([missed], [bp], MED_NAMES);
    expect(result).toHaveLength(0);
  });

  test('handles skipped status same as missed', () => {
    const skipped = makeMedLog({ status: 'skipped' });
    const bp = makeBPRecord(160, 100, BASE_EPOCH + 3600);
    const result = computeMissedDoseCorrelations([skipped], [bp], MED_NAMES);
    expect(result).toHaveLength(1);
  });

  test('uses "Unknown" when medication name is missing from map', () => {
    const missed = makeMedLog({ medication_id: 'med-99', status: 'missed' });
    const bp = makeBPRecord(140, 85, BASE_EPOCH + 1800);
    const result = computeMissedDoseCorrelations([missed], [bp], {});
    expect(result[0].medication_name).toBe('Unknown');
  });
});

describe('summariseMissedDoseCorrelations', () => {
  test('returns null for empty correlations', () => {
    expect(summariseMissedDoseCorrelations([])).toBeNull();
  });

  test('returns a summary string for correlations', () => {
    const correlations: MissedDoseCorrelation[] = [
      {
        medication_id: 'med-1',
        medication_name: 'Amlodipine',
        missed_at: BASE_EPOCH,
        bp_elevated: true,
        bp_reading: { systolic: 145, diastolic: 90, timestamp: BASE_EPOCH + 3600 },
      },
    ];
    const result = summariseMissedDoseCorrelations(correlations);
    expect(result).toContain('Amlodipine');
    expect(result).toContain('Elevated BP');
  });

  test('groups multiple correlations for the same medication', () => {
    const correlations: MissedDoseCorrelation[] = [
      { medication_id: 'med-1', medication_name: 'Amlodipine', missed_at: BASE_EPOCH, bp_elevated: true },
      { medication_id: 'med-1', medication_name: 'Amlodipine', missed_at: BASE_EPOCH + 86400, bp_elevated: true },
    ];
    const result = summariseMissedDoseCorrelations(correlations);
    expect(result).toContain('2x missed Amlodipine');
  });
});
