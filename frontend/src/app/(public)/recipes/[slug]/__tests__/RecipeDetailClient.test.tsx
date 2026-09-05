import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'sugar-toast' }),
  useRouter: () => ({ push }),
}))

const mockRecipe = {
  id: 1,
  title: 'Sugar Toast',
  slug: 'sugar-toast',
  description: 'Sweet breakfast.',
  // Some seed data ships as a JSON string — the client must parse it.
  ingredients: JSON.stringify(['1 tsp sugar', '500 ml buttermilk', 'a pinch of salt']),
  method: 'Mix.\nToast.',
  image: null,
  category: 'Breakfast',
  prep_time: 5,
  cook_time: 10,
  servings: 2,
}

vi.mock('@/lib/query', () => ({
  useRecipe: () => ({ data: mockRecipe, isLoading: false, error: null }),
  useAllProducts: () => ({
    data: [
      { id: 1, name: 'Sugar', slug: 'sugar', image: '/products/sugar.jpg', price: 10, sale_price: null },
      { id: 2, name: 'Milk', slug: 'milk', image: null, price: 12, sale_price: null },
      { id: 3, name: 'Buttermilk', slug: 'buttermilk', image: null, price: 15, sale_price: null },
      { id: 4, name: 'Whiskas Lamb In Gravy Cat Food 85g', slug: 'whiskas', image: '/products/cat.jpg', price: 40, sale_price: null, category: { id: 9, name: 'Pet', slug: 'pet-supplies', description: null, image: null, icon: null, sort_order: 9 } },
    ],
  }),
}))

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import RecipeDetailClient from '../RecipeDetailClient'

describe('RecipeDetailClient ingredient→product linking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders each ingredient with an inline product pill linking to the product page', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    const pill = screen.getByRole('link', { name: /view sugar product page/i })
    expect(pill).toHaveAttribute('href', '/products/sugar')
    // The pill sits next to the ingredient text, in the same row.
    expect(screen.getByText('1 tsp sugar')).toBeTruthy()
  })

  it('does not let short product names hijack ingredients (Milk vs Buttermilk)', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.getByRole('link', { name: /view buttermilk product page/i })).toHaveAttribute('href', '/products/buttermilk')
    expect(screen.queryByRole('link', { name: /view milk product page/i })).toBeNull()
  })

  it('renders the product thumbnail inside the pill (the reported missing thumbnails)', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    const pill = screen.getByRole('link', { name: /view sugar product page/i })
    const img = pill.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.getAttribute('src')).toContain('sugar.jpg')
  })

  it('never links pet food into a food recipe', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.queryByRole('link', { name: /whiskas/i })).toBeNull()
  })

  it('renders unmatched ingredients without a product pill', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.getByText('a pinch of salt')).toBeTruthy()
    const saltPills = screen.queryByRole('link', { name: /salt/i })
    expect(saltPills).toBeNull()
  })

  it('keeps the checkbox toggle and product link as siblings, not nested', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    const checkbox = screen.getByRole('button', { name: /mark 1 tsp sugar as bought/i })
    const pill = screen.getByRole('link', { name: /view sugar product page/i })
    // Both interactive elements exist independently (the Link is not inside
    // the button — invalid HTML that broke click handling and a11y).
    expect(checkbox).toBeTruthy()
    expect(pill.closest('button')).toBeNull()

    fireEvent.click(checkbox)
    expect(screen.getByRole('button', { name: /mark 1 tsp sugar as not bought/i })).toBeTruthy()
  })
})
