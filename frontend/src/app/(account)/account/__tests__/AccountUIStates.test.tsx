import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const { redirectMock, apiMocks, coordsMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  apiMocks: {
    getAddresses: vi.fn(),
    createAddress: vi.fn(),
    updateAddress: vi.fn(),
    deleteAddress: vi.fn(),
  },
  coordsMock: vi.fn(() =>
    Promise.resolve({ latitude: -29.8289, longitude: 31.0145, usedFallback: false }),
  ),
}))

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('@/lib/api', () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
      public readonly payload?: unknown,
    ) {
      super(message)
    }
  },
  api: apiMocks,
}))

vi.mock('@/lib/delivery-coords', () => ({
  getDeliveryCoords: coordsMock,
}))

vi.mock('motion/react', async () => (await import('@/test/motion-mock')).default)

import AccountIndexPage from '../page'
import AddressBookSection from '../profile/AddressBookSection'

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('Account UI States, Transitions & Autocomplete (White-Box)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    apiMocks.getAddresses.mockResolvedValue({ data: [] })
    apiMocks.createAddress.mockResolvedValue({ data: { id: 10 } })
    apiMocks.updateAddress.mockResolvedValue({ data: { id: 1 } })
    apiMocks.deleteAddress.mockResolvedValue({ message: 'Deleted' })
  })

  it('redirects /account directly to /account/profile so Profile is the first account landing page', () => {
    AccountIndexPage()
    expect(redirectMock).toHaveBeenCalledWith('/account/profile')
  })

  it('transitions AddressBookSection from empty state -> open form -> autocomplete selection -> save', async () => {
    renderWithProviders(<AddressBookSection />)

    // State 1: Empty state message
    expect(
      await screen.findByText(/No saved addresses yet\. Add one so checkout can offer it/),
    ).toBeInTheDocument()

    // Transition 1: Open Add Address form
    fireEvent.click(screen.getByRole('button', { name: /Add Address/i }))
    const streetInput = screen.getByLabelText('Street Address')
    expect(streetInput).toBeInTheDocument()

    // Validation branch: submitting empty street address shows validation error
    fireEvent.click(screen.getByRole('button', { name: /Save Address/i }))
    expect(await screen.findByText('Please enter the street address.')).toBeInTheDocument()
    expect(apiMocks.createAddress).not.toHaveBeenCalled()

    // Transition 2: Focus & type in Street Address -> Durban suggestions dropdown opens
    fireEvent.focus(streetInput)
    fireEvent.change(streetInput, { target: { value: 'Florida' } })

    const suggestionBtn = await screen.findByText('195 Florida Road, Morningside, Durban, 4001')
    expect(suggestionBtn).toBeInTheDocument()

    // Transition 3: Selecting suggestion populates address & coordinates and closes dropdown
    fireEvent.mouseDown(suggestionBtn)
    expect(streetInput).toHaveValue('195 Florida Road, Morningside, Durban, 4001')
    expect(screen.getByLabelText('Latitude')).toHaveValue('-29.8289')
    expect(screen.getByLabelText('Longitude')).toHaveValue('31.0145')

    // Transition 4: Submit form -> calls createAddress and closes form
    fireEvent.change(screen.getByLabelText('Label'), { target: { value: 'Work' } })
    fireEvent.click(screen.getByRole('button', { name: /Save Address/i }))

    await waitFor(() => expect(apiMocks.createAddress).toHaveBeenCalledTimes(1))
    expect(apiMocks.createAddress).toHaveBeenCalledWith({
      label: 'Work',
      address: '195 Florida Road, Morningside, Durban, 4001',
      latitude: -29.8289,
      longitude: 31.0145,
      is_default: false,
    })
  })

  it('populates Label, Street Address, Latitude, and Longitude when clicking Use my current location', async () => {
    renderWithProviders(<AddressBookSection />)
    await screen.findByText(/No saved addresses yet/)

    fireEvent.click(screen.getByRole('button', { name: /Add Address/i }))
    fireEvent.click(screen.getByRole('button', { name: /Use my current location/i }))

    await waitFor(() =>
      expect(screen.getByLabelText('Street Address')).toHaveValue(
        '195 Florida Road, Morningside, Durban, 4001',
      ),
    )
    expect(screen.getByLabelText('Label')).toHaveValue('Morningside')
    expect(screen.getByLabelText('Latitude')).toHaveValue('-29.8289')
    expect(screen.getByLabelText('Longitude')).toHaveValue('31.0145')
  })

  it('supports editing, setting default, and deleting saved addresses', async () => {
    apiMocks.getAddresses.mockResolvedValue({
      data: [
        {
          id: 1,
          label: 'Beach Flat',
          address: '12 Chartwell Drive, Umhlanga Rocks, 4319',
          latitude: -29.7258,
          longitude: 31.0849,
          is_default: false,
        },
      ],
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(<AddressBookSection />)
    expect(await screen.findByText('Beach Flat')).toBeInTheDocument()

    // Make default transition
    fireEvent.click(screen.getByRole('button', { name: 'Make Beach Flat the default address' }))
    await waitFor(() =>
      expect(apiMocks.updateAddress).toHaveBeenCalledWith(1, { is_default: true }),
    )

    // Edit transition
    fireEvent.click(screen.getByRole('button', { name: 'Edit Beach Flat' }))
    expect(screen.getByLabelText('Label')).toHaveValue('Beach Flat')
    expect(screen.getByRole('button', { name: /Update Address/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))

    // Delete transition
    fireEvent.click(screen.getByRole('button', { name: 'Delete Beach Flat' }))
    await waitFor(() => expect(apiMocks.deleteAddress).toHaveBeenCalledWith(1))
  })
})
