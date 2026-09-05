import { render } from '@testing-library/react'
import { describe, it, expect, afterEach } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { act } from 'react'
import { Logo } from '../Logo'

function setScrollY(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
  act(() => {
    window.dispatchEvent(new Event('scroll'))
  })
}

afterEach(() => {
  setScrollY(0)
})

/**
 * Regression: React treats a numeric `lineHeight` as the unitless CSS
 * property (a multiplier). The wordmark used to ship
 * `lineHeight: size * 1.05`, i.e. `line-height: 34.44` — an invisible line
 * box ~size*1.05*fontSize tall (~1100px at login size). The header masked it
 * (fixed height + overflow), but it overlayed content beneath the header on
 * every page and blew up layouts that gave the logo room (centered login).
 */
describe('Logo', () => {
  it('renders the wordmark line-height in px, never as a unitless multiplier', () => {
    const { container } = render(<Logo variant="lockup" size={40} tone="dark" />)
    const spans = [...container.querySelectorAll('span')]
    const wordmark = spans.find((s) => s.textContent === 'Checkstar')
    expect(wordmark).toBeTruthy()
    const lineHeight = wordmark!.style.lineHeight
    expect(lineHeight).toMatch(/px$/)
    // lockup wordmark renders at size * 0.82, line-height at 1.05x that
    expect(parseFloat(lineHeight)).toBeCloseTo(40 * 0.82 * 1.05, 1)
  })

  it('sizes the lockup from the size prop', () => {
    const { container } = render(<Logo variant="lockup" size={40} tone="dark" />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('width')).toBe('40')
  })

  /**
   * Round-9 regression: the tagline used to SSR *visible*, so reloading a
   * scrolled page painted "cares enough" and removed it right after
   * hydration (the startup flash + lockup jump the user reported).
   * Correct behaviour: hidden until hydration proves the page is at the top.
   */
  it('hides the tagline in server-rendered HTML (no startup flash on scrolled reloads)', () => {
    const html = renderToString(React.createElement(Logo, { variant: 'lockup', size: 26, tone: 'dark' }))
    expect(html).toContain('cares enough')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('opacity:0')
  })

  it('fades the tagline in when hydrated at the top of the page', () => {
    const { container } = render(<Logo variant="lockup" size={26} tone="dark" />)
    const tagline = [...container.querySelectorAll('span')].find((s) => s.textContent === 'cares enough')!
    act(() => {})
    expect(tagline.getAttribute('aria-hidden')).toBe('false')
    expect(tagline.style.opacity).toBe('1')
  })

  it('hides the tagline after scrolling down and restores it at the top', () => {
    const { container } = render(<Logo variant="lockup" size={26} tone="dark" />)
    const tagline = [...container.querySelectorAll('span')].find((s) => s.textContent === 'cares enough')!
    act(() => {})
    expect(tagline.style.opacity).toBe('1')
    setScrollY(200)
    expect(tagline.getAttribute('aria-hidden')).toBe('true')
    expect(tagline.style.opacity).toBe('0')
    setScrollY(0)
    expect(tagline.getAttribute('aria-hidden')).toBe('false')
    expect(tagline.style.opacity).toBe('1')
  })

  /**
   * The tagline must never participate in layout: a collapsing in-flow span
   * re-centred the lockup (the visible jump) on every show/hide. It is
   * absolutely positioned below the wordmark and fades by opacity only.
   */
  it('positions the tagline absolutely so show/hide never re-flows the lockup', () => {
    const { container } = render(<Logo variant="lockup" size={26} tone="dark" />)
    const tagline = [...container.querySelectorAll('span')].find((s) => s.textContent === 'cares enough')!
    expect(tagline.className).toContain('absolute')
    expect(tagline.style.transition).toBe('opacity 200ms ease')
    expect(tagline.style.maxHeight).toBe('')
  })
})
