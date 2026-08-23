import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

import OrderConfirmation from '../OrderConfirmation'
import type { Dispatch } from '@/types'

const order = { order_number: 'CS-123', id: 1 }

describe('OrderConfirmation', () => {
  it('shows success with rider and store details when dispatched', () => {
    const dispatch: Dispatch = {
      status: 'assigned',
      claim_latency_ms: 42,
      rider_id: 7,
      store_id: 2,
      rider_name: 'Sipho M.',
      store_name: 'Durban Central',
    }

    render(<OrderConfirmation order={order} dispatch={dispatch} />)

    expect(screen.getByText('Order Placed!')).toBeInTheDocument()
    expect(screen.getByText('#CS-123')).toBeInTheDocument()
    expect(screen.getByText(/Sipho M\./)).toBeInTheDocument()
    expect(screen.getByText(/Durban Central/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /track order/i })).toHaveAttribute('href', '/account/orders/1')
  })

  it('shows the retrying state when dispatch is still finding a rider', () => {
    const dispatch: Dispatch = { status: 'retrying', claim_latency_ms: null, rider_id: null, store_id: null }

    render(<OrderConfirmation order={order} dispatch={dispatch} />)

    expect(screen.getByText('Finding a Rider')).toBeInTheDocument()
    expect(screen.getByText(/looking for an available rider/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /track order/i })).toHaveAttribute('href', '/account/orders/1')
  })

  it('shows the cancelled state when dispatch cancelled the order', () => {
    const dispatch: Dispatch = { status: 'cancelled', claim_latency_ms: null, rider_id: null, store_id: null }

    render(<OrderConfirmation order={order} dispatch={dispatch} />)

    expect(screen.getByText('Order Cancelled')).toBeInTheDocument()
    expect(screen.getByText(/been charged/i)).toBeInTheDocument()
  })

  it('shows a neutral confirming state for an unknown dispatch status', () => {
    render(<OrderConfirmation order={order} />)

    expect(screen.getByText('Confirming your order')).toBeInTheDocument()
    expect(screen.queryByText('Order Placed!')).not.toBeInTheDocument()
  })
})
