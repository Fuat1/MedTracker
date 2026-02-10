import type { BPRecord } from '../api';

export type HistoryFilterType = 'all' | 'morning' | 'evening' | 'highAlert';

export interface RecordSection {
  titleKey: string;
  data: BPRecord[];
}

/**
 * Groups BP records into time-based sections (Today, Yesterday, Last Week, Older).
 * Expects records sorted by timestamp DESC (newest first).
 */
export function groupRecordsByTimePeriod(records: BPRecord[]): RecordSection[] {
  if (records.length === 0) return [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const yesterdayStart = todayStart - 86400;
  const lastWeekStart = todayStart - 7 * 86400;

  const today: BPRecord[] = [];
  const yesterday: BPRecord[] = [];
  const lastWeek: BPRecord[] = [];
  const older: BPRecord[] = [];

  for (const record of records) {
    if (record.timestamp >= todayStart) {
      today.push(record);
    } else if (record.timestamp >= yesterdayStart) {
      yesterday.push(record);
    } else if (record.timestamp >= lastWeekStart) {
      lastWeek.push(record);
    } else {
      older.push(record);
    }
  }

  const sections: RecordSection[] = [];

  if (today.length > 0) {
    sections.push({ titleKey: 'history.sections.today', data: today });
  }
  if (yesterday.length > 0) {
    sections.push({ titleKey: 'history.sections.yesterday', data: yesterday });
  }
  if (lastWeek.length > 0) {
    sections.push({ titleKey: 'history.sections.lastWeek', data: lastWeek });
  }
  if (older.length > 0) {
    sections.push({ titleKey: 'history.sections.older', data: older });
  }

  return sections;
}

/**
 * Filters BP records based on filter type.
 * The isHighAlert callback is provided by the caller to maintain FSD compliance
 * (shared layer cannot import from entities).
 */
export function filterRecords(
  records: BPRecord[],
  filter: HistoryFilterType,
  isHighAlert?: (record: BPRecord) => boolean,
): BPRecord[] {
  switch (filter) {
    case 'all':
      return records;
    case 'morning':
      return records.filter(r => new Date(r.timestamp * 1000).getHours() < 12);
    case 'evening':
      return records.filter(r => new Date(r.timestamp * 1000).getHours() >= 12);
    case 'highAlert':
      return isHighAlert ? records.filter(isHighAlert) : records;
    default:
      return records;
  }
}

/**
 * Splits a Unix timestamp (seconds) into time and AM/PM period for compact card display.
 * Example: { time: "09:41", period: "AM" }
 */
export function formatTimeSplit(timestamp: number): { time: string; period: string } {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, '0');

  return {
    time: `${displayHours.toString().padStart(2, '0')}:${paddedMinutes}`,
    period,
  };
}
