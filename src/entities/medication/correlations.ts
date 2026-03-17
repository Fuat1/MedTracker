import type { BPRecord } from '../../shared/api/bp-repository';
import type { MedicationLog } from '../../shared/api/medication-repository';

export interface MissedDoseCorrelation {
  medication_id: string;
  medication_name: string;
  missed_at: number;          // epoch seconds of scheduled dose that was missed
  bp_reading?: {
    systolic: number;
    diastolic: number;
    timestamp: number;
  };
  bp_elevated: boolean;
}

/**
 * Hours after a missed dose during which a BP reading is considered correlated.
 * Based on typical antihypertensive half-life considerations.
 */
const CORRELATION_WINDOW_HOURS = 4;
const CORRELATION_WINDOW_SECONDS = CORRELATION_WINDOW_HOURS * 3600;

/**
 * Elevated BP threshold: Stage 1 hypertension per AHA guidelines
 */
const ELEVATED_SYSTOLIC_THRESHOLD = 130;
const ELEVATED_DIASTOLIC_THRESHOLD = 80;

function isElevated(systolic: number, diastolic: number): boolean {
  return systolic >= ELEVATED_SYSTOLIC_THRESHOLD || diastolic >= ELEVATED_DIASTOLIC_THRESHOLD;
}

/**
 * Given a list of missed/skipped medication logs and BP records,
 * returns correlations where a BP reading was taken within CORRELATION_WINDOW_HOURS
 * after a missed dose and was elevated.
 *
 * @param missedLogs  - medication_logs with status === 'missed' or 'skipped'
 * @param bpRecords   - BP records from the same rough time window
 * @param medications - map of medicationId → name for display
 */
export function computeMissedDoseCorrelations(
  missedLogs: MedicationLog[],
  bpRecords: BPRecord[],
  medications: Record<string, string>,
): MissedDoseCorrelation[] {
  const correlations: MissedDoseCorrelation[] = [];

  for (const log of missedLogs) {
    if (log.status !== 'missed' && log.status !== 'skipped') continue;

    const windowEnd = log.timestamp + CORRELATION_WINDOW_SECONDS;

    // Find the first BP reading within the correlation window after the missed dose
    const nearbyReading = bpRecords.find(
      (bp) => bp.timestamp >= log.timestamp && bp.timestamp <= windowEnd,
    );

    const elevated = nearbyReading
      ? isElevated(nearbyReading.systolic, nearbyReading.diastolic)
      : false;

    correlations.push({
      medication_id: log.medication_id,
      medication_name: medications[log.medication_id] || 'Unknown',
      missed_at: log.timestamp,
      bp_reading: nearbyReading
        ? {
            systolic: nearbyReading.systolic,
            diastolic: nearbyReading.diastolic,
            timestamp: nearbyReading.timestamp,
          }
        : undefined,
      bp_elevated: elevated,
    });
  }

  // Return only entries where we have an elevated reading — actionable correlations only
  return correlations.filter((c) => c.bp_elevated);
}

/**
 * Summarises correlations for display on the Analytics / Home page.
 * Returns a human-readable insight string if any correlations are found.
 */
export function summariseMissedDoseCorrelations(
  correlations: MissedDoseCorrelation[],
): string | null {
  if (correlations.length === 0) return null;

  // Group by medication name  
  const grouped: Record<string, number> = {};
  for (const c of correlations) {
    grouped[c.medication_name] = (grouped[c.medication_name] || 0) + 1;
  }

  const parts = Object.entries(grouped).map(
    ([name, count]) => `${count}x missed ${name}`,
  );

  return `Elevated BP correlated with missed doses: ${parts.join(', ')}`;
}
