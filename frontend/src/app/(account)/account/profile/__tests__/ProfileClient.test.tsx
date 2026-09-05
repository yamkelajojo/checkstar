import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

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
vi.mock('@/lib/api', () => ({
  api: {
    updateProfile: (...args: unknown[]) => updateProfile(...args),
    requestEmailVerification: (...args: unknown[]) => requestEmailVerification(...args),
  },
}))

vi.mock('motion/react', () => ({
  // Map motion.<tag> to the plain tag so buttons stay buttons.
  motion: new Proxy({}, { get: (_t, tag) => tag }),
}))

import ProfileClient from '../ProfileClient'

describe('ProfileClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the profile form with the current user', () => {
    render(<ProfileClient />)
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Thandi M.')
    expect(screen.getByLabelText(/email/i)).toHaveValue('thandi@example.com')
  })

  it('saving an unchanged email shows success only', async () => {
    updateProfile.mockResolvedValue(mockUser())
    render(<ProfileClient />)

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument())
    expect(screen.queryByTestId('verify-notice')).not.toBeInTheDocument()
  })

  it('saving a new email surfaces the re-verification notice', async () => {
    updateProfile.mockResolvedValue(mockUser({
      email: 'new@example.com',
      email_verified_at: null,
    }))
    render(<ProfileClient />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => expect(screen.getByTestId('verify-notice')).toBeInTheDocument())
    expect(screen.getByText(/verification link/i)).toBeInTheDocument()
  })
})
