import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { api, ApiError, apiErrorReason } from '@/lib/api'

/**
 * Contract tests for the frontend API client (integration level, V-model):
 * every request must go out with credentials, the right method/URL/body,
 * and the XSRF header on writes; error envelopes must surface as ApiError
 * with the backend's `reason` intact (the UI keys off it).
 */
const jsonResponse = (payload: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => payload,
})

describe('api client contract', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', { value: 'XSRF-TOKEN=tok-123', configurable: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends credentials and JSON body on placeOrder', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ order: {}, store: null }))
    vi.stubGlobal('fetch', fetchMock)

    await api.placeOrder({
      items: [{ product_id: 1, quantity: 2 }],
      delivery_latitude: -29.85,
      delivery_longitude: 31.02,
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/orders')
    expect(init.method).toBe('POST')
    expect(init.credentials).toBe('include')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.headers['X-XSRF-TOKEN']).toBe('tok-123')
    expect(JSON.parse(init.body).items).toEqual([{ product_id: 1, quantity: 2 }])
  })

  it('does not attach a CSRF token on GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await api.getOrders()

    const [, init] = fetchMock.mock.calls[0]
    // The client never forces a method on reads — fetch's GET default applies.
    expect(init.method).toBeUndefined()
    expect(init.headers['X-XSRF-TOKEN']).toBeUndefined()
    expect(init.credentials).toBe('include')
  })

  it('rewrites the CSRF cookie endpoint off the /api prefix', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(undefined))
    vi.stubGlobal('fetch', fetchMock)

    await api.getCsrfCookie()

    expect(fetchMock.mock.calls[0][0]).toBe('/sanctum/csrf-cookie')
  })

  it('surfaces backend error envelopes as ApiError with reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(
      { message: 'This order can no longer be cancelled', reason: 'order_not_cancellable' },
      false,
      409,
    )))

    const error = await api.cancelOrder(7).then(
      () => null,
      (e: unknown) => e,
    )

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect(apiErrorReason(error)).toBe('order_not_cancellable')
  })

  it('falls back to status text when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => { throw new Error('not json') },
    }))

    const error = await api.getOrder(1).then(
      () => null,
      (e: unknown) => e,
    )

    expect((error as ApiError).message).toBe('Request failed: 502')
    expect(apiErrorReason(error)).toBeNull()
  })

  it('returns undefined for 204 responses (unfavourite)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))

    await expect(api.deleteBanner(3)).resolves.toBeUndefined()
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe('/api/admin/banners/3')
  })

  it('syncCart posts items and returns dropped items', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [], dropped: [{ product_id: 5, reason: 'unavailable' }] }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await api.syncCart([{ product_id: 5, quantity: 1 }])

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ items: [{ product_id: 5, quantity: 1 }] })
    expect(result.dropped).toEqual([{ product_id: 5, reason: 'unavailable' }])
  })

  it('formats query strings for order and event feeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await api.getOrders({ status: 'pending' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/orders?status=pending')

    await api.getOperationsEvents({ cursor: '2026-01-01T00:00:00Z' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/operations/events?cursor=2026-01-01T00%3A00%3A00Z')
  })
})
