import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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

const addItem = vi.fn()
vi.mock('@/stores/cart-store', () => ({
  useCartStore: (selector: (s: { addItem: () => void }) => unknown) =>
    selector({ addItem }),
}))

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: (_t, tag) => tag }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}))

import RecipeDetailClient from '../RecipeDetailClient'

describe('RecipeDetailClient ingredient→product popover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('matches ingredients to product pills (trigger buttons, not links)', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    const trigger = screen.getByRole('button', { name: /about sugar/i })
    expect(trigger).toBeTruthy()
    expect(screen.getByText('1 tsp sugar')).toBeTruthy()
    // Pills no longer navigate on click — they open a popover.
    expect(screen.queryByRole('link', { name: /about sugar/i })).toBeNull()
  })

  it('does not let short product names hijack ingredients (Milk vs Buttermilk)', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.getByRole('button', { name: /about buttermilk/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /about milk/i })).toBeNull()
  })

  it('renders the product thumbnail inside the pill (the reported missing thumbnails)', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    const pill = screen.getByRole('button', { name: /about sugar/i })
    const img = pill.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.getAttribute('src')).toContain('sugar.jpg')
  })

  it('never matches pet food into a food recipe', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.queryByRole('button', { name: /whiskas/i })).toBeNull()
  })

  it('opens a popover with the product details and a small add-to-cart', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    fireEvent.click(screen.getByRole('button', { name: /about sugar/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain('Sugar')
    expect(dialog.textContent).toContain('10.00')
    const add = within(dialog).getByRole('button', { name: /add sugar to cart/i })
    expect(add).toBeTruthy()
    // The popover offers the full product page as an explicit choice.
    expect(within(dialog).getByRole('link', { name: /view sugar product page/i })).toHaveAttribute('href', '/products/sugar')
  })

  it('adds the matched product to the cart from the popover without navigating', async () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    fireEvent.click(screen.getByRole('button', { name: /about sugar/i }))
    fireEvent.click(screen.getByRole('button', { name: /add sugar to cart/i }))

    expect(addItem).toHaveBeenCalledTimes(1)
    expect(addItem.mock.calls[0][0].slug).toBe('sugar')
    // No navigation — the shopper stays on the recipe.
    expect(push).not.toHaveBeenCalled()
    // The popover confirms and closes itself.
    expect(await screen.findByText('Added')).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull(), { timeout: 2000 })
  })

  it('renders unmatched ingredients without a product pill', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.getByText('a pinch of salt')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /about salt/i })).toBeNull()
  })

  it('lists ingredients as plain text with the pill — no tick boxes', () => {
    render(<RecipeDetailClient slug="sugar-toast" />)

    expect(screen.getByText('1 tsp sugar')).toBeTruthy()
    // Checkboxes were removed from the recipe page by design.
    expect(screen.queryByRole('button', { name: /bought/i })).toBeNull()
  })
})
