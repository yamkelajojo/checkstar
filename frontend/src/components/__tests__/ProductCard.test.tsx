import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
}))

vi.mock('@/stores/cart-store', () => ({
  useCartStore: (selector: (s: { addItem: () => void }) => unknown) =>
    selector({ addItem: () => {} }),
}))

import ProductCard from '../ProductCard'
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

  it('renders a plain <img> for absolute media URLs so an unconfigured image host can never crash the page', () => {
    const { container } = render(
      <ProductCard product={product({ image: 'http://192.168.99.99:8000/products/beverages/x.jpg' })} />,
    )
    // next/image would THROW for this host; SafeImage must fall back to <img>.
    expect(container.querySelector('img')).toBeTruthy()
  })

  it('shows the placeholder for missing images', () => {
    render(<ProductCard product={product({ image: null })} />)
    expect(screen.getByText('No image')).toBeTruthy()
  })

  it('links the card to the product detail page', () => {
    render(<ProductCard product={product()} />)
    const links = screen.getAllByRole('link')
    expect(links.every((l) => l.getAttribute('href') === '/products/fresh-spinach')).toBe(true)
  })
})
