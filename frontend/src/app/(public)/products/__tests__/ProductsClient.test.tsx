import { render, screen, within, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

/**
 * Regression for the reported "products page crashes when I click on it".
 * The page renders the full catalogue through the client component; these
 * tests pin the loading, stocked, empty and error paths in jsdom.
 */

const mockGetAllProducts = vi.fn()
vi.mock('@/lib/api', () => ({
  api: {
    getAllProducts: (...args: unknown[]) => mockGetAllProducts(...(args as [])),
  },
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (k: string) => (k === 'search' ? null : null) }),
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
  useReducedMotion: () => false,
}))

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProductsClient from '../ProductsClient'
import type { Product } from '@/types'

// jsdom has no ResizeObserver; the category-filter scroll fades use it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = window.ResizeObserver ?? ResizeObserverStub

const renderWithClient = (ui: React.ReactNode) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

const product = (over: Partial<Product>): Product => ({
  id: 1,
  category_id: 1,
  name: 'Fresh Spinach',
  slug: 'fresh-spinach',
  description: null,
  image: null,
  images: null,
  unit: 'bunch',
  price: 24.99,
  sale_price: null,
  tags: null,
  is_featured: false,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProductsClient (products page does not crash)', () => {
  it('renders the catalogue grid for a stocked store', async () => {
    mockGetAllProducts.mockResolvedValue([
      product({ id: 1, name: 'Fresh Spinach' }),
      product({ id: 2, name: 'Full Cream Milk', slug: 'milk' }),
    ])

    renderWithClient(<ProductsClient />)

    expect(await screen.findByText('Fresh Spinach')).toBeTruthy()
    expect(screen.getByText('Full Cream Milk')).toBeTruthy()
    expect(screen.getByRole('tablist', { name: /filter by category/i })).toBeTruthy()
  })

  it('renders the empty state, not a crash, when the database has no products', async () => {
    mockGetAllProducts.mockResolvedValue([])

    renderWithClient(<ProductsClient />)

    expect(await screen.findByText('Nothing matches your search')).toBeTruthy()
  })

  it('renders the error state when the API fails', async () => {
    mockGetAllProducts.mockRejectedValue(new Error('backend down'))

    renderWithClient(<ProductsClient />)

    expect(await screen.findByText("Couldn't load products")).toBeTruthy()
  })

  it('keeps the page mounted with mixed dirty data (nulls everywhere)', async () => {
    mockGetAllProducts.mockResolvedValue([
      product({ id: 3, name: 'Weird Item', unit: null as unknown as string, image: null, tags: null, description: null, sale_price: null }),
    ])

    renderWithClient(<ProductsClient />)

    expect(await screen.findByText('Weird Item')).toBeTruthy()
  })

  it('desktop sidebar filters by category group and moves the active marker', async () => {
    mockGetAllProducts.mockResolvedValue([product({ id: 9, name: 'Bananas', slug: 'bananas' })])

    renderWithClient(<ProductsClient />)
    expect(await screen.findByText('Bananas')).toBeTruthy()

    const nav = screen.getByRole('navigation', { name: /browse categories/i })
    expect(within(nav).getByRole('button', { name: 'All Products' }).getAttribute('aria-current')).toBe('true')

    fireEvent.click(within(nav).getByRole('button', { name: 'Fresh' }))

    await vi.waitFor(() => {
      expect(mockGetAllProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ categories: 'fruits-vegetables,meat-poultry,bakery,dairy-eggs' })
      )
    })
    // The active marker moved to Fresh and the KFC-style section heading updated.
    expect(within(nav).getByRole('button', { name: 'Fresh' }).getAttribute('aria-current')).toBe('true')
    expect(within(nav).getByRole('button', { name: 'All Products' }).getAttribute('aria-current')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: /fresh/i })).toBeTruthy()
  })
})
