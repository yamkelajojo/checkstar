/**
 * House date format — the SAME strings mobile renders
 * (mobile/src/lib/formatters.ts + its test table). One ecosystem, one calendar.
 *
 *     27 Sep 2026 · 27 Sep 2026, 14:30 · 14:30 · 27 Sep · 27 September 2026
 *
 * Why not `Intl.DateTimeFormat('en-ZA')`: ICU's English month abbreviations are
 * not stable across engines — September is "Sept" on some ICU builds and "Sep"
 * on others, and this app runs on V8 (web), Hermes (Android) and JSC (older
 * iOS). An explicit month table prints the identical string everywhere, which
 * is the whole point of a shared design language.
 *
 * Convention: 24-hour clock, zero-padded time, unpadded day (5 Jan 2026).
 * A missing or unparseable date renders DATE_PLACEHOLDER — "Invalid Date" must
 * never reach a customer.
 */

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** What the app shows when a value is unknown (also used by analytics tiles). */
export const DATE_PLACEHOLDER = "—";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Parse anything the API can hand us into a Date, or null when it is not a
 * date at all. Booleans/objects are rejected explicitly (`new Date(true)` is
 * 1970-01-01, which would render as a real order date).
 */
export function toDate(value: unknown): Date | null {
  let candidate: Date | null = null;

  if (value instanceof Date) {
    candidate = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    candidate = new Date(trimmed);
  } else if (typeof value === "number" && Number.isFinite(value)) {
    candidate = new Date(value);
  } else {
    return null;
  }

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

/** "27 Sep 2026" — the default everywhere a date is shown. */
export function formatDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return DATE_PLACEHOLDER;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "27 Sep 2026, 14:30" — when the time matters (orders, dispatch). */
export function formatDateTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return DATE_PLACEHOLDER;
  return `${formatDate(date)}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** "14:30" — clock face only (rider ping timestamps). */
export function formatTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return DATE_PLACEHOLDER;
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** "27 Sep" — compact lists and chart axes where the year is noise. */
export function formatDayMonth(value: unknown): string {
  const date = toDate(value);
  if (!date) return DATE_PLACEHOLDER;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "27 September 2026" — customer-facing prose (sale windows, policies). */
export function formatLongDate(value: unknown): string {
  const date = toDate(value);
  if (!date) return DATE_PLACEHOLDER;
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}
