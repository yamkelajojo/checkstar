import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Header mobile menu', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'Header.tsx'), 'utf8')

  it('does not push page content — menu is overlay fixed, not inside header flow', () => {
    expect(src).toMatch(/fixed inset-0/)
    expect(src).toMatch(/inset-x-0 top-16 bottom-0/)
    expect(src).toMatch(/overflow-y-auto/)
    expect(src).toMatch(/sticky top-0 z-50/)
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
    expect(src).toMatch(/y:.*-8|scale.*1\.03/)
    expect(src).toMatch(/filter.*blur/)
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

  it('covers entire viewport and respects safe areas', () => {
    expect(src).toMatch(/inset-0/)
    expect(src).toMatch(/inset-x-0 top-16 bottom-0/)
    expect(src).toMatch(/env\(safe-area-inset-bottom\)/)
  })

  it('tabs are centered horizontally and vertically', () => {
    expect(src).toMatch(/items-center/)
    expect(src).toMatch(/justify-center/)
    expect(src).toMatch(/text-center/)
    expect(src).toMatch(/flex-1/)
    expect(src).toMatch(/flex flex-col items-center justify-center/)
  })

  it('reduces font weight one step per design system (medium -> normal)', () => {
    expect(src).toMatch(/font-normal/)
    // Should not be font-medium for mobile tabs (allow for CTA which is semibold)
    // Ensure the nav link for tabs is font-normal
    const mobileTabMatches = (src.match(/font-normal/g) ?? []).length
    expect(mobileTabMatches).toBeGreaterThanOrEqual(1)
  })

  it('animation is snappier (user request: reduce menu durations) with subtle blur', () => {
    expect(src).toMatch(/duration: 0\.2,/) // open panel
    expect(src).toMatch(/duration: 0\.15,/) // close panel
    expect(src).toMatch(/staggerChildren: 0\.025/)
    expect(src).toMatch(/blur\(6px\)/)
    expect(src).toMatch(/blur\(0px\)/)
    expect(src).toMatch(/backdropFilter/)
  })

  it('logout clears the session then navigates home (no guarded-page bounce)', () => {
    expect(src).toMatch(/await logout\(\)/)
    expect(src).toMatch(/router\.push\('\/'\)/)
    expect(src).toMatch(/useRouter/)
  })

  it('keeps menu open until next page appears (closes on pathname change, not immediate)', () => {
    expect(src).toMatch(/usePathname/)
    expect(src).toMatch(/prevPathRef/)
    expect(src).toMatch(/handleNavClick/)
    // Should close on pathname change via effect, not immediate on every link click
    expect(src).toMatch(/prevPathRef\.current !== pathname/)
    // Same-page click should close immediately, different page defers
    expect(src).toMatch(/href === pathname/)
  })

  it('routes Account link to /account/profile first instead of /account/orders', () => {
    expect(src).toMatch(/['"]\/account\/profile['"]/)
    expect(src).toMatch(/handleNavClick\(user\?\.role === 'rider' \? '\/rider\/dashboard' : '\/account\/profile'\)/)
    expect(src).not.toMatch(/\/account\/orders/)
  })
})
