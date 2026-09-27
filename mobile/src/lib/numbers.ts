/**
 * Numeric coercion at the API boundary.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Laravel backend casts money, coordinates, radii and ratings with
 * `decimal:N` (Product.price, Order.total, Order.delivery_latitude,
 * Store.latitude, Rider.average_rating, …). Laravel serialises decimal casts
 * as **strings** to preserve precision, so the wire value for a rating is
 * `"4.70"` and for a coordinate `"-29.8350000"` — even though the TypeScript
 * types say `number`.
 *
 * That mismatch is invisible to the compiler and fatal at runtime:
 *   "4.70".toFixed(1)                        -> TypeError (blank screen)
 *   ("-29.81" + "-29.83") / 2                -> NaN      (map with no region)
 *   <Marker coordinate={{ latitude: "-29" }}> -> native getDouble() rejects it
 *
 * Anything that came off the wire and is about to be formatted, compared or
 * handed to a native module goes through these helpers first.
 */

/** A value that may arrive as a JSON number or a Laravel decimal string. */
export type Numeric = number | string | null | undefined;

/**
 * Coerce a wire value to a finite number.
 *
 * Returns `fallback` for null/undefined, empty strings and anything that is
 * not a finite number after coercion — so a missing coordinate can never
 * become NaN inside a map region.
 */
export function toNumber(value: Numeric, fallback = 0): number {
  if (value == null || value === '') return fallback;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

/**
 * Like {@link toNumber} but keeps "absent" distinct from zero.
 *
 * Use for coordinates and ratings, where `null` means "we don't have one" and
 * must render as a dash or skip a marker rather than point at 0,0.
 */
export function toOptionalNumber(value: Numeric): number | null {
  if (value == null || value === '') return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

/** A lat/lng pair that may arrive as decimal strings. */
export interface NumericLatLng {
  lat?: Numeric;
  lng?: Numeric;
}

/**
 * Coerce a lat/lng pair to numbers, or return null if either side is absent
 * or non-numeric. Callers get an all-or-nothing coordinate — a marker with
 * half a position is worse than no marker.
 */
export function toLatLng(value: NumericLatLng | null | undefined): { lat: number; lng: number } | null {
  if (!value) return null;
  const lat = toOptionalNumber(value.lat);
  const lng = toOptionalNumber(value.lng);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

/**
 * Format a wire number with a fixed number of decimals without crashing on
 * decimal strings. `null`/`undefined`/non-numeric values render `placeholder`.
 */
export function formatNumeric(
  value: Numeric,
  decimals = 1,
  placeholder = '—',
): string {
  const numeric = toOptionalNumber(value);
  return numeric == null ? placeholder : numeric.toFixed(decimals);
}
