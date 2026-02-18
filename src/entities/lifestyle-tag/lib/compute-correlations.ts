import type { BPRecord } from '../../../shared/api/bp-repository';
import type { LifestyleTag } from '../../../shared/types/lifestyle-tag';

export interface TagCorrelation {
  tag: LifestyleTag;
  avgSystolicDelta: number;
  avgDiastolicDelta: number;
  taggedCount: number;
  untaggedCount: number;
}

const MIN_SAMPLE_SIZE = 3;

/**
 * Computes per-tag average BP delta vs readings without that tag.
 * Only includes tags with >= MIN_SAMPLE_SIZE tagged AND untagged readings.
 * Sorted by absolute systolic delta descending.
 */
export function computeTagCorrelations(
  records: BPRecord[],
  tagMap: Record<string, LifestyleTag[]>,
): TagCorrelation[] {
  if (records.length === 0) return [];

  // Collect all unique tags present in the data
  const allTags = new Set<LifestyleTag>();
  for (const tags of Object.values(tagMap)) {
    for (const tag of tags) {
      allTags.add(tag);
    }
  }

  const correlations: TagCorrelation[] = [];

  for (const tag of allTags) {
    const tagged: BPRecord[] = [];
    const untagged: BPRecord[] = [];

    for (const record of records) {
      const recordTags = tagMap[record.id];
      if (recordTags && recordTags.includes(tag)) {
        tagged.push(record);
      } else {
        untagged.push(record);
      }
    }

    if (tagged.length < MIN_SAMPLE_SIZE || untagged.length < MIN_SAMPLE_SIZE) {
      continue;
    }

    const taggedAvgSys = tagged.reduce((sum, r) => sum + r.systolic, 0) / tagged.length;
    const taggedAvgDia = tagged.reduce((sum, r) => sum + r.diastolic, 0) / tagged.length;
    const untaggedAvgSys = untagged.reduce((sum, r) => sum + r.systolic, 0) / untagged.length;
    const untaggedAvgDia = untagged.reduce((sum, r) => sum + r.diastolic, 0) / untagged.length;

    correlations.push({
      tag,
      avgSystolicDelta: Math.round(taggedAvgSys - untaggedAvgSys),
      avgDiastolicDelta: Math.round(taggedAvgDia - untaggedAvgDia),
      taggedCount: tagged.length,
      untaggedCount: untagged.length,
    });
  }

  // Sort by absolute systolic delta, largest first
  correlations.sort((a, b) => Math.abs(b.avgSystolicDelta) - Math.abs(a.avgSystolicDelta));

  return correlations;
}
