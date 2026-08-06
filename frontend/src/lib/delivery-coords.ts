export const DURBAN_COORDS = { latitude: -29.8587, longitude: 31.0218 }

export interface DeliveryCoords {
  latitude: number
  longitude: number
  usedFallback: boolean
}

export function getDeliveryCoords(): Promise<DeliveryCoords> {
  return new Promise(resolve => {
    const fallback = () => resolve({ ...DURBAN_COORDS, usedFallback: true })

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      fallback()
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, usedFallback: false }),
      fallback,
      { timeout: 5000, maximumAge: 60000 }
    )
  })
}
