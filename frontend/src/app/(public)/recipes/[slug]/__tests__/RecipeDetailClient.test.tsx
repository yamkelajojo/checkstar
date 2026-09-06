import { render, screen } from '@testing-library/react'
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

  it('lists ingredients as plain text with the product pill — no tick boxes', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.getByText('1 tsp sugar')).toBeTruthy()
    const pill = screen.getByRole('link', { name: /view sugar product page/i })
    // The ingredient is not wrapped in any control — checkboxes were
    // removed from the recipe page by design.
    expect(pill.closest('button')).toBeNull()
    expect(screen.queryByRole('button', { name: /bought/i })).toBeNull()
  })
})
