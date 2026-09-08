import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Product } from '@/types'

/**
 * Cart checkout gate + mobile row layout regressions.
 * - Guests get an animated sign-in modal instead of the old amber banner.
 * - The item row must keep the name readable on phones (the old 5-column row
 *   squeezed it to one character per line — see user screenshot).
 * - Fulfilment toggle: delivery (saved-address prompt) vs store pickup.
 */

const { ApiError, getAddressesMock, getStoresMock, createAddressMock } = vi.hoisted(() => {
  class ApiError extends Error {
    status: number
    payload: unknown
    constructor(message: string, status: number, payload: unknown = null) {
      super(message)
      this.name = 'ApiError'
      this.status = status
      this.payload = payload
    }
  }
  return {
    ApiError,
    getAddressesMock: vi.fn(),
    getStoresMock: vi.fn(),
    createAddressMock: vi.fn(),
  }
})

vi.mock('@/lib/api', () => ({
  ApiError,
  apiErrorReason: () => null,
  api: {
    getAddresses: (...args: unknown[]) => getAddressesMock(...args),
    getStores: (...args: unknown[]) => getStoresMock(...args),
    createAddress: (...args: unknown[]) => createAddressMock(...args),
  },
}))

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
    useSpring: (v: number) => ({ set: () => {}, on: () => () => {}, get: () => v, stop: () => {} }),
    useTransform: (mv: { get: () => number }, fn: (v: number) => string) => fn(mv.get()),
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

function renderCart() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <CartClient />
    </QueryClientProvider>,
  )
}

async function openCheckout() {
  authState.authenticated = true
  renderCart()
  fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }))
  await screen.findByRole('group', { name: /fulfilment method/i })
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.authenticated = false
  document.body.style.overflow = ''
  seedCart()
  getAddressesMock.mockResolvedValue({ data: [] })
  getStoresMock.mockResolvedValue({ data: [
    { id: 3, name: 'Overport Store', address: '78 Phoenix Highway', is_active: true },
    { id: 5, name: 'Umhlanga Store', address: '12 Lagoon Drive', is_active: false },
  ] })
})

describe('CartClient guest checkout gate', () => {
  it('opens the sign-in modal when a guest proceeds to checkout', async () => {
    renderCart()

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
    await openCheckout()

    expect(await screen.findByLabelText(/delivery address/i)).toBeTruthy()
    expect(screen.queryByText('Sign in to check out')).toBeNull()
  })

  it('opens the modal (not the old amber banner) when placing the order returns 401', async () => {
    authState.authenticated = true
    mutateAsync.mockRejectedValue(new ApiError('Unauthenticated.', 401))

    await openCheckout()
    const address = await screen.findByLabelText(/delivery address/i)
    fireEvent.change(address, { target: { value: '12 Umgeni Rd, Durban' } })
    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => expect(screen.findByText('Sign in to check out')).toBeTruthy())
    expect(screen.queryByText(/session has expired/i)).toBeNull()
  })

  it('closes the modal from the close button', async () => {
    renderCart()
    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }))
    await screen.findByText('Sign in to check out')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Sign in to check out')).toBeNull()
  })
})

describe('CartClient mobile row layout', () => {
  it('groups the line total, stepper and remove control into one right rail so the name keeps its width on phones', () => {
    renderCart()

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
    renderCart()

    expect(screen.getByText('Your cart is empty')).toBeTruthy()
    expect(screen.getByRole('link', { name: /browse products/i })).toHaveAttribute('href', '/products')
  })
})

describe('CartClient fulfilment (delivery vs pickup)', () => {
  it('prompts delivery customers with their saved addresses and uses the saved pin for the order', async () => {
    getAddressesMock.mockResolvedValue({ data: [
      { id: 7, label: 'Home', address: '12 Flint Road, Durban', latitude: -29.8123, longitude: 31.0099, is_default: true },
      { id: 9, label: 'Work', address: '45 Umbilo Road, Durban', latitude: -29.8671, longitude: 31.0052, is_default: false },
    ] })
    mutateAsync.mockResolvedValue({
      data: { id: 1, order_number: 'CS-1', payment_status: 'pending' },
      dispatch: { status: 'assigned' },
    })

    await openCheckout()

    // The picker is preselected to the default address — no typing needed.
    const picker = await screen.findByLabelText(/deliver to/i) as HTMLSelectElement
    expect(picker.value).toBe('7')
    expect(screen.getByRole('option', { name: /Home — 12 Flint Road/ })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      fulfilment_method: 'delivery',
      delivery_address: '12 Flint Road, Durban',
      delivery_latitude: -29.8123,
      delivery_longitude: 31.0099,
    })))
  })

  it('switching to pickup offers active stores, sends the store id, and clears the cart', async () => {
    mutateAsync.mockResolvedValue({
      data: { id: 2, order_number: 'CS-2', payment_status: 'pending' },
      dispatch: { status: 'pickup' },
    })

    await openCheckout()

    fireEvent.click(screen.getByRole('button', { name: /pickup/i }))

    const storeSelect = await screen.findByLabelText(/collect from/i) as HTMLSelectElement
    // Only ACTIVE stores are offered (Umhlanga is inactive).
    expect(await screen.findByRole('option', { name: /Overport Store — 78 Phoenix Highway/ })).toBeTruthy()
    expect(screen.queryByRole('option', { name: /Umhlanga/ })).toBeNull()
    expect(storeSelect.value).toBe('3')

    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      fulfilment_method: 'pickup',
      store_id: 3,
    })))
    // A pickup order was accepted — the cart must be cleared even though no
    // rider was assigned (status 'pickup', not 'assigned').
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(0))
  })

  it('pickup without a store choice is blocked with a message, not a request', async () => {
    getStoresMock.mockResolvedValue({ data: [] })

    await openCheckout()
    fireEvent.click(screen.getByRole('button', { name: /pickup/i }))

    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    expect(await screen.findByText(/choose a store to collect from/i)).toBeTruthy()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('clears the cart after a delivery order is placed, even when retrying', async () => {
    mutateAsync.mockResolvedValue({
      data: { id: 3, order_number: 'CS-3', payment_status: 'pending' },
      dispatch: { status: 'retrying' },
    })

    await openCheckout()
    const address = await screen.findByLabelText(/delivery address/i)
    fireEvent.change(address, { target: { value: '12 Umgeni Rd, Durban' } })
    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('offers to save a newly typed address with the order', async () => {
    createAddressMock.mockResolvedValue({ data: { id: 21, label: 'Home' } })
    mutateAsync.mockResolvedValue({
      data: { id: 4, order_number: 'CS-4', payment_status: 'pending' },
      dispatch: { status: 'assigned' },
    })

    await openCheckout()

    // Choose "Enter a new address…" in the picker (single saved address case:
    // none saved → the textarea shows immediately).
    fireEvent.change(screen.getByLabelText(/delivery address/i), { target: { value: '9 New Street, Durban' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /save this address for next time/i }))
    fireEvent.change(screen.getByLabelText(/address label/i), { target: { value: 'Home' } })
    fireEvent.click(screen.getByRole('button', { name: /place order/i }))

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      delivery_address: '9 New Street, Durban',
      delivery_latitude: -29.85,
    })))
    await waitFor(() => expect(createAddressMock).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Home',
      address: '9 New Street, Durban',
      is_default: true,
    })))
  })
})
