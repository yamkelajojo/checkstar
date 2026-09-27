import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatDayMonth,
  formatLongDate,
  toDate,
  DATE_PLACEHOLDER,
} from "../dates";

/**
 * House date format — shared with mobile (mobile/src/lib/formatters.ts asserts
 * the same table).
 *
 *     27 Sep 2026 · 27 Sep 2026, 14:30 · 14:30 · 27 Sep · 27 September 2026
 *
 * Built from an explicit month table rather than `Intl.DateTimeFormat('en-ZA')`
 * on purpose: ICU renders September as "Sept" in some versions and "Sep" in
 * others, and the two clients run on different engines (V8/ICU on the web,
 * Hermes on Android, JSC on older iOS). A month table prints the same string
 * everywhere, which is the entire point of a shared design language.
 *
 * Missing/unparseable dates render an em dash, never "Invalid Date" — that
 * string used to reach customers whenever the API omitted a timestamp.
 *
 * Tests build local Dates so they are timezone-independent (CI runs UTC, the
 * team runs SAST).
 */
const d = (y: number, m: number, day: number, h = 0, min = 0) =>
  new Date(y, m, day, h, min);

describe("formatDate", () => {
  it("prints day, short month and year", () => {
    expect(formatDate(d(2026, 8, 27))).toBe("27 Sep 2026");
  });

  it("does not zero-pad the day", () => {
    expect(formatDate(d(2026, 0, 5))).toBe("5 Jan 2026");
  });

  it("uses three-letter months on every platform (the ICU 'Sept' trap)", () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    months.forEach((label, index) => {
      expect(formatDate(d(2026, index, 15))).toBe(`15 ${label} 2026`);
    });
  });

  it("accepts the ISO strings the API returns", () => {
    expect(formatDate("2026-09-27T14:30:00")).toBe("27 Sep 2026");
    expect(formatDate(new Date("2026-09-27T14:30:00"))).toBe("27 Sep 2026");
  });
});

describe("formatDateTime", () => {
  it("appends a 24-hour, zero-padded time", () => {
    expect(formatDateTime(d(2026, 8, 27, 14, 30))).toBe("27 Sep 2026, 14:30");
    expect(formatDateTime(d(2026, 8, 27, 9, 5))).toBe("27 Sep 2026, 09:05");
  });
});

describe("formatTime", () => {
  it("prints the clock time on its own", () => {
    expect(formatTime(d(2026, 8, 27, 14, 30))).toBe("14:30");
    expect(formatTime(d(2026, 8, 27, 0, 0))).toBe("00:00");
  });
});

describe("formatDayMonth", () => {
  it("drops the year for compact lists and chart axes", () => {
    expect(formatDayMonth(d(2026, 8, 27))).toBe("27 Sep");
  });
});

describe("formatLongDate", () => {
  it("spells the month out for customer-facing prose", () => {
    expect(formatLongDate(d(2026, 8, 27))).toBe("27 September 2026");
    expect(formatLongDate(d(2026, 11, 1))).toBe("1 December 2026");
  });
});

describe("toDate", () => {
  it("parses what the API sends and rejects the rest", () => {
    expect(toDate("2026-09-27T14:30:00")).toBeInstanceOf(Date);
    expect(toDate(d(2026, 8, 27))).toBeInstanceOf(Date);
    expect(toDate(null)).toBeNull();
    expect(toDate(undefined)).toBeNull();
    expect(toDate("")).toBeNull();
    expect(toDate("not a date")).toBeNull();
    expect(toDate(NaN)).toBeNull();
    expect(toDate({})).toBeNull();
  });
});

describe("missing dates", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty string", ""],
    ["garbage", "not a date"],
  ])("renders an em dash for %s instead of 'Invalid Date'", (_label, value) => {
    expect(formatDate(value)).toBe(DATE_PLACEHOLDER);
    expect(formatDateTime(value)).toBe(DATE_PLACEHOLDER);
    expect(formatTime(value)).toBe(DATE_PLACEHOLDER);
    expect(formatDayMonth(value)).toBe(DATE_PLACEHOLDER);
    expect(formatLongDate(value)).toBe(DATE_PLACEHOLDER);
  });

  it("matches the placeholder the rest of the app uses for unknown values", () => {
    expect(DATE_PLACEHOLDER).toBe("—");
  });
});
