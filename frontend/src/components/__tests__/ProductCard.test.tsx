import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
  useReducedMotion: () => false,
}))

const addItem = vi.fn()

vi.mock('@/stores/cart-store', () => ({
  useCartStore: (selector: (s: { addItem: () => void }) => unknown) =>
    selector({ addItem }),
}))

vi.mock('@/components/FavoriteHeart', () => ({
  default: () => null,
}))

vi.mock('@/lib/query', () => ({
  useAddFavorite: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveFavorite: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: any) => {
    const state = { isAuthenticated: false, user: null }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/lib/api', () => ({
  api: { checkFavorite: vi.fn() },
}))

import ProductCard from '../ProductCard'
import { onCartAdded } from '@/lib/cart-events'
import type { Product } from '@/types'

const product = (over: Partial<Product> = {}): Product => ({
  id: 1,
  category_id: 1,
  name: 'Fresh Spinach',
  slug: 'fresh-spinach',
  description: null,
  image: null,
  images: null,
  unit: 'bunch',
  price: 39.99,
  sale_price: null,
  tags: null,
  is_featured: false,
  ...over,
})

describe('ProductCard', () => {
  it('styles the Special badge in black with a lighter weight (user request)', () => {
    render(<ProductCard product={product({ sale_price: 29.99, effective_price: 29.99 })} />)

    const badge = screen.getByText('Special')
    expect(badge.className).toContain('bg-gray-900')
    expect(badge.className).toContain('font-medium')
    expect(badge.className).not.toContain('bg-accent')
    expect(badge.className).not.toContain('font-semibold')
  })

  it('hides the badge for non-sale products', () => {
    render(<ProductCard product={product()} />)
    expect(screen.queryByText('Special')).toBeNull()
  })

  it('announces the special in the text sections too — Save pill with the rand amount', () => {
    render(<ProductCard product={product({ sale_price: 29.99, effective_price: 29.99 })} />)
    expect(screen.getByText('Save R 10.00')).toBeTruthy()
  })

  it('omits the Save pill for non-sale products', () => {
    render(<ProductCard product={product()} />)
    expect(screen.queryByText(/^Save R/)).toBeNull()
  })

  it('renders a plain <img> for absolute media URLs so an unconfigured image host can never crash the page', () => {
    const { container } = render(
      <ProductCard product={product({ image: 'http://192.168.99.99:8000/products/beverages/x.jpg' })} />,
    )
    // next/image would THROW for this host; SafeImage must fall back to <img>.
    expect(container.querySelector('img')).toBeTruthy()
  })

  it('shows the branded placeholder for missing images, never developer copy', () => {
    // SafeImage owns the failure path for every other image surface in the app
    // (MEDIA_FALLBACK_PATH). A card that prints "No image" is the one place a
    // customer would read our internals — and the one place the placeholder was
    // not used. Same degraded image everywhere = one visual language.
    const { container } = render(<ProductCard product={product({ image: null })} />)

    expect(screen.queryByText('No image')).toBeNull()
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    const src = decodeURIComponent(img!.getAttribute('src') ?? '') + decodeURIComponent(img!.getAttribute('srcset') ?? '')
    expect(src).toContain('product-placeholder.webp')
    // Alt text stays the product name: a screen reader announces the product,
    // not the fact that our catalogue has a hole in it.
    expect(img!.getAttribute('alt')).toBe('Fresh Spinach')
  })

  it('links the card to the product detail page', () => {
    render(<ProductCard product={product()} />)
    const links = screen.getAllByRole('link')
    expect(links.every((l) => l.getAttribute('href') === '/products/fresh-spinach')).toBe(true)
  })
  it('names the add-to-cart button with the product it adds (screen readers hear 541 unnamed buttons otherwise)', () => {
    render(<ProductCard product={product()} />)
    const btn = screen.getByRole('button', { name: 'Add Fresh Spinach to cart' })
    expect(btn).toBeTruthy()
  })

  it('gives the add-to-cart button a 40px hit target (was 27px, below the 24px WCAG floor comfort)', () => {
    render(<ProductCard product={product()} />)
    const btn = screen.getByRole('button', { name: 'Add Fresh Spinach to cart' })
    expect(btn.className).toContain('w-10')
    expect(btn.className).toContain('h-10')
  })

  it('announces the add on the cart bus so the layout toast can confirm it', () => {
    let announced: { name: string; quantity: number } | null = null
    const off = onCartAdded((e) => { announced = e })
    render(<ProductCard product={product()} />)
    screen.getByRole('button', { name: 'Add Fresh Spinach to cart' }).click()
    expect(addItem).toHaveBeenCalledWith(product())
    expect(announced).toEqual({ name: 'Fresh Spinach', quantity: 1, at: expect.any(Number) })
    off()
  })

  it('keeps the pack-size caption on the muted-but-legible gray-500 token (gray-400 failed AA at 12px)', () => {
    render(<ProductCard product={product()} />)
    const unit = screen.getByText('bunch')
    expect(unit.className).toContain('text-gray-500')
    expect(unit.className).not.toContain('text-gray-400')
  })
})
