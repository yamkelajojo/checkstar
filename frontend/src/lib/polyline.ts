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

function encodeSignedNumber(num: number): string {
  let sgnNum = num << 1
  if (num < 0) sgnNum = ~sgnNum
  let encoded = ''
  while (sgnNum >= 0x20) {
    encoded += String.fromCharCode((0x20 | (sgnNum & 0x1f)) + 63)
    sgnNum >>= 5
  }
  encoded += String.fromCharCode(sgnNum + 63)
  return encoded
}

export function encodePolyline(points: LatLng[]): string {
  let lastLat = 0
  let lastLng = 0
  let result = ''
  for (const point of points) {
    const lat = Math.round(point.lat * 1e5)
    const lng = Math.round(point.lng * 1e5)
    result += encodeSignedNumber(lat - lastLat)
    result += encodeSignedNumber(lng - lastLng)
    lastLat = lat
    lastLng = lng
  }
  return result
}

export function buildSyntheticRoadGeometry(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): string {
  let targetLat = toLat
  let targetLng = toLng
  if (Math.abs(targetLat - fromLat) < 0.0008 && Math.abs(targetLng - fromLng) < 0.0008) {
    targetLat = fromLat + 0.0165
    targetLng = fromLng - 0.0095
  }
  const dLat = targetLat - fromLat
  const dLng = targetLng - fromLng
  const steps = 16
  const pts: LatLng[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const curve = Math.sin(t * Math.PI) * 0.14 + Math.sin(t * Math.PI * 2) * 0.04
    pts.push({
      lat: fromLat + dLat * t - dLng * curve,
      lng: fromLng + dLng * t + dLat * curve,
    })
  }
  return encodePolyline(pts)
}

