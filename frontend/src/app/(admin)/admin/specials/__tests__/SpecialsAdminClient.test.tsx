import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import SpecialsClientUnderTest from '../SpecialsAdminClient'

/**
 * Sale manager — the core workflow the rework exists for:
 * create a sale WITH its products (optional special prices), optionally
 * front it with a banner, in one flow. Role-scoped: developer/owner/manager.
 */

const { authState, setAuth, apiMocks } = vi.hoisted(() => {
  const authStateRef = {
    user: null as Record<string, unknown> | null,
    isAuthenticated: true,
    isLoading: false,
  }
  return {
    authState: authStateRef,
    setAuth: (user: Record<string, unknown> | null) => {
      authStateRef.user = user
      authStateRef.isAuthenticated = !!user
    },
    apiMocks: {
      getAdminSpecials: vi.fn(),
      getAdminSpecial: vi.fn(),
      createAdminSpecial: vi.fn(),
      updateAdminSpecial: vi.fn(),
      deleteAdminSpecial: vi.fn(),
      syncSaleProducts: vi.fn(),
      getStores: vi.fn(),
      getAllProducts: vi.fn(),
      createBanner: vi.fn(),
      // not used by this component — keep the object complete
      getMessages: vi.fn(),
      getAdminHealth: vi.fn(),
    },
  }
})

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) =>
    selector ? selector(authState as never) : authState,
}))

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, public readonly status: number, public readonly payload?: unknown) {
      super(message)
    }
  },
  api: apiMocks,
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

const DUBAI = { id: 1, name: 'Durban Central', slug: 'durban-central', address: '1 Beach Rd', city: 'Durban', phone: '031-000-0000', email: null, latitude: -29.9, longitude: 31.05, delivery_radius_km: 10, trading_hours: {}, logo: null, image: null, is_active: true }

const CATALOG = [
  { id: 10, category_id: 1, name: 'Spring Mix', slug: 'spring-mix', description: null, image: null, images: null, unit: '500g', price: 45, sale_price: null, tags: null, is_featured: false },
  { id: 11, category_id: 1, name: 'Wild Honey', slug: 'wild-honey', description: null, image: null, images: null, unit: '250ml', price: 30, sale_price: null, tags: null, is_featured: false },
]

const SALE = {
  id: 1,
  title: 'Spring Freshness',
  slug: 'spring-freshness',
  description: 'Fresh pick of the season',
  banner_image: null,
  start_date: '2026-09-01T00:00:00Z',
  end_date: '2026-09-30T23:59:59Z',
  is_active: true,
  store_id: 1,
  store: DUBAI,
  banner: null,
  products: [
    { ...CATALOG[0], special_price: 39.99 },
    { ...CATALOG[1] },
  ],
}

const OWNER = {
  id: 2,
  name: 'Thandi Owner',
  email: 'owner@x.co.za',
  role: 'store_owner',
  store: DUBAI,
}

const DEV = { id: 1, name: 'Dev User', email: 'dev@x.co.za', role: 'developer' }

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setAuth(null)
  apiMocks.getAdminSpecials.mockResolvedValue({ data: [SALE] })
  apiMocks.getAdminSpecial.mockResolvedValue({ data: SALE })
  apiMocks.getStores.mockResolvedValue({ data: [DUBAI] })
  apiMocks.getAllProducts.mockResolvedValue(CATALOG)
  // Echo the submitted payload back (as the API does) so slug/title match
  apiMocks.createAdminSpecial.mockImplementation(async (payload: Record<string, unknown>) => ({
    data: { ...SALE, id: 2, ...payload },
  }))
  apiMocks.updateAdminSpecial.mockImplementation(async (id: number, payload: Record<string, unknown>) => ({
    data: { ...SALE, id, ...payload },
  }))
  apiMocks.syncSaleProducts.mockImplementation(async (id: number, products: unknown[]) => ({
    data: { ...SALE, id, products: [] },
  }))
  apiMocks.createBanner.mockResolvedValue({ data: { id: 9 } })
})

// ================= Gating =================

describe('gating', () => {
  it('blocks roles that cannot manage sales', async () => {
    setAuth({ id: 7, name: 'Customer Cara', email: 'cara@x.co.za', role: 'customer' })
    renderWithProviders(<SpecialsClientUnderTest />)
    expect(await screen.findByText('Sales access only')).toBeInTheDocument()
    expect(apiMocks.getAdminSpecials).not.toHaveBeenCalled()
  })
})

// ================= List =================

describe('list', () => {
  it('derives the Live status from the date window and shows the sale meta', async () => {
    setAuth(OWNER)
    renderWithProviders(<SpecialsClientUnderTest />)

    expect(await screen.findByText('Spring Freshness')).toBeInTheDocument()
    // Status is derived from is_active + the date window (a past window would say Expired)
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.getByText(/2 products/)).toBeInTheDocument()
  })

  it('derives Expired for a sale whose window has passed', async () => {
    setAuth(OWNER)
    apiMocks.getAdminSpecials.mockResolvedValue({
      data: [{ ...SALE, start_date: '2026-08-01T00:00:00Z', end_date: '2026-08-31T23:59:59Z' }],
    })
    renderWithProviders(<SpecialsClientUnderTest />)
    expect(await screen.findByText('Spring Freshness')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('shows an empty state with a way in when there are no sales', async () => {
    setAuth(OWNER)
    apiMocks.getAdminSpecials.mockResolvedValue({ data: [] })
    renderWithProviders(<SpecialsClientUnderTest />)
    expect(await screen.findByText('No sales yet')).toBeInTheDocument()
    // The primary action is persistent (header) and repeated in the empty state
    expect(screen.getAllByRole('button', { name: 'New sale' }).length).toBe(2)
  })
})

// ================= Create =================

describe('create', () => {
  it('validates before touching the API', async () => {
    setAuth(OWNER)
    renderWithProviders(<SpecialsClientUnderTest />)
    fireEvent.click(await screen.findByRole('button', { name: 'New sale' }))

    // The editor is a full page view (the list is replaced, not covered by a dialog)
    await screen.findByRole('heading', { name: 'New sale' })
    expect(screen.getByRole('button', { name: 'Back to sales' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))
    expect(await screen.findByText('Title is required')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Autumn Sale' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))
    expect(await screen.findByText('Start date is required')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Start date *'), { target: { value: '2026-10-07' } })
    fireEvent.change(screen.getByLabelText('End date *'), { target: { value: '2026-10-01' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))
    expect(await screen.findByText('End date must be after the start date')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Start date *'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('End date *'), { target: { value: '2026-10-07' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))
    expect(await screen.findByText(/A sale needs at least one product/)).toBeInTheDocument()

    expect(apiMocks.createAdminSpecial).not.toHaveBeenCalled()
  })

  it('creates the sale, syncs its products (special price optional), and closes', async () => {
    setAuth(OWNER)
    renderWithProviders(<SpecialsClientUnderTest />)
    fireEvent.click(await screen.findByRole('button', { name: 'New sale' }))
    await screen.findByRole('heading', { name: 'New sale' })

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Autumn Sale' } })
    expect(screen.getByLabelText('Slug')).toHaveValue('autumn-sale')
    fireEvent.change(screen.getByLabelText('Start date *'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('End date *'), { target: { value: '2026-10-07' } })

    // Select both products; give the first one a special price, leave the second at its own price.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Spring Mix in the sale' }))
    fireEvent.change(screen.getByRole('textbox', { name: /Special price for Spring Mix/ }), { target: { value: '39.99' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Wild Honey in the sale' }))

    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))

    await waitFor(() => expect(apiMocks.createAdminSpecial).toHaveBeenCalledTimes(1))
    expect(apiMocks.createAdminSpecial).toHaveBeenCalledWith({
      title: 'Autumn Sale',
      slug: 'autumn-sale',
      description: null,
      start_date: '2026-10-01',
      end_date: '2026-10-07',
      is_active: true,
    })

    await waitFor(() => expect(apiMocks.syncSaleProducts).toHaveBeenCalledTimes(1))
    expect(apiMocks.syncSaleProducts).toHaveBeenCalledWith(2, [
      { product_id: 10, special_price: 39.99 },
      { product_id: 11 },
    ])

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Sale created'))
  })

  it('links a banner to the sale with the sale page as CTA', async () => {
    setAuth(OWNER)
    renderWithProviders(<SpecialsClientUnderTest />)
    fireEvent.click(await screen.findByRole('button', { name: 'New sale' }))
    await screen.findByRole('heading', { name: 'New sale' })

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Autumn Sale' } })
    fireEvent.change(screen.getByLabelText('Start date *'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('End date *'), { target: { value: '2026-10-07' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Spring Mix in the sale' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Also create a home-page banner for this sale' }))

    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))

    await waitFor(() => expect(apiMocks.createBanner).toHaveBeenCalledTimes(1))
    const bannerPayload = apiMocks.createBanner.mock.calls[0][0]
    expect(bannerPayload.special_id).toBe(2)
    expect(bannerPayload.slides[0].url).toBe('/specials/autumn-sale')
    expect(bannerPayload.status).toBe('published')
  })

  it('scopes owners to their own store — no store_id in the payload', async () => {
    setAuth(OWNER)
    renderWithProviders(<SpecialsClientUnderTest />)
    fireEvent.click(await screen.findByRole('button', { name: 'New sale' }))
    await screen.findByRole('heading', { name: 'New sale' })

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Autumn Sale' } })
    fireEvent.change(screen.getByLabelText('Start date *'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('End date *'), { target: { value: '2026-10-07' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Spring Mix in the sale' }))

    // The store is shown as a fixed context, not a control
    expect(screen.getByText('Durban Central')).toBeInTheDocument()
    expect(screen.queryByLabelText('Store')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))
    await waitFor(() => expect(apiMocks.createAdminSpecial).toHaveBeenCalledTimes(1))
    expect(apiMocks.createAdminSpecial.mock.calls[0][0]).not.toHaveProperty('store_id')
  })
})

// ================= Developer =================

describe('developer', () => {
  it('can target any store or the whole chain', async () => {
    setAuth(DEV)
    renderWithProviders(<SpecialsClientUnderTest />)
    fireEvent.click(await screen.findByRole('button', { name: 'New sale' }))
    await screen.findByRole('heading', { name: 'New sale' })

    const storeSelect = screen.getByLabelText('Store')
    expect(storeSelect).toHaveValue('')

    fireEvent.change(storeSelect, { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Chain Sale' } })
    fireEvent.change(screen.getByLabelText('Start date *'), { target: { value: '2026-10-01' } })
    fireEvent.change(screen.getByLabelText('End date *'), { target: { value: '2026-10-07' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Spring Mix in the sale' }))

    fireEvent.click(screen.getByRole('button', { name: 'Create sale' }))
    await waitFor(() => expect(apiMocks.createAdminSpecial).toHaveBeenCalledTimes(1))
    expect(apiMocks.createAdminSpecial.mock.calls[0][0].store_id).toBe(1)
  })
})

// ================= Edit & delete =================

describe('edit & delete', () => {
  it('prefills from the sale detail and syncs the reduced product list on save', async () => {
    setAuth(DEV)
    renderWithProviders(<SpecialsClientUnderTest />)
    await screen.findByText('Spring Freshness')

    fireEvent.click(screen.getByRole('button', { name: 'Edit Spring Freshness' }))
    await screen.findByRole('heading', { name: /Edit sale — Spring Freshness/ })

    // Prefilled, including the stored special price
    expect(screen.getByLabelText('Title *')).toHaveValue('Spring Freshness')
    const springPrice = screen.getByRole('textbox', { name: /Special price for Spring Mix/ })
    expect(springPrice).toHaveValue('39.99')

    // Remove Wild Honey from the sale (it had no special price of its own)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Include Wild Honey in the sale' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(apiMocks.updateAdminSpecial).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(apiMocks.syncSaleProducts).toHaveBeenCalledTimes(1))
    expect(apiMocks.syncSaleProducts).toHaveBeenCalledWith(1, [{ product_id: 10, special_price: 39.99 }])
  })

  it('confirms before deleting and reports the result', async () => {
    setAuth(DEV)
    apiMocks.deleteAdminSpecial.mockResolvedValue({ message: 'Deleted' })
    renderWithProviders(<SpecialsClientUnderTest />)
    await screen.findByText('Spring Freshness')

    fireEvent.click(screen.getByRole('button', { name: 'Delete Spring Freshness' }))
    const confirm = await screen.findByRole('dialog', { name: 'Delete this sale?' })
    expect(within(confirm).getByText(/Delete this sale\?/)).toBeInTheDocument()

    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete sale' }))
    await waitFor(() => expect(apiMocks.deleteAdminSpecial).toHaveBeenCalledWith(1))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Sale deleted'))
  })
})
