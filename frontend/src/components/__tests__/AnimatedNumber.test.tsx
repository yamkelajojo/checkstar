import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

/**
 * AnimatedNumber — the spring-based implementation (vendored from cult-ui)
 * must respect prefers-reduced-motion: reduced users get the final value
 * statically, motion users get the odometer.
 */

const mockReduce = vi.hoisted(() => vi.fn(() => false))

vi.mock('motion/react', async () => {
  const mock = (await import('@/test/motion-mock')).default
  return {
    ...mock,
    useReducedMotion: () => mockReduce(),
    useSpring: (v: number) => ({ set: () => {}, on: () => () => {}, get: () => v, stop: () => {} }),
    useTransform: (mv: { get: () => number }, fn: (v: number) => string) => fn(mv.get()),
  }
})

import AnimatedNumber from '../AnimatedNumber'

describe('AnimatedNumber (spring)', () => {
  it('renders the final value statically under prefers-reduced-motion', () => {
    mockReduce.mockReturnValue(true)
    const { container } = render(<AnimatedNumber value={1234} />)
    expect(container.querySelector('span')?.textContent).toBe('1,234')
    expect(container.textContent).not.toContain('motion')
    mockReduce.mockReturnValue(false)
  })

  it('formats money to the requested precision', () => {
    mockReduce.mockReturnValue(true)
    const { container } = render(
      <AnimatedNumber value={79.98} precision={2} format={(n) => n.toFixed(2)} />,
    )
    expect(container.textContent).toBe('79.98')
    mockReduce.mockReturnValue(false)
  })

  it('keeps the className prop on the static path (API compatibility with the pre-spring component)', () => {
    mockReduce.mockReturnValue(true)
    const { container } = render(<AnimatedNumber value={2} className="font-bold" />)
    expect(container.querySelector('span')?.className).toBe('font-bold')
    mockReduce.mockReturnValue(false)
  })
})
