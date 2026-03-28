/// <reference lib="dom" />
/**
 * Invite code generation and validation.
 *
 * Codes are 6-character alphanumeric (uppercase), cryptographically random.
 * They expire 24 hours after creation.
 */

import { INVITE_CODE_LENGTH, INVITE_EXPIRY_HOURS } from '@/shared/config';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 (confusable)

/**
 * Generate a cryptographically random 6-character invite code.
 */
export function generateInviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH));
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length]!)
    .join('');
}

/**
 * Returns the expiry Unix timestamp (seconds) for a new invite.
 */
export function computeExpiresAt(createdAt?: number): number {
  const base = createdAt ?? Math.floor(Date.now() / 1000);
  return base + INVITE_EXPIRY_HOURS * 60 * 60;
}

/**
 * Returns true if the invite code has not yet expired.
 */
export function isInviteValid(expiresAt: number): boolean {
  return Math.floor(Date.now() / 1000) < expiresAt;
}

/**
 * Validate the format of a user-entered invite code (case-insensitive).
 * Returns the normalised uppercase code or null if invalid.
 */
export function normalizeInviteCode(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  if (upper.length !== INVITE_CODE_LENGTH) {
    return null;
  }
  // Check all chars are in the charset
  for (const char of upper) {
    if (!CHARSET.includes(char)) {
      return null;
    }
  }
  return upper;
}
