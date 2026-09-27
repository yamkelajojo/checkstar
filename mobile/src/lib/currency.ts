/**
 * House money format — the SAME string the web client renders
 * (frontend/src/lib/money.ts + its test table). One ecosystem, one price.
 *
 *     R 24.99 · R 1 234.50 · R -4.50
 *
 *  - "R" + space        — South African retail style (Takealot, Checkers)
 *  - space grouping     — South African number convention (never a comma group)
 *  - decimal POINT      — what tills, bank statements and SA grocer sites print.
 *                          `Intl.NumberFormat('en-ZA')` renders the decimal
 *                          COMMA ("R 12,34"), which is the school/SANS
 *                          convention and made mobile disagree with the web.
 *                          Hence no Intl here: this formatter is deterministic
 *                          on every ICU version, on Hermes and on Android JSC.
 *
 * Units: the API serves rands as decimal strings ("12.34"); mobile normalises
 * them to whole CENTS (see lib/product.ts) so cart maths stays float-safe.
 * The web formats rands directly. Different units in, identical string out —
 * asserted on both sides of the repo.
 */

/** Thousands separator: a plain space (South African convention). */
const GROUP_SEPARATOR = ' ';

/**
 * Format a monetary amount in South African Rand.
 * @param cents whole-cents amount (1234 -> "R 12.34"); non-finite input
 *              degrades to zero rather than printing "R NaN" on a price row.
 */
export function formatZar(cents: number): string {
  const value = typeof cents === 'number' && Number.isFinite(cents) ? cents : 0;
  const amount = value / 100;
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, decimals] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
  return `R ${negative ? '-' : ''}${grouped}.${decimals}`;
}
