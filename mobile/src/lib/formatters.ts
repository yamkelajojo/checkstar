/**
 * House formatters — dates, numbers, strings.
 *
 * The date helpers print the SAME strings as the web client
 * (frontend/src/lib/dates.ts): one ecosystem, one calendar.
 *
 *     27 Sep 2026 · 27 Sep 2026, 14:30 · 14:30 · 27 Sep · 27 September 2026
 *
 * Explicit month tables rather than `Intl.DateTimeFormat('en-ZA')` on purpose:
 * ICU renders September as "Sept" on some engines and "Sep" on others, and this
 * app runs on Hermes (Android) / JSC (older iOS) while the web runs on V8.
 * Deterministic output beats locale-clever output when two clients must agree.
 *
 * A missing or unparseable date renders DATE_PLACEHOLDER — "Invalid Date" must
 * never reach a customer. Currency formatting (formatZar) lives in ./currency
 * and is re-exported via the lib barrel (src/lib/index.ts).
 */

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/** Shown wherever a date is unknown (matches the web client). */
export const DATE_PLACEHOLDER = '—';

const pad2 = (n: number) => String(n).padStart(2, '0');

/**
 * Parse anything the API can hand us into a Date, or null when it is not a
 * date. Booleans and objects are rejected explicitly: `new Date(true)` is
 * 1970-01-01, which would render as a real order date.
 */
export function toDate(value: unknown): Date | null {
  let candidate: Date;

  if (value instanceof Date) {
    candidate = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    candidate = new Date(trimmed);
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    candidate = new Date(value);
  } else {
    return null;
  }

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

/** Formats a date as "27 Sep 2026". */
export function formatDate(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return DATE_PLACEHOLDER;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Formats a date as "27 Sep 2026, 14:30". */
export function formatDateTime(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return DATE_PLACEHOLDER;
  return `${formatDate(d)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Formats a time as "14:30" (24-hour clock). */
export function formatTime(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return DATE_PLACEHOLDER;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Formats a date as "27 Sep" — compact rows where the year is noise. */
export function formatDayMonth(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return DATE_PLACEHOLDER;
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Formats a date as "27 September 2026" — customer-facing prose. */
export function formatLongDate(date: string | Date | null | undefined): string {
  const d = toDate(date);
  if (!d) return DATE_PLACEHOLDER;
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** Formats a number with thousands separator: "1 234" */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-ZA').format(num);
}

/** Formats a relative time: "2h ago", "3d ago", "just now" */
export function formatRelativeTime(date: string | Date): string {
  const d = toDate(date);
  if (!d) return DATE_PLACEHOLDER;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/** Truncates text with ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

/** Capitalises first letter of each word */
export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
