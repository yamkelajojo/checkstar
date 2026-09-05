import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import React from 'react'
import { Logo } from '../Logo'

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
})
