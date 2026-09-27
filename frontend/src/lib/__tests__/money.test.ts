import { describe, it, expect } from "vitest";
import { formatZar, formatAmount, toMoney } from "../money";

/**
 * House money format — ONE format for the whole ecosystem.
 *
 * The web client used to inline `R{Number(x).toFixed(2)}` in 20+ places while
 * mobile rendered `R 24,99` (decimal comma, from `Intl.NumberFormat('en-ZA')`).
 * Same brand, two countries' conventions: a customer comparing the app and the
 * site saw different prices for the same product.
 *
 * Chosen format, with sources (see docs/design-critique-2026-09-27.md):
 *   "R" + space + space-grouped thousands + decimal POINT + always 2 decimals
 *   → R 24.99 · R 1 234.50 · R 1 000 000.00
 *   - decimal point: SA retail practice (Takealot, till slips, bank statements)
 *   - space grouping: South African number convention (never a comma group)
 *   - "R " prefix with a space: Takealot/Checkers shelf-and-site style
 *
 * The mobile helper (`mobile/src/lib/currency.ts`, cents in) is asserted
 * against the very same table so the two clients cannot drift again.
 */
const HOUSE_FORMAT: Array<[unknown, string]> = [
  [0, "R 0.00"],
  [24.99, "R 24.99"],
  ["24.99", "R 24.99"],
  ["89.9", "R 89.90"],
  [0.5, "R 0.50"],
  [999.99, "R 999.99"],
  [1000, "R 1 000.00"],
  [1234.5, "R 1 234.50"],
  [1234567.89, "R 1 234 567.89"],
  [-5, "R -5.00"],
  ["-12.34", "R -12.34"],
];

describe("formatZar (house money format)", () => {
  it.each(HOUSE_FORMAT)("formats %p as %s", (input, expected) => {
    expect(formatZar(input)).toBe(expected);
  });

  it("degrades unusable values to zero instead of printing RNaN", () => {
    expect(formatZar(null)).toBe("R 0.00");
    expect(formatZar(undefined)).toBe("R 0.00");
    expect(formatZar("")).toBe("R 0.00");
    expect(formatZar("abc")).toBe("R 0.00");
    expect(formatZar(NaN)).toBe("R 0.00");
    expect(formatZar(Infinity)).toBe("R 0.00");
  });

  it("keeps the exact table the mobile client asserts (no drift between clients)", () => {
    // mobile/src/lib/currency.ts takes CENTS: 2499 -> "R 24.99".
    // These pairs are duplicated in mobile/src/lib/__tests__/currency.test.ts.
    const centsToRands: Array<[number, string]> = [
      [0, "R 0.00"],
      [2499, "R 24.99"],
      [123450, "R 1 234.50"],
      [123456789, "R 1 234 567.89"],
      [-500, "R -5.00"],
    ];
    centsToRands.forEach(([cents, expected]) => {
      expect(formatZar(cents / 100)).toBe(expected);
    });
  });
});

describe("formatAmount (number part only)", () => {
  it("omits the symbol for composed/animated contexts", () => {
    expect(formatAmount(24.99)).toBe("24.99");
    expect(formatAmount(1234.5)).toBe("1 234.50");
    expect(formatAmount(null)).toBe("0.00");
  });

  it("is what formatZar wraps", () => {
    expect(formatZar(1234.5)).toBe(`R ${formatAmount(1234.5)}`);
  });
});

describe("toMoney (coercion of API decimal strings)", () => {
  it("accepts the decimal strings the Laravel API returns", () => {
    expect(toMoney("24.99")).toBe(24.99);
    expect(toMoney("0.00")).toBe(0);
    expect(toMoney(12)).toBe(12);
  });

  it("returns 0 for anything that is not a finite amount", () => {
    expect(toMoney(null)).toBe(0);
    expect(toMoney(undefined)).toBe(0);
    expect(toMoney("")).toBe(0);
    expect(toMoney("R 24.99")).toBe(0);
    expect(toMoney(NaN)).toBe(0);
    expect(toMoney(Infinity)).toBe(0);
    expect(toMoney({})).toBe(0);
    expect(toMoney([])).toBe(0);
  });

  it("never lets a boolean through (Number(true) === 1 is a classic trap)", () => {
    expect(toMoney(true)).toBe(0);
    expect(toMoney(false)).toBe(0);
  });
});
