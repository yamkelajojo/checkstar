import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Manager/admin surfaces — unit coverage for the Phase-4 remediation:
 *  - AdminDashboardClient: developer gate, real links, health rendering
 *  - StaffClient: roster RBAC, owner protection, hire validation, 409 handling
 *  - MessagesClient: mark-read on open, reply validation
 *  - DispatchConsoleClient: role gate, rider validation, dispatch/reassign
 */

// ---------- shared mutable mocks (hoisted for vi.mock factories) ----------
const { authState, setAuth, apiMocks, scratch } = vi.hoisted(() => {
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
    getUser: vi.fn(),
    getMessages: vi.fn(),
    markMessageRead: vi.fn(),
    replyToMessage: vi.fn(),
    getAdminHealth: vi.fn(),
    listStaff: vi.fn(),
    hireStaff: vi.fn(),
    fireStaff: vi.fn(),
    getPendingDispatch: vi.fn(),
    getDispatchRiders: vi.fn(),
    dispatchOrder: vi.fn(),
    reassignOrder: vi.fn(),
  },
    scratch: { pendingDispatch: [] as Array<Record<string, unknown>>, riders: [] as Array<Record<string, unknown>> },
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

// ---------- lib/query mock (page-level data hooks) ----------
vi.mock('@/lib/query', () => ({
  useAllProducts: () => ({ data: [{ id: 1 }, { id: 2 }], isLoading: false, error: null }),
  useCategories: () => ({ data: [{ id: 1 }], isLoading: false, error: null }),
  useOrders: () => ({ data: [{ id: 9, order_number: 'CS-9', status: 'preparing', total: '50', created_at: '2026-09-01T00:00:00Z' }], isLoading: false, error: null }),
  useStores: () => ({ data: [{ id: 1, name: 'Durban Central' }], isLoading: false, error: null }),
  useSpecials: () => ({ data: [], isLoading: false, error: null }),
  useRecipes: () => ({ data: [], isLoading: false, error: null }),
  usePendingDispatch: (_storeId?: number, options?: { enabled?: boolean }) => ({
    data: options?.enabled === false ? [] : scratch.pendingDispatch,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  }),
  useDispatchRiders: (_storeId?: number, options?: { enabled?: boolean }) => ({
    data: options?.enabled === false ? [] : scratch.riders,
    isLoading: false,
    error: null,
  }),
  useAnalyticsSales: () => ({ data: null, isLoading: false }),
  useAnalyticsProducts: () => ({ data: null, isLoading: false }),
  useAnalyticsRiders: () => ({ data: null, isLoading: false }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}))

vi.mock('@/lib/motion/variants', async () => {
  const actual = await vi.importActual<typeof import('@/lib/motion/variants')>('@/lib/motion/variants')
  return actual
})

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setAuth(null)
  setRows(scratch, [])
  setRows(scratch, [], 'riders')
})

function setRows(target: { pendingDispatch: Array<Record<string, unknown>>; riders: Array<Record<string, unknown>> }, rows: Array<Record<string, unknown>>, key: 'pendingDispatch' | 'riders' = 'pendingDispatch') {
  target[key] = rows
}

// ================= AdminDashboardClient =================
import AdminDashboardClient from '@/app/(admin)/admin/dashboard/AdminDashboardClient'

describe('AdminDashboardClient', () => {
  const healthPayload = {
    status: 'ok',
    uptime_s: 1200,
    services: { api: 'ok', database: 'ok', queue: 'warn', storage: 'ok' },
  }

  it('shows a staff dashboard with tools for non-developers', () => {
    setAuth({ id: 2, name: 'Thandi Owner', email: 'owner@x.co.za', role: 'store_owner' })
    apiMocks.getAdminHealth.mockResolvedValue(healthPayload)
    apiMocks.getMessages.mockResolvedValue({ data: [] })
    renderWithProviders(<AdminDashboardClient />)
    expect(screen.getByText('Staff Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Store Owner')).toBeInTheDocument()
    // Staff see their available tool links
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/admin/banners')
    expect(hrefs).toContain('/admin/staff')
    expect(hrefs).toContain('/admin/messages')
  })

  it('renders overview stats and the real management links for developers', async () => {
    setAuth({ id: 1, name: 'Dev User', email: 'dev@x.co.za', role: 'developer' })
    apiMocks.getAdminHealth.mockResolvedValue(healthPayload)
    apiMocks.getMessages.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] })

    renderWithProviders(<AdminDashboardClient />)

    // Stats from the (mocked) queries
    await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument()) // products

    // Every management link resolves to a real page (dead-link fix)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/admin/banners')
    expect(hrefs).toContain('/admin/staff')
    expect(hrefs).toContain('/admin/messages')
    expect(hrefs).toContain('/operations')
    expect(hrefs).toContain('/operations/analytics')
    expect(hrefs).toContain('/account/dispatch')
    // The old placeholder destinations are gone
    expect(hrefs.some((h) => h?.startsWith('/admin/products'))).toBe(false)
    expect(hrefs.some((h) => h === '#')).toBe(false)
  })

  it('surfaces degraded health when a service is not ok', async () => {
    setAuth({ id: 1, name: 'Dev User', email: 'dev@x.co.za', role: 'developer' })
    apiMocks.getAdminHealth.mockResolvedValue(healthPayload) // queue: warn
    apiMocks.getMessages.mockResolvedValue({ data: [] })

    renderWithProviders(<AdminDashboardClient />)
    await waitFor(() => expect(screen.getByText('Degraded — investigate below')).toBeInTheDocument())
    expect(screen.getByText('Queue')).toBeInTheDocument()
    expect(screen.getByText('warn')).toBeInTheDocument()
  })

  it('shows the all-clear state when every service is ok', async () => {
    setAuth({ id: 1, name: 'Dev User', email: 'dev@x.co.za', role: 'developer' })
    apiMocks.getAdminHealth.mockResolvedValue({
      status: 'ok',
      services: { api: 'ok', database: 'ok', queue: 'ok', storage: 'ok' },
    })
    apiMocks.getMessages.mockResolvedValue({ data: [] })

    renderWithProviders(<AdminDashboardClient />)
    await waitFor(() => expect(screen.getByText('All Systems Normal')).toBeInTheDocument())
  })

  it('handles a failing health endpoint without crashing', async () => {
    setAuth({ id: 1, name: 'Dev User', email: 'dev@x.co.za', role: 'developer' })
    apiMocks.getAdminHealth.mockRejectedValue(new Error('boom'))
    apiMocks.getMessages.mockResolvedValue({ data: [] })

    renderWithProviders(<AdminDashboardClient />)
    await waitFor(() => expect(screen.getByText('Health check unavailable')).toBeInTheDocument())
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
})

// ================= StaffClient =================
import StaffClient from '@/app/(admin)/admin/staff/StaffClient'

const staffRoster = {
  data: [
    { id: 10, user: { id: 2, name: 'Thandi Owner', email: 'owner@x.co.za' }, role: 'store_owner', store_id: 1, created_at: '2026-07-15T08:00:00Z' },
    { id: 11, user: { id: 3, name: 'Sipho Manager', email: 'manager@x.co.za' }, role: 'store_manager', store_id: 1, created_at: '2026-08-01T08:00:00Z' },
  ],
}

describe('StaffClient', () => {
  it('blocks users without staff-management roles', () => {
    setAuth({ id: 5, name: 'Rider Rita', email: 'rider@x.co.za', role: 'rider' })
    renderWithProviders(<StaffClient />)
    expect(screen.getByText('Staff access only')).toBeInTheDocument()
  })

  it('blocks store managers — the backend staff routes are owner/developer only', () => {
    setAuth({ id: 3, name: 'Sipho Manager', email: 'manager@x.co.za', role: 'store_manager' })
    renderWithProviders(<StaffClient />)
    expect(screen.getByText('Staff access only')).toBeInTheDocument()
    expect(apiMocks.listStaff).not.toHaveBeenCalled()
  })

  it('renders the roster with nested user data and shields owners from revocation', async () => {
    setAuth({ id: 2, name: 'Thandi Owner', email: 'owner@x.co.za', role: 'store_owner' })
    apiMocks.listStaff.mockResolvedValue(staffRoster)

    renderWithProviders(<StaffClient />)

    await waitFor(() => expect(screen.getByText('Thandi Owner')).toBeInTheDocument())
    expect(screen.getByText('Sipho Manager')).toBeInTheDocument()

    const ownerRow = screen.getByText('Thandi Owner').closest('li')!
    expect(within(ownerRow).queryByRole('button', { name: 'Revoke' })).toBeNull()

    const managerRow = screen.getByText('Sipho Manager').closest('li')!
    expect(within(managerRow).getByRole('button', { name: 'Revoke' })).toBeInTheDocument()
  })

  it('validates the hire form before calling the API', async () => {
    setAuth({ id: 2, name: 'Thandi Owner', email: 'owner@x.co.za', role: 'store_owner' })
    apiMocks.listStaff.mockResolvedValue({ data: [] })

    renderWithProviders(<StaffClient />)
    fireEvent.submit(screen.getByRole('button', { name: /Add member/ }).closest('form')!)

    await waitFor(() => expect(screen.getByText('Name and email are both required')).toBeInTheDocument())
    expect(apiMocks.hireStaff).not.toHaveBeenCalled()

    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'New Person' } })
    fireEvent.change(screen.getByPlaceholderText('name@company.co.za'), { target: { value: 'not-an-email' } })
    fireEvent.submit(screen.getByRole('button', { name: /Add member/ }).closest('form')!)
    await waitFor(() => expect(screen.getByText('Enter a valid email address')).toBeInTheDocument())
    expect(apiMocks.hireStaff).not.toHaveBeenCalled()
  })

  it('surfaces a 409 duplicate-hire rejection inline', async () => {
    setAuth({ id: 2, name: 'Thandi Owner', email: 'owner@x.co.za', role: 'store_owner' })
    apiMocks.listStaff.mockResolvedValue({ data: [] })
    const { ApiError } = await import('@/lib/api')
    apiMocks.hireStaff.mockRejectedValue(new ApiError('User already has a store assignment', 409, { message: 'User already has a store assignment' }))

    renderWithProviders(<StaffClient />)
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Sipho Manager' } })
    fireEvent.change(screen.getByPlaceholderText('name@company.co.za'), { target: { value: 'manager@x.co.za' } })
    fireEvent.submit(screen.getByRole('button', { name: /Add member/ }).closest('form')!)

    await waitFor(() => expect(screen.getByText('User already has a store assignment')).toBeInTheDocument())
  })
})

// ================= MessagesClient =================
import MessagesClient from '@/app/(admin)/admin/messages/MessagesClient'

const inbox = {
  data: [
    { id: 1, name: 'Nomsa Dlamini', email: 'nomsa@x.co.za', subject: 'Delivery', message: 'Where is my order?', is_read: false, created_at: '2026-09-05T09:00:00Z' },
    { id: 2, name: 'Pieter van Wyk', email: 'pieter@x.co.za', subject: 'Bulk', message: 'Bulk pricing?', is_read: true, created_at: '2026-09-03T14:30:00Z' },
  ],
}

describe('MessagesClient', () => {
  it('blocks non-admin roles', () => {
    setAuth({ id: 6, name: 'Rider Rita', email: 'rider@x.co.za', role: 'rider' })
    renderWithProviders(<MessagesClient />)
    expect(screen.getByText('Admin access only')).toBeInTheDocument()
  })

  it('blocks store owners — the admin message routes are developer-only', () => {
    setAuth({ id: 2, name: 'Thandi Owner', email: 'owner@x.co.za', role: 'store_owner' })
    renderWithProviders(<MessagesClient />)
    expect(screen.getByText('Admin access only')).toBeInTheDocument()
    expect(apiMocks.getMessages).not.toHaveBeenCalled()
  })

  it('marks an unread message read when opened and allows replying', async () => {
    setAuth({ id: 1, name: 'Dev User', email: 'dev@x.co.za', role: 'developer' })
    apiMocks.getMessages.mockResolvedValue(inbox)
    apiMocks.markMessageRead.mockResolvedValue({ data: {} })
    apiMocks.replyToMessage.mockResolvedValue({ data: {} })

    renderWithProviders(<MessagesClient />)
    await waitFor(() => expect(screen.getByText('Nomsa Dlamini')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Nomsa Dlamini/ }))

    // mark-read fired with explicit read:true
    await waitFor(() => expect(apiMocks.markMessageRead).toHaveBeenCalledWith(1, true))

    // Composer appears; empty reply is blocked
    const composer = await screen.findByPlaceholderText('Write your reply…')
    fireEvent.click(screen.getByRole('button', { name: /Send reply/ }))
    expect(await screen.findByText('Write a reply before sending')).toBeInTheDocument()
    expect(apiMocks.replyToMessage).not.toHaveBeenCalled()

    // A real reply goes through and clears the composer
    fireEvent.change(composer, { target: { value: 'On its way!' } })
    fireEvent.click(screen.getByRole('button', { name: /Send reply/ }))
    await waitFor(() => expect(apiMocks.replyToMessage).toHaveBeenCalledWith(1, 'On its way!'))
  })
})

// ================= DispatchConsoleClient =================
import DispatchConsoleClient from '@/app/(account)/account/dispatch/DispatchConsoleClient'

const pendingRow = (over: Record<string, unknown> = {}) => ({
  id: 501,
  order_number: 'CS-1501',
  status: 'confirmed',
  total: '84.97',
  delivery_address: '12 Problem Mkhize Rd',
  created_at: '2026-09-06T07:41:00Z',
  rider_id: null,
  items: [],
  ...over,
})

describe('DispatchConsoleClient', () => {
  it('blocks unauthorized roles', async () => {
    setAuth({ id: 6, name: 'Rider Rita', email: 'rider@x.co.za', role: 'rider' })
    renderWithProviders(<DispatchConsoleClient />)
    expect(await screen.findByText('Not authorized')).toBeInTheDocument()
  })

  it('shows reassign (not dispatch) for orders that already have a rider', async () => {
    setAuth({ id: 3, name: 'Sipho Manager', email: 'manager@x.co.za', role: 'store_manager' })
    setRows(scratch, [
      pendingRow({ id: 503, order_number: 'CS-1503', status: 'preparing', rider_id: 8 }),
    ])

    renderWithProviders(<DispatchConsoleClient />)

    expect(await screen.findByText('#CS-1503')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reassign' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dispatch' })).toBeNull()
    expect(screen.getByText(/Current rider: #8/)).toBeInTheDocument()
  })

  it('dispatches to a selected rider and confirms', async () => {
    setAuth({ id: 3, name: 'Sipho Manager', email: 'manager@x.co.za', role: 'store_manager' })
    setRows(scratch, [pendingRow()])
    setRows(scratch, [
      { id: 1, user_id: 7, store_id: 1, is_available: true, vehicle_type: 'Motorbike', user: { id: 7, name: 'Rider Rita', email: 'rita@x.co.za' } },
    ], 'riders')
    apiMocks.dispatchOrder.mockResolvedValue({ data: pendingRow({ rider_id: 7, status: 'preparing' }) })

    renderWithProviders(<DispatchConsoleClient />)
    const select = await screen.findByDisplayValue('Select rider...')
    fireEvent.change(select, { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Dispatch' }))

    await waitFor(() => expect(apiMocks.dispatchOrder).toHaveBeenCalledWith(501, 7, undefined))
    expect(await screen.findByText(/dispatched to rider 7/)).toBeInTheDocument()
  })

  it('shows API error reasons from failed dispatches', async () => {
    setAuth({ id: 3, name: 'Sipho Manager', email: 'manager@x.co.za', role: 'store_manager' })
    setRows(scratch, [pendingRow()])
    setRows(scratch, [
      { id: 1, user_id: 7, store_id: 1, is_available: true, vehicle_type: 'Motorbike', user: { id: 7, name: 'Rider Rita', email: 'rita@x.co.za' } },
    ], 'riders')
    apiMocks.dispatchOrder.mockRejectedValue(
      new (await import('@/lib/api')).ApiError('Invalid rider', 422, { reason: 'invalid_rider' })
    )

    renderWithProviders(<DispatchConsoleClient />)
    const select = await screen.findByDisplayValue('Select rider...')
    fireEvent.change(select, { target: { value: '7' } })
    fireEvent.click(screen.getByRole('button', { name: 'Dispatch' }))

    expect(await screen.findByText(/invalid_rider/)).toBeInTheDocument()
  })
})
