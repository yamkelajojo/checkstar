import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

import OrderConfirmation from '../OrderConfirmation'

describe('OrderConfirmation', () => {
  it('shows success and the order number when a rider is assigned', () => {
    render(<OrderConfirmation order={{ order_number: 'CS-123', id: 1 }} dispatchStatus="assigned" />)

    expect(screen.getByText('Order Placed!')).toBeInTheDocument()
    expect(screen.getByText('#CS-123')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /track order/i })).toHaveAttribute('href', '/account/orders/1')
  })

  it('shows the cancelled state when no rider is available', () => {
    render(<OrderConfirmation order={{ order_number: 'CS-123', id: 1 }} dispatchStatus="no_rider_available" />)

    expect(screen.getByText('Order Not Dispatched')).toBeInTheDocument()
    expect(screen.getByText(/available rider/i)).toBeInTheDocument()
  })

  it('treats an unknown dispatch status as a successful placement', () => {
    render(<OrderConfirmation order={{ order_number: 'CS-123', id: 1 }} />)

    expect(screen.getByText('Order Placed!')).toBeInTheDocument()
  })
})
