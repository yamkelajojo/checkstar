import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const mockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Thandi M.',
  email: 'thandi@example.com',
  phone: '+27 82 000 0000',
  role: 'customer',
  email_verified_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const authState = {
  isAuthenticated: true,
  isLoading: false,
  checkAuth: vi.fn(),
  user: mockUser(),
  setUser: vi.fn(),
}

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => authState,
}))

const updateProfile = vi.fn()
const requestEmailVerification = vi.fn()
const getAddresses = vi.fn()
const createAddress = vi.fn()
const updateAddress = vi.fn()
const deleteAddress = vi.fn()
vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, public readonly status: number) {
      super(message)
    }
  },
  api: {
    updateProfile: (...args: unknown[]) => updateProfile(...args),
    requestEmailVerification: (...args: unknown[]) => requestEmailVerification(...args),
    getAddresses: (...args: unknown[]) => getAddresses(...args),
    createAddress: (...args: unknown[]) => createAddress(...args),
    updateAddress: (...args: unknown[]) => updateAddress(...args),
    deleteAddress: (...args: unknown[]) => deleteAddress(...args),
  },
}))

vi.mock('motion/react', () => ({
  // Map motion.<tag> to the plain tag so buttons stay buttons.
  motion: new Proxy({}, { get: (_t, tag) => tag }),
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/delivery-coords', () => ({
  getDeliveryCoords: vi.fn().mockResolvedValue({ latitude: -29.85, longitude: 31.02, usedFallback: false }),
}))

import ProfileClient from '../ProfileClient'

function renderProfile() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ProfileClient />
    </QueryClientProvider>,
  )
}

describe('ProfileClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAddresses.mockResolvedValue({ data: [] })
  })

  it('renders the profile form with the current user', () => {
    renderProfile()
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Thandi M.')
    expect(screen.getByLabelText(/email/i)).toHaveValue('thandi@example.com')
  })

  it('saving an unchanged email shows success only', async () => {
    updateProfile.mockResolvedValue(mockUser())
    renderProfile()

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument())
    expect(screen.queryByTestId('verify-notice')).not.toBeInTheDocument()
  })

  it('saving a new email surfaces the re-verification notice', async () => {
    updateProfile.mockResolvedValue(mockUser({
      email: 'new@example.com',
      email_verified_at: null,
    }))
    renderProfile()

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByTestId('verify-notice')).toBeInTheDocument())
    expect(screen.getByText(/verification link/i)).toBeInTheDocument()
  })
})

describe('AddressBookSection (profile address book)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAddresses.mockResolvedValue({ data: [] })
  })

  it('lists saved addresses with the default badge and CRUD actions', async () => {
    getAddresses.mockResolvedValue({
      data: [
        { id: 7, label: 'Home', address: '12 Flint Road, Durban', latitude: -29.85, longitude: 31.02, is_default: true },
        { id: 9, label: 'Work', address: '45 Umbilo Road, Durban', latitude: -29.86, longitude: 31.01, is_default: false },
      ],
    })
    renderProfile()

    expect(await screen.findByText('Home')).toBeInTheDocument()
    expect(screen.getByText(/45 Umbilo Road/)).toBeInTheDocument()
    expect(screen.getByText(/Default/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add address/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /edit work/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete work/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /make work the default/i })).toBeInTheDocument()
  })

  it('adds an address with the form and refreshes the list', async () => {
    createAddress.mockResolvedValue({ data: { id: 11, label: 'Home' } })
    renderProfile()

    fireEvent.click(await screen.findByRole('button', { name: /add address/i }))
    fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '9 New Street, Durban' } })
    fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: '-29.9' } })
    fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: '31.0' } })
    fireEvent.click(screen.getByRole('button', { name: /save address/i }))

    await waitFor(() => expect(createAddress).toHaveBeenCalledWith(expect.objectContaining({
      address: '9 New Street, Durban',
      latitude: -29.9,
      longitude: 31,
    })))
  })

  it('deletes an address after confirmation', async () => {
    deleteAddress.mockResolvedValue({ message: 'Address removed' })
    getAddresses.mockResolvedValue({
      data: [
        { id: 7, label: 'Home', address: '12 Flint Road, Durban', latitude: -29.85, longitude: 31.02, is_default: true },
      ],
    })
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true))
    renderProfile()

    fireEvent.click(await screen.findByRole('button', { name: /delete home/i }))

    await waitFor(() => expect(deleteAddress).toHaveBeenCalledWith(7))
    vi.unstubAllGlobals()
  })
})
