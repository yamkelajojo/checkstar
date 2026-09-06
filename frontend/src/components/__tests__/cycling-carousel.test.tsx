import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import React from 'react'

/**
 * Regression: the carousel must NOT redistribute (re-shuffle) when the
 * consumer re-renders with a fresh items array containing the same items.
 * The first version depended on array identity, so every scroll-toggled
 * re-render of the product page visibly scrambled the shelf.
 *
 * Note: each column displays exactly ONE cell at a time (the cycle), so
 * assertions are made against the currently-visible slug per column, and
 * fake timers advance the clock to reach every item.
 */

vi.mock('motion/react', async () => {
  const React = await Promise.resolve(import('react'))
  return {
    motion: new Proxy({}, { get: (_t, tag) => tag }),
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
  }
})

import CyclingCarousel from '../ui/cycling-carousel'
import type { CycleItem } from '../ui/cycling-carousel'

const item = (id: number, slug: string): CycleItem => ({
  id,
  content: React.createElement('a', { href: `/products/${slug}`, 'data-slug': slug }, slug),
})

const ITEMS = [
  item(1, 'a'), item(2, 'b'), item(3, 'c'), item(4, 'd'),
  item(5, 'e'), item(6, 'f'), item(7, 'g'), item(8, 'h'),
]

const visibleSlugs = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('a[data-slug]')].map((a) => a.getAttribute('data-slug') ?? '')

describe('CyclingCarousel', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps the same column distribution across re-renders with a new items array', () => {
    vi.useFakeTimers()
    const { rerender, container } = render(<CyclingCarousel items={ITEMS} columnCount={4} />)
    const before = visibleSlugs(container).sort()

    // Same logical items, new array identity — what an inline .map produces.
    rerender(<CyclingCarousel items={[...ITEMS]} columnCount={4} />)
    const after = visibleSlugs(container).sort()

    expect(after).toEqual(before)
    expect(after).toHaveLength(4) // one cell per column, 4 columns
  })

  it('cycles so every item becomes visible over time — and never duplicates simultaneously', () => {
    vi.useFakeTimers()
    const { container } = render(<CyclingCarousel items={ITEMS} columnCount={4} />)

    const seen = new Set<string>()
    for (let step = 0; step < 6; step++) {
      act(() => {
        vi.advanceTimersByTime(2300)
      })
      const now = visibleSlugs(container)
      expect(new Set(now).size).toBe(now.length) // no simultaneous duplicates
      now.forEach((s) => seen.add(s))
    }
    expect([...seen].sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
  })

  it('drops columns that would be empty when there are fewer items than columns', () => {
    const { container } = render(<CyclingCarousel items={[item(1, 'a'), item(2, 'b')]} columnCount={4} />)

    // 2 items → 2 columns, no empty columns rendered.
    expect(visibleSlugs(container)).toHaveLength(2)
  })
})
