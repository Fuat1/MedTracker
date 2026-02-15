jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import {
  generateUUID,
  getCurrentTimestamp,
  getTimezoneOffset,
  formatDate,
  formatTime,
  formatDateTime,
  getRelativeTime,
} from '../index';

describe('generateUUID', () => {
  it('returns a string matching UUID v4 format', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('returns unique values on consecutive calls', () => {
    const a = generateUUID();
    const b = generateUUID();
    expect(a).not.toBe(b);
  });
});

describe('getCurrentTimestamp', () => {
  it('returns a number within 2 seconds of Date.now()/1000', () => {
    const ts = getCurrentTimestamp();
    const expected = Math.floor(Date.now() / 1000);
    expect(Math.abs(ts - expected)).toBeLessThanOrEqual(2);
  });
});

describe('getTimezoneOffset', () => {
  it('returns a number', () => {
    expect(typeof getTimezoneOffset()).toBe('number');
  });
});

describe('formatDate', () => {
  it('formats a Unix timestamp into a readable date string', () => {
    // Jan 15, 2025 00:00:00 UTC = 1736899200
    const ts = 1736899200;
    const formatted = formatDate(ts);
    // Should contain year and some date representation
    expect(formatted).toContain('2025');
  });
});

describe('formatTime', () => {
  it('returns a string with colon separator (HH:MM format)', () => {
    const ts = 1736899200;
    const formatted = formatTime(ts);
    expect(formatted).toContain(':');
  });
});

describe('formatDateTime', () => {
  it('combines date and time', () => {
    const ts = 1736899200;
    const formatted = formatDateTime(ts);
    expect(formatted).toContain('2025');
    expect(formatted).toContain(':');
  });
});

describe('getRelativeTime', () => {
  it('returns "Just now" for timestamps < 60 seconds ago', () => {
    const now = getCurrentTimestamp();
    expect(getRelativeTime(now - 10)).toBe('Just now');
    expect(getRelativeTime(now)).toBe('Just now');
  });

  it('returns minutes ago for timestamps < 1 hour', () => {
    const now = getCurrentTimestamp();
    const result = getRelativeTime(now - 300); // 5 minutes ago
    expect(result).toContain('5');
    expect(result).toContain('minutes ago');
  });

  it('returns singular "minute" for 1 minute ago', () => {
    const now = getCurrentTimestamp();
    const result = getRelativeTime(now - 90); // 1.5 min → 1 minute
    expect(result).toContain('1');
    expect(result).toContain('minute ago');
    expect(result).not.toContain('minutes ago');
  });

  it('returns hours ago for timestamps < 1 day', () => {
    const now = getCurrentTimestamp();
    const result = getRelativeTime(now - 7200); // 2 hours ago
    expect(result).toContain('2');
    expect(result).toContain('hours ago');
  });

  it('returns singular "hour" for 1 hour ago', () => {
    const now = getCurrentTimestamp();
    const result = getRelativeTime(now - 3600); // exactly 1 hour
    expect(result).toContain('1');
    expect(result).toContain('hour ago');
    expect(result).not.toContain('hours ago');
  });

  it('returns days ago for timestamps < 1 week', () => {
    const now = getCurrentTimestamp();
    const result = getRelativeTime(now - 172800); // 2 days ago
    expect(result).toContain('2');
    expect(result).toContain('days ago');
  });

  it('returns formatted date for timestamps >= 1 week', () => {
    const now = getCurrentTimestamp();
    const result = getRelativeTime(now - 700000); // ~8 days ago
    // Should fall back to formatDate, which contains a year
    expect(result).not.toContain('ago');
  });
});
