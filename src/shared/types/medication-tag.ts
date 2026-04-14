export const MEDICATION_TAG_PREFIX = 'medication:';

/** Creates a bp_tags.tag value for a specific medication: "medication:<uuid>" */
export function makeMedicationTagKey(medicationId: string): string {
  return `${MEDICATION_TAG_PREFIX}${medicationId}`;
}

/** Returns true if the tag key represents a specific medication selection */
export function isMedicationTagKey(tagKey: string): boolean {
  return tagKey.startsWith(MEDICATION_TAG_PREFIX);
}

/** Extracts the medication UUID from a "medication:<uuid>" tag key */
export function getMedicationTagId(tagKey: string): string {
  return tagKey.slice(MEDICATION_TAG_PREFIX.length);
}
