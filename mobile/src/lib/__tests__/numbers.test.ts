import { describe, test, expect } from '@jest/globals';
import { toNumber, toOptionalNumber, toLatLng, formatNumeric } from '../numbers';

/**
 * The Laravel backend casts money, coordinates, radii and ratings with
 * `decimal:N`, which serialises to JSON as **strings**. Every value below is
 * copied verbatim from a live API response (GET /api/rider/active-deliveries,
 * GET /api/rider/stats) so the helper is pinned to the real wire shape rather
 * than to the TypeScript types, which claim `number`.
 */
const WIRE = {
  delivery_latitude: '-29.8350000',
  delivery_longitude: '30.9720000',
  store_latitude: '-29.8167000',
  store_longitude: '30.8833000',
  delivery_radius_km: '10.00',
  total: '469.20',
  average_rating: '4.70',
};

describe('toNumber', () => {
  test('coerces Laravel decimal strings', () => {
    expect(toNumber(WIRE.delivery_latitude)).toBe(-29.835);
    expect(toNumber(WIRE.total)).toBe(469.2);
    expect(toNumber(WIRE.average_rating)).toBe(4.7);
  });

  test('passes real numbers through untouched', () => {
    expect(toNumber(3.65)).toBe(3.65);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(-0.5)).toBe(-0.5);
  });

  test('falls back for absent and non-numeric values', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('')).toBe(0);
    expect(toNumber('not-a-number')).toBe(0);
    expect(toNumber('not-a-number', 42)).toBe(42);
    expect(toNumber(Infinity, 7)).toBe(7);
    expect(toNumber(NaN, 7)).toBe(7);
  });
});

describe('toOptionalNumber', () => {
  test('keeps "absent" distinct from zero', () => {
    expect(toOptionalNumber(null)).toBeNull();
    expect(toOptionalNumber(undefined)).toBeNull();
    expect(toOptionalNumber('')).toBeNull();
    expect(toOptionalNumber('garbage')).toBeNull();
  });

  test('coerces present values, including a legitimate zero', () => {
    expect(toOptionalNumber('0')).toBe(0);
    expect(toOptionalNumber(0)).toBe(0);
    expect(toOptionalNumber(WIRE.delivery_radius_km)).toBe(10);
  });
});

describe('toLatLng', () => {
  test('normalises a decimal-string coordinate pair to numbers', () => {
    expect(
      toLatLng({ lat: WIRE.store_latitude, lng: WIRE.store_longitude }),
    ).toEqual({ lat: -29.8167, lng: 30.8833 });
  });

  test('is all-or-nothing: half a position is worse than none', () => {
    expect(toLatLng({ lat: WIRE.store_latitude, lng: null })).toBeNull();
    expect(toLatLng({ lat: undefined, lng: WIRE.store_longitude })).toBeNull();
    expect(toLatLng({ lat: 'nope', lng: WIRE.store_longitude })).toBeNull();
    expect(toLatLng(null)).toBeNull();
    expect(toLatLng(undefined)).toBeNull();
  });

  test('accepts already-numeric pairs', () => {
    expect(toLatLng({ lat: -29.85, lng: 31.02 })).toEqual({ lat: -29.85, lng: 31.02 });
  });
});

describe('formatNumeric', () => {
  test('formats decimal strings without calling toFixed on a string', () => {
    expect(formatNumeric(WIRE.average_rating, 1)).toBe('4.7');
    expect(formatNumeric('1.47', 1)).toBe('1.5');
    expect(formatNumeric('1.47', 2)).toBe('1.47');
    expect(formatNumeric(14, 0)).toBe('14');
  });

  test('renders a placeholder when the value is missing', () => {
    expect(formatNumeric(null)).toBe('—');
    expect(formatNumeric(undefined)).toBe('—');
    expect(formatNumeric('')).toBe('—');
    expect(formatNumeric('4.70', 1, 'n/a')).toBe('4.7');
    expect(formatNumeric(null, 1, 'n/a')).toBe('n/a');
  });
});
