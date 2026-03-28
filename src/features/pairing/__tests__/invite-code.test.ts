/**
 * Tests for invite code generation, validation, and expiry logic.
 */

import {
  generateInviteCode,
  computeExpiresAt,
  isInviteValid,
  normalizeInviteCode,
} from '../lib/invite-code';

// Polyfill crypto for Node/Jest
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: nodeCrypto.webcrypto,
  });
}

describe('generateInviteCode', () => {
  it('generates a 6-character code', () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(6);
  });

  it('uses only valid charset characters (no 0, 1, I, O)', () => {
    // Generate many codes to check character distribution
    const codes = Array.from({ length: 100 }, () => generateInviteCode());
    for (const code of codes) {
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
      expect(code).not.toContain('0');
      expect(code).not.toContain('1');
      expect(code).not.toContain('I');
      expect(code).not.toContain('O');
    }
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateInviteCode()));
    // With 32 chars and 6 positions, collision probability is negligible
    // We just verify no obvious deterministic behaviour
    expect(codes.size).toBeGreaterThan(190);
  });
});

describe('computeExpiresAt', () => {
  it('returns a timestamp 24 hours after the given createdAt', () => {
    const createdAt = 1000000;
    const expiresAt = computeExpiresAt(createdAt);
    expect(expiresAt).toBe(createdAt + 24 * 60 * 60);
  });

  it('uses current time when createdAt is not provided', () => {
    const before = Math.floor(Date.now() / 1000);
    const expiresAt = computeExpiresAt();
    const after = Math.floor(Date.now() / 1000);
    expect(expiresAt).toBeGreaterThanOrEqual(before + 24 * 60 * 60);
    expect(expiresAt).toBeLessThanOrEqual(after + 24 * 60 * 60);
  });
});

describe('isInviteValid', () => {
  it('returns true for future expiry', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    expect(isInviteValid(future)).toBe(true);
  });

  it('returns false for past expiry', () => {
    const past = Math.floor(Date.now() / 1000) - 1;
    expect(isInviteValid(past)).toBe(false);
  });
});

describe('normalizeInviteCode', () => {
  it('normalizes lowercase input to uppercase', () => {
    expect(normalizeInviteCode('abc234')).toBe('ABC234');
  });

  it('trims whitespace', () => {
    expect(normalizeInviteCode('  ABC234  ')).toBe('ABC234');
  });

  it('returns null for codes that are too short', () => {
    expect(normalizeInviteCode('ABC2')).toBeNull();
  });

  it('returns null for codes that are too long', () => {
    expect(normalizeInviteCode('ABC2345678')).toBeNull();
  });

  it('returns null for codes with invalid characters', () => {
    expect(normalizeInviteCode('ABC0AB')).toBeNull(); // 0 is not in charset
    expect(normalizeInviteCode('ABC1AB')).toBeNull(); // 1 is not in charset
    expect(normalizeInviteCode('ABIOAB')).toBeNull(); // I, O not in charset
    expect(normalizeInviteCode('AB!@#$')).toBeNull();
  });

  it('accepts valid 6-character codes', () => {
    expect(normalizeInviteCode('ABC234')).toBe('ABC234');
    expect(normalizeInviteCode('ZZZZZ9')).toBe('ZZZZZ9');
  });
});
