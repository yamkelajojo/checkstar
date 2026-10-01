import {
  DURBAN_ADDRESS_CATALOG,
  searchAddressSuggestions,
  resolveAddressCoordinates,
  reverseResolveAddress,
} from '../addressSuggestions';
import { decodePolyline, encodePolyline, buildSyntheticRoadGeometry } from '../polyline';

describe('addressSuggestions & synthetic road geometry (White-Box Coverage: Statement, Branch, Condition, Path & Loop)', () => {
  describe('searchAddressSuggestions', () => {
    it('returns the first N catalog items when query is empty or whitespace (empty-query branch + limit boundaries)', () => {
      expect(searchAddressSuggestions('')).toHaveLength(5);
      expect(searchAddressSuggestions('   ', 3)).toHaveLength(3);
      expect(searchAddressSuggestions('', 0)).toEqual([]);
      expect(searchAddressSuggestions('', 1)[0].id).toBe(DURBAN_ADDRESS_CATALOG[0].id);
    });

    it('scores haystack prefix highest, address substring second, and token matches third (all scoring branches)', () => {
      const prefixResults = searchAddressSuggestions('195 florida road');
      expect(prefixResults.length).toBeGreaterThan(0);
      expect(prefixResults[0].address).toContain('195 Florida Road');

      const substringResults = searchAddressSuggestions('florida road');
      expect(substringResults.some((a) => a.address.includes('195 Florida Road'))).toBe(true);

      const multiToken = searchAddressSuggestions('morningside 4001');
      expect(multiToken.length).toBeGreaterThan(0);
      expect(multiToken[0].suburb).toBe('Morningside');
    });

    it('returns an empty array when no token matches (score === 0 filter branch)', () => {
      expect(searchAddressSuggestions('zzzz-no-such-durban-street-99999')).toEqual([]);
    });
  });

  describe('resolveAddressCoordinates', () => {
    it('resolves exact catalog match (Branch 1)', () => {
      const target = DURBAN_ADDRESS_CATALOG[0];
      expect(resolveAddressCoordinates(target.address)).toEqual({
        latitude: target.latitude,
        longitude: target.longitude,
      });
    });

    it('resolves street-level catalog match when street words >= 5 chars are present (Branch 2)', () => {
      const target = DURBAN_ADDRESS_CATALOG.find((a) => a.address.includes('Florida Road'))!;
      expect(resolveAddressCoordinates('Unit 4, Florida Road')).toEqual({
        latitude: target.latitude,
        longitude: target.longitude,
      });
    });

    it('resolves northern suburb keyword match: Umhlanga / La Lucia / Gateway (Branch 3a)', () => {
      expect(resolveAddressCoordinates('Deliver to Gateway Theatre of Shopping, Umhlanga')).toEqual({
        latitude: -29.7267,
        longitude: 31.0856,
      });
    });

    it('resolves western suburb keyword match: Pinetown / Westville / Kloof (Branch 3b)', () => {
      expect(resolveAddressCoordinates('99 Unknown Lane, Westville')).toEqual({
        latitude: -29.8167,
        longitude: 30.8833,
      });
    });

    it('keeps currentCoords when inside greater Durban bounding box and no text rule matched (Branch 4 True)', () => {
      const customInBounds = { latitude: -29.85, longitude: 31.01 };
      expect(resolveAddressCoordinates('Unknown Place', customInBounds)).toEqual(customInBounds);
    });

    it('falls back to Durban Central flagship delivery zone when currentCoords is missing or out of bounds (Branch 4 False -> Branch 5)', () => {
      expect(resolveAddressCoordinates('Unknown Place', null)).toEqual({
        latitude: -29.8389,
        longitude: 31.0145,
      });
      expect(resolveAddressCoordinates('Unknown Place', { latitude: -33.9249, longitude: 18.4241 })).toEqual({
        latitude: -29.8389,
        longitude: 31.0145,
      });
      expect(resolveAddressCoordinates('Unknown Place', { latitude: -29.85, longitude: 32.5 })).toEqual({
        latitude: -29.8389,
        longitude: 31.0145,
      });
    });
  });

  describe('reverseResolveAddress', () => {
    it('finds the closest catalog address and preserves GPS coordinates when inside Durban bounds (inDurbanBounds = true)', () => {
      const res = reverseResolveAddress(-29.828, 31.014);
      expect(res.address).toContain('Florida Road');
      expect(res.label).toBe('Morningside');
      expect(res.latitude).toBe(-29.828);
      expect(res.longitude).toBe(31.014);
    });

    it('snaps coordinates to the closest catalog address when GPS fix is outside Durban bounds (inDurbanBounds = false)', () => {
      const res = reverseResolveAddress(-26.2041, 28.0473);
      expect(res.address).toBeTruthy();
      expect(res.label).toBeTruthy();
      expect(res.latitude).toBeGreaterThanOrEqual(-30.1);
      expect(res.latitude).toBeLessThanOrEqual(-29.5);
    });
  });

  describe('encodePolyline & buildSyntheticRoadGeometry', () => {
    it('encodes and decodes empty, single-point, and multi-point coordinates with positive and negative deltas', () => {
      expect(encodePolyline([])).toBe('');
      expect(decodePolyline('')).toEqual([]);

      const pts = [
        { lat: -29.8587, lng: 31.0218 },
        { lat: -29.8282, lng: 31.0142 },
        { lat: -29.8409, lng: 31.0014 },
      ];
      const encoded = encodePolyline(pts);
      const decoded = decodePolyline(encoded);
      expect(decoded).toHaveLength(3);
      expect(decoded[0].lat).toBeCloseTo(-29.8587, 4);
      expect(decoded[2].lng).toBeCloseTo(31.0014, 4);
    });

    it('builds a 17-point curved road polyline and offsets identical start/end coordinates', () => {
      const normal = decodePolyline(buildSyntheticRoadGeometry(-29.8587, 31.0218, -29.7267, 31.0856));
      expect(normal).toHaveLength(17);
      expect(normal[0].lat).toBeCloseTo(-29.8587, 4);
      expect(normal[16].lat).toBeCloseTo(-29.7267, 4);

      const degenerate = decodePolyline(buildSyntheticRoadGeometry(-29.8587, 31.0218, -29.8587, 31.0218));
      expect(degenerate).toHaveLength(17);
      expect(Math.abs(degenerate[16].lat - degenerate[0].lat)).toBeGreaterThan(0.01);
    });
  });
});
