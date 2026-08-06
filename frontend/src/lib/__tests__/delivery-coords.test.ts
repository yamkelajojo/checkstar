import { describe, it, expect, vi, afterEach } from 'vitest'
import { getDeliveryCoords, DURBAN_COORDS } from '@/lib/delivery-coords'

describe('getDeliveryCoords', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves with the device position when geolocation is available', async () => {
    const position = { coords: { latitude: -30.5, longitude: 30.5 } }
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: (cb: any) => cb(position) } })

    const coords = await getDeliveryCoords()

    expect(coords).toEqual({ latitude: -30.5, longitude: 30.5, usedFallback: false })
  })

  it('falls back to Durban central when geolocation errors', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: (_: any, errCb: any) => errCb(new Error('denied')) } })

    const coords = await getDeliveryCoords()

    expect(coords).toEqual({ ...DURBAN_COORDS, usedFallback: true })
  })

  it('falls back to Durban central when geolocation is unavailable', async () => {
    vi.stubGlobal('navigator', { ...navigator, geolocation: undefined })

    const coords = await getDeliveryCoords()

    expect(coords).toEqual({ ...DURBAN_COORDS, usedFallback: true })
  })
})
