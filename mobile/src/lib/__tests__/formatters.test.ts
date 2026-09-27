import {
  formatDate,
  formatDateTime,
  formatTime,
  formatDayMonth,
  formatLongDate,
  formatNumber,
  formatRelativeTime,
  toDate,
  truncate,
  titleCase,
  DATE_PLACEHOLDER,
} from '../formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('formats ISO string date', () => {
      const result = formatDate('2026-08-15T10:30:00Z');
      expect(result).toMatch(/^\d{1,2} Aug 2026$/);
    });

    it('formats Date object', () => {
      const result = formatDate(new Date('2026-08-15T10:30:00Z'));
      expect(result).toMatch(/^\d{1,2} Aug 2026$/);
    });

    it('handles different months', () => {
      const jan = formatDate('2026-01-15T10:30:00Z');
      const dec = formatDate('2026-12-15T10:30:00Z');
      expect(jan).toMatch(/Jan/);
      expect(dec).toMatch(/Dec/);
    });
  });

  describe('formatDateTime', () => {
    it('formats ISO string with time', () => {
      const result = formatDateTime('2026-08-15T10:30:00Z');
      expect(result).toMatch(/^\d{1,2} Aug 2026, \d{2}:\d{2}$/);
    });

    it('formats Date object with time', () => {
      const result = formatDateTime(new Date('2026-08-15T10:30:00Z'));
      expect(result).toMatch(/^\d{1,2} Aug 2026, \d{2}:\d{2}$/);
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with thousands separator (en-ZA uses non-breaking space)', () => {
      expect(formatNumber(1234)).toBe('1\u00A0234');
      expect(formatNumber(1234567)).toBe('1\u00A0234\u00A0567');
    });

    it('handles small numbers without separator', () => {
      expect(formatNumber(123)).toBe('123');
      expect(formatNumber(0)).toBe('0');
    });

    it('handles decimal numbers (en-ZA uses comma for decimals)', () => {
      expect(formatNumber(1234.56)).toBe('1\u00A0234,56');
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date();
    const minuteMs = 60 * 1000;
    const hourMs = 60 * minuteMs;
    const dayMs = 24 * hourMs;

    it('returns "just now" for less than a minute', () => {
      const result = formatRelativeTime(new Date(now.getTime() - 30 * 1000));
      expect(result).toBe('just now');
    });

    it('returns minutes for less than an hour', () => {
      const result = formatRelativeTime(new Date(now.getTime() - 30 * minuteMs));
      expect(result).toBe('30m ago');
    });

    it('returns hours for less than a day', () => {
      const result = formatRelativeTime(new Date(now.getTime() - 5 * hourMs));
      expect(result).toBe('5h ago');
    });

    it('returns days for less than a week', () => {
      const result = formatRelativeTime(new Date(now.getTime() - 3 * dayMs));
      expect(result).toBe('3d ago');
    });

    it('returns formatted date for more than a week', () => {
      const result = formatRelativeTime(new Date(now.getTime() - 10 * dayMs));
      expect(result).toMatch(/^\d{1,2} \w{3,4} \d{4}$/);
    });
  });

  describe('truncate', () => {
    it('returns original text if shorter than maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('truncates text and adds ellipsis (maxLength includes ellipsis)', () => {
      // Truncates to maxLength - 1 chars + ellipsis
      expect(truncate('Hello World', 8)).toBe('Hello W…');
    });

    it('handles exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('handles length less than ellipsis', () => {
      // When maxLength <= 1, returns first maxLength-1 chars + ellipsis
      expect(truncate('Hello', 1)).toBe('…');
    });
  });

  describe('titleCase', () => {
    it('capitalizes first letter of each word', () => {
      expect(titleCase('hello world')).toBe('Hello World');
      expect(titleCase('checkstar delivery')).toBe('Checkstar Delivery');
    });

    it('lowercases rest of word', () => {
      expect(titleCase('HELLO WORLD')).toBe('Hello World');
    });

    it('handles single word', () => {
      expect(titleCase('checkstar')).toBe('Checkstar');
    });

    it('handles apostrophes', () => {
      expect(titleCase("o'brien")).toBe("O'brien");
    });
  });
});

/**
 * House date format — the SAME table the web client asserts
 * (frontend/src/lib/__tests__/dates.test.ts). One ecosystem, one calendar.
 *
 *     27 Sep 2026 · 27 Sep 2026, 14:30 · 14:30 · 27 Sep · 27 September 2026
 *
 * Explicit month tables, not Intl: ICU prints "Sept" for September on some
 * engines and "Sep" on others, and this app runs on Hermes (Android) and JSC
 * (older iOS) while the web runs on V8. Deterministic beats locale-clever.
 *
 * Local Dates are used so the assertions hold in any timezone (CI is UTC, the
 * team is SAST).
 */
describe('house date format (shared with the web client)', () => {
  const d = (y: number, m: number, day: number, h = 0, min = 0) =>
    new Date(y, m, day, h, min);

  it('prints day, short month and year', () => {
    expect(formatDate(d(2026, 8, 27))).toBe('27 Sep 2026');
  });

  it('does not zero-pad the day', () => {
    expect(formatDate(d(2026, 0, 5))).toBe('5 Jan 2026');
  });

  it('uses three-letter months everywhere (the ICU "Sept" trap)', () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    months.forEach((label, index) => {
      expect(formatDate(d(2026, index, 15))).toBe(`15 ${label} 2026`);
    });
  });

  it('appends a 24-hour zero-padded time', () => {
    expect(formatDateTime(d(2026, 8, 27, 14, 30))).toBe('27 Sep 2026, 14:30');
    expect(formatDateTime(d(2026, 8, 27, 9, 5))).toBe('27 Sep 2026, 09:05');
  });

  it('formats a clock time on its own', () => {
    expect(formatTime(d(2026, 8, 27, 14, 30))).toBe('14:30');
    expect(formatTime(d(2026, 8, 27, 0, 0))).toBe('00:00');
  });

  it('drops the year for compact rows', () => {
    expect(formatDayMonth(d(2026, 8, 27))).toBe('27 Sep');
  });

  it('spells the month out for customer prose', () => {
    expect(formatLongDate(d(2026, 8, 27))).toBe('27 September 2026');
    expect(formatLongDate(d(2026, 11, 1))).toBe('1 December 2026');
  });

  it('accepts the ISO strings the API returns', () => {
    expect(formatDate('2026-09-27T14:30:00')).toBe('27 Sep 2026');
    expect(formatDate(new Date('2026-09-27T14:30:00'))).toBe('27 Sep 2026');
  });

  it('parses or rejects through toDate', () => {
    expect(toDate('2026-09-27T14:30:00')).toBeInstanceOf(Date);
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate('')).toBeNull();
    expect(toDate('not a date')).toBeNull();
    expect(toDate(true)).toBeNull();
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['garbage', 'not a date'],
  ])('renders an em dash for %s instead of "Invalid Date"', (_label, value) => {
    expect(formatDate(value as never)).toBe(DATE_PLACEHOLDER);
    expect(formatDateTime(value as never)).toBe(DATE_PLACEHOLDER);
    expect(formatTime(value as never)).toBe(DATE_PLACEHOLDER);
    expect(formatDayMonth(value as never)).toBe(DATE_PLACEHOLDER);
    expect(formatLongDate(value as never)).toBe(DATE_PLACEHOLDER);
  });
});
