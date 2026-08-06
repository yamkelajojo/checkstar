import { describe, it, expect, vi, afterEach } from 'vitest'
import { api } from '@/lib/api'
import type { Product } from '@/types'

const mockProduct = (id: number): Product => ({
  id,
  category_id: 1,
  name: `Product ${id}`,
  slug: `product-${id}`,
  description: null,
  image: null,
  images: null,
  unit: 'each',
  price: 10,
  sale_price: null,
  tags: null,
  is_featured: false,
})

const jsonResponse = (payload: unknown) => ({
  ok: true,
  status: 200,
  json: async () => payload,
})

const paginated = (page: number, items: Product[], total: number) => ({
  current_page: page,
  data: items,
  per_page: 2,
  total,
  last_page: Math.ceil(total / 2),
})

describe('api.getAllProducts', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches every page of the catalog and returns all products', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(paginated(1, [mockProduct(1), mockProduct(2)], 5)))
      .mockResolvedValueOnce(jsonResponse(paginated(2, [mockProduct(3), mockProduct(4)], 5)))
      .mockResolvedValueOnce(jsonResponse(paginated(3, [mockProduct(5)], 5)))
    vi.stubGlobal('fetch', fetchMock)

    const products = await api.getAllProducts()

    expect(products).toHaveLength(5)
    expect(products.map(p => p.id)).toEqual([1, 2, 3, 4, 5])
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(String(fetchMock.mock.calls[0][0])).toContain('per_page=100')
    expect(String(fetchMock.mock.calls[0][0])).toContain('page=1')
    expect(String(fetchMock.mock.calls[2][0])).toContain('page=3')
  })

  it('does not make extra requests when the catalog fits on one page', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(paginated(1, [mockProduct(1)], 1)))
    vi.stubGlobal('fetch', fetchMock)

    const products = await api.getAllProducts()

    expect(products).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
