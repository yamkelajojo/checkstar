import { describe, it, expect } from 'vitest'
import { FILTER_GROUPS } from '../ProductsClient'
import fs from 'node:fs'
import path from 'node:path'

describe('ProductsClient filter groups', () => {
  it('exposes exactly 7 pills (All + 6 groups)', () => {
    expect(FILTER_GROUPS).toHaveLength(7)
    expect(FILTER_GROUPS[0].label).toBe('All')
    expect(FILTER_GROUPS.map(g => g.label)).toEqual(['All', 'Fresh', 'Pantry', 'Drinks', 'Home', 'Care', 'Other'])
  })

  it('covers all 15 category IDs exactly once across 6 groups', () => {
    const allIds = FILTER_GROUPS.filter(g => g.ids !== null).flatMap(g => g.ids as number[])
    expect(allIds).toHaveLength(15)
    expect(new Set(allIds).size).toBe(15)
    expect([...allIds].sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
  })

  it('maps Fresh correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Fresh')?.ids).toEqual([1, 2, 3, 4])
  })
  it('maps Pantry correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Pantry')?.ids).toEqual([7, 8, 14])
  })
  it('maps Drinks correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Drinks')?.ids).toEqual([5, 12])
  })
  it('maps Home correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Home')?.ids).toEqual([9, 13])
  })
  it('maps Care correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Care')?.ids).toEqual([10, 11])
  })
  it('maps Other correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Other')?.ids).toEqual([6, 15])
  })

  it('filter logic: All matches everything, groups match only their ids', () => {
    const products = [
      { category_id: 1 }, // Fresh
      { category_id: 7 }, // Pantry
      { category_id: 5 }, // Drinks
      { category_id: 9 }, // Home
      { category_id: 10 }, // Care
      { category_id: 6 }, // Other
    ]
    const filterByGroup = (groupLabel: string) => {
      const activeIds = FILTER_GROUPS.find(g => g.label === groupLabel)?.ids
      return products.filter(p => (activeIds ? (activeIds as number[]).includes(p.category_id) : true))
    }
    expect(filterByGroup('All')).toHaveLength(6)
    expect(filterByGroup('Fresh')).toEqual([{ category_id: 1 }])
    expect(filterByGroup('Pantry')).toEqual([{ category_id: 7 }])
    expect(filterByGroup('Drinks')).toEqual([{ category_id: 5 }])
    expect(filterByGroup('Home')).toEqual([{ category_id: 9 }])
    expect(filterByGroup('Care')).toEqual([{ category_id: 10 }])
    expect(filterByGroup('Other')).toEqual([{ category_id: 6 }])
  })

  it('ProductsClient has only one set of category buttons and is single-line horizontally scrollable', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'ProductsClient.tsx'), 'utf8')
    // No CategoryGrid on products page
    expect(src).not.toMatch(/CategoryGrid/)
    expect(src).not.toMatch(/flex flex-wrap/)
    // Must have horizontal scroll single-line constraints
    expect(src).toMatch(/overflow-x-auto/)
    expect(src).toMatch(/flex-nowrap/)
    expect(src).toMatch(/whitespace-nowrap/)
    expect(src).toMatch(/shrink-0/)
    expect(src).toMatch(/scrollbar-none/)
    expect(src).toMatch(/w-full/)
    expect(src).toMatch(/max-w-full/)
    // Must respect page padding — no bleed outside container
    expect(src).not.toMatch(/-mx-4/)
    expect(src).toMatch(/overflow-hidden/)
    // Exactly one tablist
    const tablists = (src.match(/role="tablist"/g) ?? []).length
    expect(tablists).toBe(1)
    // Exactly one pills map over FILTER_GROUPS
    expect(src).toMatch(/FILTER_GROUPS\.map/)
    // Bilateral fade affordance — subtle, not heavy overlay
    expect(src).toMatch(/bg-gradient-to-l/)
    expect(src).toMatch(/bg-gradient-to-r/)
    expect(src).toMatch(/w-6/)
    expect(src).not.toMatch(/w-8 bg-gradient/)
  })

  it('filter scroll fade responds dynamically to scroll position (left/right)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'ProductsClient.tsx'), 'utf8')
    expect(src).toMatch(/canScrollLeft/)
    expect(src).toMatch(/canScrollRight/)
    expect(src).toMatch(/scrollLeft/)
    expect(src).toMatch(/scrollWidth/)
    expect(src).toMatch(/clientWidth/)
    expect(src).toMatch(/ResizeObserver/)
    expect(src).toMatch(/transition-opacity/)
    // Left fade only when scrolled, right fade only when not at end
    expect(src).toMatch(/opacity-100.*opacity-0|opacity-0.*opacity-100/)
  })

  it('ProductsClient respects mobile spacing (reduced top gap)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'ProductsClient.tsx'), 'utf8')
    // Main should have responsive padding, not uniform py-8 which creates large gap on mobile
    expect(src).toMatch(/pt-4/)
    expect(src).toMatch(/sm:pt-6/)
    expect(src).not.toMatch(/className="max-w-7xl mx-auto px-4 py-8"/)
    // Heading and subtext tighter on mobile
    expect(src).toMatch(/text-\[1\.75rem\]/)
    expect(src).toMatch(/mb-1\.5/)
  })
})
