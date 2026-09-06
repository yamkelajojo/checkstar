import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Product } from '@/types'

/**
 * Product page related items + scroll-morphing add-to-cart:
 * - The related shelf renders under the product info.
 * - While the shelf is in view, the inline CTA morphs into a fixed
 *   bottom-right button; back at the product info it morphs back.
 */

let intersectionCallback: ((entries: Array<{ isIntersecting: boolean }>) => void) | null = null

class MockIntersectionObserver {
  constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
    intersectionCallback = cb
  }
  observe = vi.fn()
  disconnect = vi.fn()
  unobserve = vi.fn()
  takeRecords = () => []
  root = null
  rootMargin = ''
  thresholds = []
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as unknown as typeof IntersectionObserver)

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    status: number
    constructor(message: string, status: number) {
      super(message)
      this.status = status
    }
  },
  api: {
    getProduct: vi.fn(),
    getRelatedProducts: vi.fn(),
  },
}))

vi.mock('@/lib/query', () => ({
  useProduct: (slug: string) => mockUseProduct(slug),
  useRelatedProducts: (slug: string) => mockUseRelated(slug),
}))

vi.mock('motion/react', async () => {
  const React = await Promise.resolve(import('react'))
  return {
    motion: new Proxy({}, { get: (_t, tag) => tag }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
    useSpring: (v: number) => ({ set: () => {}, on: () => () => {}, get: () => v, stop: () => {} }),
    useTransform: (mv: { get: () => number }, fn: (v: number) => string) => fn(mv.get()),
  }
})

const mockUseProduct = vi.fn()
const mockUseRelated = vi.fn()

import ProductDetailClient from '../ProductDetailClient'

const product = (over: Partial<Product> = {}): Product => ({
  id: 1,
  category_id: 3,
  name: 'Full Cream Milk 1L',
  slug: 'full-cream-milk',
  description: 'Farm fresh full cream milk.',
  image: null,
  images: null,
  unit: '1l',
  price: 24.99,
  sale_price: null,
  tags: ['fresh'],
  is_featured: false,
  ...over,
})

function renderDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductDetailClient slug="full-cream-milk" />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as unknown as typeof IntersectionObserver)
  intersectionCallback = null
  mockUseProduct.mockReturnValue({ data: product(), isLoading: false, error: null })
  mockUseRelated.mockReturnValue({
    data: [
      product({ id: 2, name: 'Double Cream Yogurt 1kg', slug: 'yogurt', price: 39.99 }),
      product({ id: 3, name: 'Cheddar Block 500g', slug: 'cheddar', price: 74.99 }),
    ],
    isLoading: false,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ProductDetailClient related shelf', () => {
  it('renders related items under the product info with links', async () => {
    renderDetail()

    expect(screen.getByRole('region', { name: /related products/i })).toBeTruthy()
    expect(await screen.findByText('Double Cream Yogurt 1kg')).toBeTruthy()
    expect(screen.getByText('Cheddar Block 500g')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Double Cream Yogurt/i })).toHaveAttribute('href', '/products/yogurt')
    expect(screen.getByRole('link', { name: /Cheddar Block/i })).toHaveAttribute('href', '/products/cheddar')
  })

  it('keeps the cart action on the current product', async () => {
    renderDetail()
    // The heading confirms the section is about suggestions, the price next
    // to the CTA must stay the current product's price.
    expect(screen.getAllByText('R24.99').length).toBeGreaterThan(0)
    expect(screen.queryByText('R39.99 /')).toBeNull()
  })
})

describe('ProductDetailClient scroll-morphing add-to-cart', () => {
  it('shows the inline CTA at the top and morphs it into a fixed bottom-right button while the shelf is in view', async () => {
    renderDetail()

    // At the top: inline button, no fixed one.
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /add full cream milk 1l to cart/i })).toBeNull()

    // Shelf scrolls into view → inline disappears, fixed pill appears with price.
    await act(async () => {
      intersectionCallback?.([{ isIntersecting: true }])
    })
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /^add to cart$/i })).toBeNull()
    })
    const floating = screen.getByRole('button', { name: /add full cream milk 1l to cart/i })
    expect(floating.className).toContain('fixed')
    expect(floating.className).toContain('bottom-6')
    expect(floating.className).toContain('right-6')
    expect(floating.textContent).toContain('R24.99')

    // Back at the product info → inline returns, floating disappears.
    await act(async () => {
      intersectionCallback?.([{ isIntersecting: false }])
    })
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^add to cart$/i })).toBeTruthy()
    })
    expect(screen.queryByRole('button', { name: /add full cream milk 1l to cart/i })).toBeNull()
  })
})
