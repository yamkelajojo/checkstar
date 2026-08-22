import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Header mobile menu', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'Header.tsx'), 'utf8')

  it('does not push page content — menu is overlay fixed, not inside header flow', () => {
    // Old implementation had motion.div with height 0 inside header that pushes layout
    // New must use fixed positioning above content
    expect(src).toMatch(/fixed inset-0 top-16/)
    expect(src).toMatch(/fixed top-16 left-0 right-0/)
    // Should not have the old inline header push variant with simple height 0 inside header
    // Header itself should stay sticky, not expand
    expect(src).toMatch(/sticky top-0 z-50/)
    // Panel should be z-40 overlay, not border-t inside header flow without fixed
    expect(src).not.toMatch(/<motion\.div[^>]*className="lg:hidden border-t/)
  })

  it('uses realistic physics easing (cubic bezier) for open/close', () => {
    expect(src).toMatch(/0\.4, 0\.01, 0\.165, 0\.99/)
    expect(src).toMatch(/cubic/)
  })

  it('animates menu items with staggered delayed entrance', () => {
    expect(src).toMatch(/staggerChildren/)
    expect(src).toMatch(/delayChildren/)
    expect(src).toMatch(/itemVariants|stagger/)
    // At least one variant for items
    expect(src).toMatch(/y:.*-14|y:.*-20|scale.*1\.06/)
  })

  it('animates burger icon with physics (rotate 90, bars to X)', () => {
    expect(src).toMatch(/rotate: 90/)
    expect(src).toMatch(/rotate: 45/)
    expect(src).toMatch(/rotate: -45/)
    expect(src).toMatch(/h-\[2px\]/)
    expect(src).toMatch(/bg-current/)
  })

  it('respects reduced motion and locks body scroll when open', () => {
    expect(src).toMatch(/useReducedMotion/)
    expect(src).toMatch(/shouldReduceMotion/)
    expect(src).toMatch(/document\.body\.style\.overflow/)
  })

  it('has backdrop that closes on click and is accessible dialog', () => {
    expect(src).toMatch(/aria-modal="true"/)
    expect(src).toMatch(/aria-label="Navigation menu"/)
    expect(src).toMatch(/onClick.*setMenuOpen\(false\)/)
  })
})
