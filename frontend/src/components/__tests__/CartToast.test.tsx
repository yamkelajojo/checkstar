import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React from 'react'
import CartToast from '../CartToast'
import { emitCartAdded } from '@/lib/cart-events'

// AnimatePresence retains the exiting node through its animation, which never
// completes under fake timers; the behaviour under test here is the
// announce/dismiss cycle, not the exit animation (pinned visually elsewhere).
vi.mock('motion/react', async () => (await import('@/test/motion-mock')).default)

describe('CartToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('is hidden until something is added to the cart', () => {
    const { container } = render(<CartToast />)
    expect(container.textContent).toBe('')
  })

  it('confirms the add with the product name and a cart link, inside an aria-live status region', () => {
    const { container } = render(<CartToast />)
    const live = container.querySelector('[aria-live="polite"][role="status"]')
    expect(live).toBeTruthy()

    act(() => {
      emitCartAdded('Clover Fresh Full Cream Milk 1L', 2)
    })
    expect(container.textContent).toContain('Added')
    expect(container.textContent).toContain('Clover Fresh Full Cream Milk 1L')
    expect(container.textContent).toContain('×2')
    const link = screen.getByRole('link', { name: 'View' })
    expect(link.getAttribute('href')).toBe('/cart')
  })

  it('auto-dismisses after 2.5s and re-arms on the next add', () => {
    const { container } = render(<CartToast />)

    act(() => {
      emitCartAdded('Bananas 1.2kg')
    })
    expect(container.textContent).toContain('Bananas 1.2kg')

    act(() => {
      vi.advanceTimersByTime(2500)
    })
    expect(container.textContent).toBe('')

    act(() => {
      emitCartAdded('Ladismith Unsalted Butter 500g')
    })
    expect(container.textContent).toContain('Ladismith Unsalted Butter 500g')
  })
})
