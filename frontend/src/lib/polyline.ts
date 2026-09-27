/**
 * Google Encoded Polyline decoder — same as mobile.
 * Decodes a polyline string into [{lat, lng}] for Leaflet.
 */
export interface LatLng {
  lat: number
  lng: number
}

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let b: number
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1

    points.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }

  return points
}

/**
 * Coerce a wire coordinate to a finite number, or null when it is absent or
 * unusable. Laravel sends `decimal:7` values as strings; null/"" mean "we have
 * no position" and must never become 0.
 */
function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

export function computeBounds(points: LatLng[]): [[number, number], [number, number]] | null {
  // Coordinates reach here straight from the API, where Laravel's `decimal:7`
  // casts serialise them as strings ("-29.8350000"). Compare as numbers, or the
  // bounds come back lexicographic (and mixed-sign values sort wrongly).
  // Absent values are dropped rather than coerced: Number(null) is 0, which
  // would silently centre the map on 0,0 in the Gulf of Guinea.
  const numeric = (points ?? [])
    .map((p) => ({ lat: toFiniteNumber(p?.lat), lng: toFiniteNumber(p?.lng) }))
    .filter((p): p is { lat: number; lng: number } => p.lat != null && p.lng != null)
  if (numeric.length === 0) return null
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const p of numeric) {
    if (p.lat < minLat) minLat = p.lat
    if (p.lat > maxLat) maxLat = p.lat
    if (p.lng < minLng) minLng = p.lng
    if (p.lng > maxLng) maxLng = p.lng
  }
  return [[minLat, minLng], [maxLat, maxLng]]
}
