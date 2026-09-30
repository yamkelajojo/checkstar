import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { Loader } from '../Loader'

/**
 * The CheckStar wordmark loader must contrast whatever surface it sits on.
 * The original hard-coded #EB6522 paint made it invisible on the brand
 * orange submit buttons (orange-on-orange) — it only "appeared" on hover,
 * when the background darkened. Paint now flows through currentColor and a
 * tone prop picks the right ink for the surface.
 */

describe('Loader', () => {
  it('paints with currentColor, not a hard-coded brand orange', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'Loader.tsx'), 'utf8')
    // stroke/fill animate through currentColor so the wordmark always
    // contrasts its container colour.
    expect(src).toMatch(/stroke: currentColor/)
    expect(src).toMatch(/fill: currentColor/)
    expect(src).not.toMatch(/stroke: #EB6522/)
    expect(src).not.toMatch(/stroke: rgba\(235,101,34/)
  })

  it('defaults to the brand orange ink for light surfaces', () => {
    const { container } = render(<Loader />)
    const wrapper = container.querySelector(':scope > div') as HTMLElement
    expect(wrapper.style.color).toBe('rgb(235, 101, 34)')
  })

  it('offers a light tone for brand/dark surfaces', () => {
    const { container } = render(<Loader tone="light" />)
    const wrapper = container.querySelector(':scope > div') as HTMLElement
    expect(wrapper.style.color).toBe('rgb(255, 255, 255)')
  })

  it('renders the wordmark svg (decorative, hidden from AT)', () => {
    const { container } = render(<Loader />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute('aria-hidden')).toBe('true')
    expect(svg!.textContent).toContain('CheckStar')
  })
})
