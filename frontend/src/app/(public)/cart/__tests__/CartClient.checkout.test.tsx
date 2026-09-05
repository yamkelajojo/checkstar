import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { ApiError } from '@/lib/api'
import type { Product } from '@/types'

/**
 * Cart checkout gate + mobile row layout regressions.
 * - Guests get an animated sign-in modal instead of the old amber banner.
 * - The item row must keep the name readable on phones (the old 5-column row
 *   squeezed it to one character per line — see user screenshot).
 */

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('motion/react', async () => {
  const React = await Promise.resolve(import('react'))
  return {
    motion: new Proxy({}, { get: (_t, tag) => tag }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  }
})

const mutateAsync = vi.fn()
vi.mock('@/lib/query', () => ({
  usePlaceOrder: () => ({ mutateAsync, isPending: false }),
}))

vi.mock('@/lib/delivery-coords', () => ({
  getDeliveryCoords: vi.fn().mockResolvedValue({ latitude: -29.85, longitude: 31.02, usedFallback: false }),
}))

const authState = vi.hoisted(() => ({ authenticated: false }))
vi.mock('@/stores/auth-store', async () => {
  const { create: createSpy } = await Promise.resolve(import('zustand'))
  return {
    useAuthStore: Object.assign(
      createSpy(() => ({
        // Getters so the selector always reads the CURRENT flag, not a
        // snapshot taken when the store was created.
        get user() {
          return authState.authenticated ? { id: 1, name: 'Test' } : null
        },
        get isAuthenticated() {
          return authState.authenticated
        },
        logout: vi.fn(),
      })),
      { getState: () => ({ isAuthenticated: authState.authenticated }) },
    ),
  }
})

import CartClient from '../CartClient'
import { useCartStore } from '@/stores/cart-store'

const product = (over: Partial<Product>): Product => ({
  id: 1,
  category_id: 1,
  name: 'Baby Spinach 500g',
  slug: 'baby-spinach',
  description: null,
  image: null,
  images: null,
  unit: '500g',
  price: 39.99,
  sale_price: null,
  tags: null,
  is_featured: false,
  ...over,
})

const seedCart = (over: Partial<Product> = {}) =>
  useCartStore.setState({
    items: [{ product: product(over), quantity: 2 }],
    total: 79.98,
    itemCount: 2,
  } as never)

beforeEach(() => {
  vi.clearAllMocks()
  authState.authenticated = false
  document.body.style.overflow = ''
  seedCart()
})

describe('CartClient guest checkout gate', () => {
  it('opens the sign-in modal when a guest proceeds to checkout', async () => {
    render(<CartClient />)

    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }))

    expect(await screen.findByText('Sign in to check out')).toBeTruthy()
    expect(screen.getByText(/browsing as a guest/i)).toBeTruthy()
    // App download mention (user request)
    expect(screen.getByText(/get the checkstar app/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'App Store' })).toHaveAttribute('href', 'https://apps.apple.com/app/checkstar')
    expect(screen.getByRole('link', { name: 'Google Play' })).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=com.checkstar')
    // Sign-in link returns to the cart afterwards
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/auth/login?redirect=%2Fcart')
  })

  it('does not show the modal for authenticated users — straight to the checkout form', async () => {
    authState.authenticated = true
    render(<CartClient />)

    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }))

    expect(await screen.findByLabelText(/delivery address/i)).toBeTruthy()
    expect(screen.queryByText('Sign in to check out')).toBeNull()
  })

  it('opens the modal (not the old amber banner) when placing the order returns 401', async () => {
    authState.authenticated = true
    mutateAsync.mockRejectedValue(new ApiError('Unauthenticated.', 401, null))

    render(<CartClient />)
    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }))
    const address = await screen.findByLabelText(/delivery address/i)
    fireEvent.change(address, { target: { value: '12 Umgeni Rd, Durban' } })
    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => expect(screen.findByText('Sign in to check out')).toBeTruthy())
    expect(screen.queryByText(/session has expired/i)).toBeNull()
  })

  it('closes the modal from the close button', async () => {
    render(<CartClient />)
    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }))
    await screen.findByText('Sign in to check out')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Sign in to check out')).toBeNull()
  })
})

describe('CartClient mobile row layout', () => {
  it('groups the line total, stepper and remove control into one right rail so the name keeps its width on phones', () => {
    render(<CartClient />)

    const name = screen.getByText('Baby Spinach 500g')
    // Name column allows two lines (line-clamp) instead of a crushed single-line truncate.
    expect(name.className).toContain('line-clamp-2')

    const rail = name.closest('div')!.parentElement!.querySelector(':scope > div:last-child') as HTMLElement
    expect(rail.className).toContain('flex-col') // stacked on mobile…
    expect(rail.className).toContain('sm:flex-row') // …row on larger screens

    // Quantity and line total are animated numbers (rendered values still
    // visible; 79.98 appears twice — line total and summary subtotal).
    expect(screen.getByText('2')).toBeTruthy()
    expect(screen.getAllByText('79.98').length).toBeGreaterThanOrEqual(2)
  })

  it('shows the empty state with a browse action', () => {
    useCartStore.setState({ items: [], total: 0, itemCount: 0 } as never)
    render(<CartClient />)

    expect(screen.getByText('Your cart is empty')).toBeTruthy()
    expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute('href', '/products')
  })
})
