import {
  buildCalendarGrid,
  isSameDay,
  isFuture,
} from '../DateTimePicker';

// ─── buildCalendarGrid ────────────────────────────────────────────────────────

describe('buildCalendarGrid', () => {
  it('always returns exactly 42 cells', () => {
    // April 2026, March 2026, February 2024 (leap year)
    expect(buildCalendarGrid(2026, 3).length).toBe(42); // April
    expect(buildCalendarGrid(2026, 2).length).toBe(42); // March
    expect(buildCalendarGrid(2024, 1).length).toBe(42); // Feb leap
  });

  it('fills leading cells from the previous month for April 2026', () => {
    // April 1, 2026 is a Wednesday (day index 3), so 3 leading prev-month cells
    const cells = buildCalendarGrid(2026, 3);
    expect(cells[0].isCurrentMonth).toBe(false);
    expect(cells[0].date.getMonth()).toBe(2); // March
    expect(cells[0].date.getDate()).toBe(29); // March 29 (Sunday)
    expect(cells[1].date.getDate()).toBe(30); // March 30
    expect(cells[2].date.getDate()).toBe(31); // March 31
  });

  it('marks April days as isCurrentMonth: true', () => {
    const cells = buildCalendarGrid(2026, 3);
    // Cell index 3 = April 1
    expect(cells[3].isCurrentMonth).toBe(true);
    expect(cells[3].date.getDate()).toBe(1);
    expect(cells[3].date.getMonth()).toBe(3); // April
    // Cell index 32 = April 30
    expect(cells[32].isCurrentMonth).toBe(true);
    expect(cells[32].date.getDate()).toBe(30);
  });

  it('fills trailing cells from the next month', () => {
    const cells = buildCalendarGrid(2026, 3);
    // April has 30 days; 3 leading + 30 = 33; trailing = 9 (May 1-9)
    expect(cells[33].isCurrentMonth).toBe(false);
    expect(cells[33].date.getMonth()).toBe(4); // May
    expect(cells[33].date.getDate()).toBe(1);
    expect(cells[41].date.getDate()).toBe(9); // May 9
  });

  it('handles a month starting on Sunday (no leading cells)', () => {
    // March 2026: March 1 is a Sunday (day index 0)
    const cells = buildCalendarGrid(2026, 2);
    expect(cells[0].isCurrentMonth).toBe(true);
    expect(cells[0].date.getDate()).toBe(1);
  });
});

// ─── isSameDay ────────────────────────────────────────────────────────────────

describe('isSameDay', () => {
  it('returns true for two Date objects on the same calendar day', () => {
    const a = new Date(2026, 3, 10, 8, 0, 0);
    const b = new Date(2026, 3, 10, 23, 59, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for dates on different days', () => {
    const a = new Date(2026, 3, 10);
    const b = new Date(2026, 3, 11);
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for same day in different months', () => {
    const a = new Date(2026, 3, 10);
    const b = new Date(2026, 4, 10);
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for same day in different years', () => {
    const a = new Date(2025, 3, 10);
    const b = new Date(2026, 3, 10);
    expect(isSameDay(a, b)).toBe(false);
  });
});

// ─── isFuture ─────────────────────────────────────────────────────────────────

describe('isFuture', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns true for a date strictly in the future', () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date(2026, 3, 10, 12, 0, 0).getTime());
    const future = new Date(2026, 3, 10, 13, 0, 0);
    expect(isFuture(future)).toBe(true);
  });

  it('returns false for a date in the past', () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date(2026, 3, 10, 12, 0, 0).getTime());
    const past = new Date(2026, 3, 10, 11, 0, 0);
    expect(isFuture(past)).toBe(false);
  });

  it('returns false for a date exactly equal to now', () => {
    const now = new Date(2026, 3, 10, 12, 0, 0).getTime();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    expect(isFuture(new Date(now))).toBe(false);
  });
});
