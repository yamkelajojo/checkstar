import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Public sale landing (/specials/{slug}) — the canonical destination for a
 * sale's banner CTA. Live, ended and missing states.
 */

const { apiMocks } = vi.hoisted(() => ({
  apiMocks: { getSaleBySlug: vi.fn() },
}))

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, public readonly status: number, public readonly payload?: unknown) {
      super(message)
    }
  },
  api: apiMocks,
}))

const addItem = vi.fn()
vi.mock('@/stores/cart-store', () => ({
  useCartStore: (selector: (s: { addItem: () => void }) => unknown) => selector({ addItem }),
}))
vi.mock('@/components/FavoriteHeart', () => ({ default: () => null }))

// Same motion mock the ProductCard tests use: motion.div → plain div, which
// sidesteps IntersectionObserver (whileInView) — absent from jsdom.
vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
  useReducedMotion: () => false,
}))

import SaleDetailClient from '../SaleDetailClient'

const STORE = { id: 1, name: 'Durban Central', slug: 'durban-central' }

const PRODUCT = (over: Record<string, unknown> = {}) => ({
  id: 10,
  category_id: 1,
  name: 'Spring Mix',
  slug: 'spring-mix',
  description: null,
  image: null,
  images: null,
  unit: '500g',
  price: 45,
  sale_price: null,
  effective_price: 39.99,
  special_price: 39.99,
  tags: null,
  is_featured: false,
  stores: [{ store_product_id: 1, id: 1, name: 'Durban Central', slug: 'durban-central', stock_quantity: 40, available_quantity: 40, is_available: true }],
  ...over,
})

const SALE = {
  id: 1,
  title: 'Spring Freshness',
  slug: 'spring-freshness',
  description: 'A fresh pick of the season at special prices.',
  banner_image: null,
  start_date: '2026-09-01T00:00:00Z',
  end_date: '2026-09-30T23:59:59Z',
  is_active: true,
  store_id: 1,
  store: STORE,
  banner: null,
  in_window: true,
  products: [PRODUCT(), { ...PRODUCT(), id: 11, name: 'Wild Honey', slug: 'wild-honey' }],
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  apiMocks.getSaleBySlug.mockResolvedValue({ data: SALE })
})

describe('SaleDetailClient', () => {
  it('renders a live sale with its products at sale prices', async () => {
    renderWithProviders(<SaleDetailClient slug="spring-freshness" />)

    expect(await screen.findByText('Spring Freshness')).toBeInTheDocument()
    expect(screen.getByText('Live now')).toBeInTheDocument()
    expect(screen.getByText('A fresh pick of the season at special prices.')).toBeInTheDocument()
    expect(screen.getByText('Durban Central')).toBeInTheDocument()

    // Both products, at the special price with the struck-through base price
    expect(screen.getByText('Spring Mix')).toBeInTheDocument()
    expect(screen.getByText('Wild Honey')).toBeInTheDocument()
    expect(screen.getAllByText('R 39.99').length).toBe(2)
    expect(screen.getAllByText('R 45.00').length).toBe(2)
    // Special badge + save pill
    expect(screen.getAllByText('Special').length).toBe(2)
    expect(screen.getAllByText('Save R 5.01').length).toBe(2)
    // Add-to-cart buttons are named per product
    expect(screen.getByRole('button', { name: 'Add Spring Mix to cart' })).toBeInTheDocument()
  })

  it('marks an ended sale and keeps the products browsable at current prices', async () => {
    apiMocks.getSaleBySlug.mockResolvedValue({
      data: {
        ...SALE,
        start_date: '2026-08-01T00:00:00Z',
        end_date: '2026-08-31T23:59:59Z',
        in_window: false,
        products: [{ ...PRODUCT(), effective_price: 45, special_price: null }],
      },
    })
    renderWithProviders(<SaleDetailClient slug="spring-freshness" />)

    expect(await screen.findByText('Spring Freshness')).toBeInTheDocument()
    expect(screen.getByText('Ended')).toBeInTheDocument()
    expect(screen.getByText(/This sale ended on/)).toBeInTheDocument()
    // No sale badge once the special price equals the base price
    expect(screen.queryByText('Special')).toBeNull()
  })

  it('announces an upcoming sale', async () => {
    apiMocks.getSaleBySlug.mockResolvedValue({
      data: {
        ...SALE,
        start_date: '2026-10-01T00:00:00Z',
        end_date: '2026-10-07T23:59:59Z',
        in_window: false,
      },
    })
    renderWithProviders(<SaleDetailClient slug="spring-freshness" />)

    expect(await screen.findByText('Spring Freshness')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText(/This sale starts on/)).toBeInTheDocument()
  })

  it('shows a friendly state for a missing sale with a way back to all specials', async () => {
    apiMocks.getSaleBySlug.mockRejectedValue(new Error('404'))
    renderWithProviders(<SaleDetailClient slug="ghost-sale" />)

    // Straight apostrophe: 13 of the app's 16 contractions use `&apos;`, and the
    // shared EmptyState renders the title string as written.
    expect(await screen.findByText("This sale isn't available")).toBeInTheDocument()
    const back = screen.getByRole('link', { name: /All specials/ })
    expect(back).toHaveAttribute('href', '/specials')
  })

  it('handles a sale with no products yet', async () => {
    apiMocks.getSaleBySlug.mockResolvedValue({ data: { ...SALE, products: [] } })
    renderWithProviders(<SaleDetailClient slug="spring-freshness" />)

    expect(await screen.findByText('No products in this sale yet')).toBeInTheDocument()
  })
})
