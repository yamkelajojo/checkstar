import { describe, test, expect } from '@jest/globals';
import { decodePolyline, computeBoundingRegion, type LatLng } from '../polyline';

describe('decodePolyline', () => {
  test('decodes a simple Google-encoded polyline', () => {
    // Standard Google test polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@"
    // Decodes to approximately (38.5, -120.2), (40.7, -120.95), (43.252, -126.453)
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points.length).toBe(3);
    expect(points[0].lat).toBeCloseTo(38.5, 1);
    expect(points[0].lng).toBeCloseTo(-120.2, 1);
    expect(points[1].lat).toBeCloseTo(40.7, 1);
    expect(points[1].lng).toBeCloseTo(-120.95, 1);
    expect(points[2].lat).toBeCloseTo(43.252, 1);
    expect(points[2].lng).toBeCloseTo(-126.453, 1);
  });

  test('decodes a single-point polyline', () => {
    // Encode lat=0, lng=0 → ""
    const points = decodePolyline('??');
    expect(points.length).toBe(1);
    expect(points[0].lat).toBe(0);
    expect(points[0].lng).toBe(0);
  });

  test('returns empty array for empty string', () => {
    const points = decodePolyline('');
    expect(points.length).toBe(0);
  });

  test('handles negative coordinates', () => {
    // Durban CBD: lat=-29.8587, lng=31.0218
    // We can encode it manually or use a known encoded string
    // For now, test that the decoder handles negative results
    const points = decodePolyline('`~oKffqUI');
    expect(points.length).toBeGreaterThanOrEqual(1);
    // The decoded point should be in the southern hemisphere
    if (points.length > 0) {
      expect(points[0].lat).toBeLessThan(0);
    }
  });

  test('decodes polyline with many points', () => {
    // A longer polyline string
    const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
    const points = decodePolyline(encoded);
    expect(points.length).toBeGreaterThan(0);
    // Each point should have lat and lng as numbers
    for (const p of points) {
      expect(typeof p.lat).toBe('number');
      expect(typeof p.lng).toBe('number');
      expect(isFinite(p.lat)).toBe(true);
      expect(isFinite(p.lng)).toBe(true);
    }
  });
});

describe('computeBoundingRegion', () => {
  test('returns default Durban region for empty points', () => {
    const region = computeBoundingRegion([]);
    expect(region.latitude).toBeCloseTo(-29.8587, 3);
    expect(region.longitude).toBeCloseTo(31.0218, 3);
    expect(region.latitudeDelta).toBeGreaterThan(0);
    expect(region.longitudeDelta).toBeGreaterThan(0);
  });

  test('computes bounding box for two points', () => {
    const points = [
      { lat: -29.85, lng: 31.02 },
      { lat: -29.86, lng: 31.03 },
    ];
    const region = computeBoundingRegion(points);
    // Center should be between the two points
    expect(region.latitude).toBeCloseTo(-29.855, 3);
    expect(region.longitude).toBeCloseTo(31.025, 3);
    // Delta should be positive and cover the range
    expect(region.latitudeDelta).toBeGreaterThan(0);
    expect(region.longitudeDelta).toBeGreaterThan(0);
  });

  test('single point returns small delta', () => {
    const points = [{ lat: -29.8587, lng: 31.0218 }];
    const region = computeBoundingRegion(points);
    expect(region.latitude).toBeCloseTo(-29.8587, 4);
    expect(region.longitude).toBeCloseTo(31.0218, 4);
    expect(region.latitudeDelta).toBeGreaterThanOrEqual(0.005);
    expect(region.longitudeDelta).toBeGreaterThanOrEqual(0.005);
  });

  test('padding factor increases delta', () => {
    const points = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
    ];
    const tight = computeBoundingRegion(points, 1.0);
    const padded = computeBoundingRegion(points, 2.0);
    expect(padded.latitudeDelta).toBeGreaterThan(tight.latitudeDelta);
    expect(padded.longitudeDelta).toBeGreaterThan(tight.longitudeDelta);
  });
});

/**
 * The API sends coordinates as Laravel `decimal:7` strings ("-29.8350000").
 * String arithmetic in the midpoint used to concatenate ("-29.83" + "-29.81")
 * and divide by two, producing NaN — react-native-maps then rendered nothing.
 */
describe('computeBoundingRegion with real API values', () => {
  const WIRE = [
    { lat: '-29.8167000', lng: '30.8833000' },
    { lat: '-29.8350000', lng: '30.9720000' },
  ] as unknown as LatLng[];

  test('decimal-string coordinates produce a finite numeric region', () => {
    const region = computeBoundingRegion(WIRE);

    expect(typeof region.latitude).toBe('number');
    expect(typeof region.longitude).toBe('number');
    expect(Number.isFinite(region.latitude)).toBe(true);
    expect(Number.isFinite(region.longitude)).toBe(true);
    expect(region.latitude).toBeCloseTo(-29.82585, 5);
    expect(region.longitude).toBeCloseTo(30.92765, 5);
    expect(region.latitudeDelta).toBeGreaterThan(0);
    expect(region.longitudeDelta).toBeGreaterThan(0);
  });

  test('absent coordinates are dropped instead of becoming 0,0', () => {
    const region = computeBoundingRegion([
      { lat: null, lng: null },
      { lat: undefined, lng: undefined },
    ] as unknown as LatLng[]);

    // Falls back to the Durban CBD default rather than the Gulf of Guinea.
    expect(region.latitude).toBeCloseTo(-29.8587, 4);
    expect(region.longitude).toBeCloseTo(31.0218, 4);
  });

  test('bounds only the usable points when some are missing', () => {
    const region = computeBoundingRegion([
      { lat: 'garbage', lng: '30.9720000' },
      { lat: '-29.8350000', lng: '30.9720000' },
    ] as unknown as LatLng[]);

    expect(region.latitude).toBeCloseTo(-29.835, 5);
    expect(region.longitude).toBeCloseTo(30.972, 5);
  });

  test('an empty point list still yields a usable Durban region', () => {
    const region = computeBoundingRegion([]);

    expect(region.latitude).toBeCloseTo(-29.8587, 4);
    expect(region.longitude).toBeCloseTo(31.0218, 4);
    expect(region.latitudeDelta).toBeGreaterThan(0);
  });
});
