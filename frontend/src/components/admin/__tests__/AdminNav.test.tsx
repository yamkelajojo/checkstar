import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'

const { authState, setAuth, pathname } = vi.hoisted(() => ({
  authState: { user: null as Record<string, unknown> | null },
  setAuth: (user: Record<string, unknown> | null) => {
    authState.user = user
  },
  pathname: { current: '/admin/dashboard' },
}))

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: (selector?: (s: unknown) => unknown) =>
    selector ? selector(authState as never) : authState,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.current,
}))

import AdminNav from '../AdminNav'

describe('AdminNav', () => {
  beforeEach(() => {
    setAuth(null)
    pathname.current = '/admin/dashboard'
  })

  it('renders nothing for non-staff roles', () => {
    setAuth({ id: 9, role: 'customer' })
    const { container } = render(<AdminNav />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the full grouped navigation to a developer', () => {
    setAuth({ id: 1, role: 'developer' })
    render(<AdminNav />)

    // Groups
    for (const group of ['Store', 'Fulfillment', 'Catalog', 'People', 'Content', 'System']) {
      expect(screen.getAllByText(group).length).toBeGreaterThan(0)
    }
    // Representative items across groups
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/admin/orders')
    expect(screen.getByRole('link', { name: 'Sales' })).toHaveAttribute('href', '/admin/specials')
    expect(screen.getByRole('link', { name: 'Dispatch' })).toHaveAttribute('href', '/account/dispatch')
    expect(screen.getByRole('link', { name: 'Live Operations' })).toHaveAttribute('href', '/operations')
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/admin/products')
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('link', { name: 'Health' })).toHaveAttribute('href', '/admin/health')
  })

  it('hides platform screens from a store manager', () => {
    setAuth({ id: 3, role: 'store_manager' })
    render(<AdminNav />)

    // Store + fulfillment tools, as the manager uses them
    expect(screen.getByRole('link', { name: 'Orders' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sales' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Banners' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Live Operations' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Analytics' })).toBeInTheDocument()

    // Developer-only surfaces are absent — no 403 bait
    expect(screen.queryByRole('link', { name: 'Products' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Users' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Messages' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Staff' })).toBeNull()
  })

  it('marks the active page', () => {
    setAuth({ id: 1, role: 'developer' })
    pathname.current = '/admin/inventory'
    render(<AdminNav />)

    const active = screen.getByRole('link', { name: 'Inventory' })
    expect(active).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Orders' })).not.toHaveAttribute('aria-current')
  })

  it('opens and closes the mobile drawer', () => {
    setAuth({ id: 1, role: 'developer' })
    render(<AdminNav />)

    const openBtn = screen.getByRole('button', { name: 'Open admin navigation' })
    expect(openBtn).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(openBtn)
    expect(screen.getByRole('dialog', { name: 'Admin navigation' })).toBeInTheDocument()
    expect(openBtn).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Close navigation' }))
    expect(screen.queryByRole('dialog', { name: 'Admin navigation' })).toBeNull()
  })
})
