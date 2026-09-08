import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import React from 'react'

/**
 * LogoCarousel (vendored from cult-ui) as used by the home "Also In-Store"
 * section. Pins two behaviours that matter for a small brand set:
 *
 *  1. NO duplicate brand is ever visible across columns at the same moment —
 *     the source's random-subset + duplicate-backfill showed e.g. "MTN rain
 *     MTN" with 5 brands in 3 columns; our small-set path phase-rotates the
 *     full set per column instead.
 *  2. prefers-reduced-motion renders a static set (no timer churn).
 */

const mockReduce = vi.hoisted(() => vi.fn(() => false))

vi.mock('motion/react', async () => {
  const React = await Promise.resolve(import('react'))
  return {
    motion: new Proxy({}, { get: (_t, tag) => tag }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => mockReduce(),
  }
})

import LogoCarousel, { type Logo } from '../ui/logo-carousel'
import { BRAND_LOGOS } from '../brand-logos'

const logo = (id: number, name: string): Logo => ({
  id,
  name,
  img: (props: React.SVGProps<SVGSVGElement>) =>
    React.createElement('svg', { 'data-logo': name, ...props }),
})

const FIVE = [
  logo(1, 'alpha'),
  logo(2, 'bravo'),
  logo(3, 'charlie'),
  logo(4, 'delta'),
  logo(5, 'echo'),
]

/** One visible logo name per column, in column order. */
const visibleNames = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('svg[data-logo]')].map(
    (el) => el.getAttribute('data-logo') ?? ''
  )

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('LogoCarousel — small brand sets', () => {
  beforeEach(() => {
    mockReduce.mockReturnValue(false)
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    mockReduce.mockReturnValue(false)
  })

  it('never shows the same logo in two columns at the same instant', () => {
    const { container } = render(<LogoCarousel logos={FIVE} columnCount={3} />)

    // Sample a full 10s cycle (5 logos × 2s) at irregular points.
    for (const sample of [0, 700, 2100, 4200, 6300, 8400, 9800]) {
      advance(sample === 0 ? 0 : 2100)
      const names = visibleNames(container)
      const where = `at t≈${sample}: ${names.join(',')}`
      expect(names, where).toHaveLength(3)
      expect(new Set(names).size, where).toBe(3)
    }
  })

  it('cycles every brand through the columns over time', () => {
    const { container } = render(<LogoCarousel logos={FIVE} columnCount={3} />)
    const seen = new Set<string>(visibleNames(container))
    for (let i = 0; i < 5; i += 1) {
      advance(2100)
      visibleNames(container).forEach((n) => seen.add(n))
    }
    expect([...seen].sort()).toEqual(['alpha', 'bravo', 'charlie', 'delta', 'echo'])
  })

  it('renders exactly columnCount columns', () => {
    const { container } = render(<LogoCarousel logos={FIVE} columnCount={2} />)
    // The root is the flex row; its children are the columns.
    const root = container.firstElementChild as HTMLElement
    expect(root.children).toHaveLength(2)
  })

  it('renders a static set under prefers-reduced-motion (timer never flips it)', () => {
    mockReduce.mockReturnValue(true)
    const { container } = render(<LogoCarousel logos={FIVE} columnCount={3} />)
    const before = visibleNames(container)
    advance(10_000)
    expect(visibleNames(container)).toEqual(before)
  })
})

describe('BRAND_LOGOS (in-store service set)', () => {
  it('exposes five unique brands with unique ids and renderable images', () => {
    expect(BRAND_LOGOS.map((l) => l.name)).toEqual([
      'MTN',
      'Vodacom',
      'Cell C',
      'Telkom',
      'rain',
    ])
    expect(new Set(BRAND_LOGOS.map((l) => l.id)).size).toBe(BRAND_LOGOS.length)
    for (const entry of BRAND_LOGOS) {
      const { container } = render(React.createElement(entry.img))
      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('alt')).toBe(entry.name)
    }
  })
})
