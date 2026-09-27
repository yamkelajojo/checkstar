/**
 * House money format — one format for the whole Checkstar ecosystem.
 *
 *     R 24.99 · R 1 234.50 · R 1 000 000.00 · R -5.00
 *
 *  - "R" + space            — SA retail style (Takealot/Checkers shelf & site)
 *  - space thousands group  — South African number convention (never a comma)
 *  - decimal POINT          — SA commerce practice (till slips, bank statements,
 *                             every SA grocer online); the decimal comma is the
 *                             school/SANS convention but not what shoppers read
 *                             on a price tag
 *  - always 2 decimals      — grocery prices are cents-precise
 *
 * The mobile client (`mobile/src/lib/currency.ts`) renders the identical string
 * and its test suite asserts the same table, so the two clients cannot drift.
 *
 * Units: the Laravel API serves rands as **decimal strings** ("24.99"); the web
 * formats those directly. Mobile normalises to integer **cents** internally for
 * float-safe cart maths and its helper takes cents — same output, different
 * input unit (documented in both JSDocs).
 *
 * Deliberately NOT Intl.NumberFormat('en-ZA'): ICU renders that locale with a
 * decimal comma ("R 1 234,50"), which is why mobile and web disagreed. The
 * formatter below is deterministic on every platform and ICU version.
 */

/** Thousands separator: a plain space (SA convention). */
const GROUP_SEPARATOR = " ";

/**
 * Coerce anything the API can hand us (decimal string, number, null) into a
 * finite rand amount. Unusable values become 0 rather than NaN — a price that
 * renders "RNaN" on a product card is worse than one that renders R 0.00.
 *
 * Booleans and arrays are rejected explicitly: `Number(true) === 1` and
 * `Number([]) === 0` would otherwise sail through as "prices".
 */
export function toMoney(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * The number part of a price, house-formatted: "1 234.50".
 * Use this where the symbol is rendered separately (animated totals).
 */
export function formatAmount(value: unknown): string {
  const amount = toMoney(value);
  const negative = amount < 0;
  const fixed = Math.abs(amount).toFixed(2);
  const [whole, decimals] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
  return `${negative ? "-" : ""}${grouped}.${decimals}`;
}

/**
 * A price, house-formatted with its symbol: "R 1 234.50".
 * This is the only way money should reach the DOM.
 */
export function formatZar(value: unknown): string {
  return `R ${formatAmount(value)}`;
}
