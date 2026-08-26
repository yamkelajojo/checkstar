import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  truncate,
  titleCase,
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
      expect(result).toMatch(/^\d{1,2} \w{3} \d{4}$/);
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