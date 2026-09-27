import { formatZar } from '../currency';

/**
 * House money format — the SAME table the web client asserts
 * (frontend/src/lib/__tests__/money.test.ts). One ecosystem, one price string.
 *
 *     R 24.99 · R 1 234.50 · R -4.50
 *
 *  - decimal POINT: what South African shoppers read on a shelf edge, a till
 *    slip and every SA grocer online (Takealot, Checkers Sixty60). The decimal
 *    comma is the school/SANS convention and is what `Intl.NumberFormat('en-ZA')`
 *    produces — it is not what the tills print.
 *  - space thousands grouping: South African convention (never a comma group).
 *  - "R " with a space: SA retail style.
 *
 * Mobile takes whole CENTS (the app normalises the API's rand decimal strings to
 * integers for float-safe cart maths — see lib/product.ts); the web takes rands.
 * Different units in, identical string out.
 */
describe('formatZar (house money format)', () => {
  it('formats zero', () => {
    expect(formatZar(0)).toBe('R 0.00');
  });

  it('formats cents as two-decimal ZAR', () => {
    expect(formatZar(1234)).toBe('R 12.34');
  });

  it('keeps trailing cents digits', () => {
    expect(formatZar(999)).toBe('R 9.99');
    expect(formatZar(1200)).toBe('R 12.00');
    expect(formatZar(50)).toBe('R 0.50');
  });

  it('handles negative amounts', () => {
    expect(formatZar(-450)).toBe('R -4.50');
  });

  it('groups thousands with spaces, South African style', () => {
    expect(formatZar(100000)).toBe('R 1 000.00');
    expect(formatZar(123450)).toBe('R 1 234.50');
    expect(formatZar(123456789)).toBe('R 1 234 567.89');
  });

  it('does not group below a thousand', () => {
    expect(formatZar(99999)).toBe('R 999.99');
  });

  it('degrades unusable input to zero instead of printing R NaN', () => {
    expect(formatZar(Number.NaN)).toBe('R 0.00');
    expect(formatZar(Number.POSITIVE_INFINITY)).toBe('R 0.00');
    // Callers hand us API values; a null/undefined must not crash a price row.
    expect(formatZar(undefined as unknown as number)).toBe('R 0.00');
    expect(formatZar(null as unknown as number)).toBe('R 0.00');
  });

  it('matches the web client string-for-string (cross-platform contract)', () => {
    // web: formatZar(cents / 100) — same table, different input unit.
    const shared: Array<[number, string]> = [
      [0, 'R 0.00'],
      [2499, 'R 24.99'],
      [123450, 'R 1 234.50'],
      [123456789, 'R 1 234 567.89'],
      [-500, 'R -5.00'],
    ];
    shared.forEach(([cents, expected]) => {
      expect(formatZar(cents)).toBe(expected);
    });
  });
});
