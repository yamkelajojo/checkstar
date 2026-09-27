/**
 * Google Encoded Polyline decoder.
 *
 * Decodes a Google-encoded polyline string into an array of { lat, lng } coordinates.
 * Used by the routing API (OSRM, Google Directions, Mapbox, etc.) to return a
 * compact geometry string that can be drawn as a polyline on a map.
 *
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export interface LatLng {
  lat: number;
  lng: number;
}

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Compute the bounding region for an array of coordinates.
 * Returns a `{ latitude, longitude, latitudeDelta, longitudeDelta }` object
 * suitable for `MapView.fitToCoordinates()`.
 */
/**
 * Coerce a wire coordinate to a finite number, or null when it is absent or
 * unusable. The API sends `decimal:7` coordinates as strings; null/"" mean
 * "no position" and must never become 0.
 */
function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function computeBoundingRegion(
  points: LatLng[],
  paddingFactor = 1.3,
): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } {
  // Coordinates reach here straight off the API, where Laravel's `decimal:7`
  // cast serialises them as strings ("-29.8350000") even though LatLng is typed
  // numeric. Coerce first: string + string concatenates instead of adding, so
  // the midpoint below would otherwise be NaN, and a native MapView handed a
  // non-numeric region renders nothing at all.
  // Absent values are dropped, not coerced: Number(null) is 0, which would put
  // a marker at 0,0 in the Gulf of Guinea and stretch the region to fit it.
  const numeric = (points ?? [])
    .map((p) => ({ lat: toFiniteNumber(p?.lat), lng: toFiniteNumber(p?.lng) }))
    .filter((p): p is { lat: number; lng: number } => p.lat != null && p.lng != null);

  if (numeric.length === 0) {
    return { latitude: -29.8587, longitude: 31.0218, latitudeDelta: 0.1, longitudeDelta: 0.1 };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of numeric) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const latDelta = (maxLat - minLat) * paddingFactor || 0.01;
  const lngDelta = (maxLng - minLng) * paddingFactor || 0.01;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latDelta, 0.005),
    longitudeDelta: Math.max(lngDelta, 0.005),
  };
}
