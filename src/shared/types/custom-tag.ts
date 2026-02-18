export const CUSTOM_TAG_PREFIX = 'custom:';

export interface CustomTag {
  id: string;       // UUID
  label: string;
  icon: string;     // Ionicons name
  createdAt: number;
}

/** Creates a bp_tags.tag value for a custom tag: "custom:<uuid>" */
export function makeCustomTagKey(id: string): string {
  return `${CUSTOM_TAG_PREFIX}${id}`;
}

/** Returns true if the tag key represents a custom tag */
export function isCustomTagKey(tagKey: string): boolean {
  return tagKey.startsWith(CUSTOM_TAG_PREFIX);
}

/** Extracts the UUID from a "custom:<uuid>" tag key */
export function getCustomTagId(tagKey: string): string {
  return tagKey.slice(CUSTOM_TAG_PREFIX.length);
}
