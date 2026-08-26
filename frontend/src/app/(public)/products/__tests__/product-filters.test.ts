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

  it('covers all 15 category slugs exactly once across 6 groups', () => {
    const allSlugs = FILTER_GROUPS.filter(g => (g as any).slugs !== null).flatMap(g => (g as any).slugs as string[])
    expect(allSlugs).toHaveLength(15)
    expect(new Set(allSlugs).size).toBe(15)
    expect([...allSlugs].sort()).toEqual([
      'baby-toddler','bakery','beverages','dairy-eggs','frozen-foods','fruits-vegetables','health-beauty','household','meat-poultry','pantry-staples','pet-supplies','ready-meals-deli','snacks-treats','stationery-school','wines-spirits'
    ].sort())
  })

  it('maps Fresh correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Fresh')?.slugs).toEqual(['fruits-vegetables', 'meat-poultry', 'bakery', 'dairy-eggs'])
  })
  it('maps Pantry correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Pantry')?.slugs).toEqual(['pantry-staples', 'frozen-foods', 'ready-meals-deli'])
  })
  it('maps Drinks correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Drinks')?.slugs).toEqual(['beverages', 'wines-spirits'])
  })
  it('maps Home correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Home')?.slugs).toEqual(['household', 'pet-supplies'])
  })
  it('maps Care correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Care')?.slugs).toEqual(['baby-toddler', 'health-beauty'])
  })
  it('maps Other correctly', () => {
    expect(FILTER_GROUPS.find(g => g.label === 'Other')?.slugs).toEqual(['snacks-treats', 'stationery-school'])
  })

  it('filter logic: All matches everything, groups match only their slugs', () => {
    const products = [
      { category: { slug: 'fruits-vegetables' }, category_id: 1 },
      { category: { slug: 'pantry-staples' }, category_id: 7 },
      { category: { slug: 'beverages' }, category_id: 5 },
      { category: { slug: 'household' }, category_id: 9 },
      { category: { slug: 'baby-toddler' }, category_id: 10 },
      { category: { slug: 'snacks-treats' }, category_id: 6 },
    ]
    const filterByGroup = (groupLabel: string) => {
      const activeSlugs = (FILTER_GROUPS.find(g => g.label === groupLabel) as any)?.slugs
      return products.filter(p => (activeSlugs ? (activeSlugs as string[]).includes(p.category.slug) : true))
    }
    expect(filterByGroup('All')).toHaveLength(6)
    expect(filterByGroup('Fresh')).toEqual([{ category: { slug: 'fruits-vegetables' }, category_id: 1 }])
    expect(filterByGroup('Pantry')).toEqual([{ category: { slug: 'pantry-staples' }, category_id: 7 }])
    expect(filterByGroup('Drinks')).toEqual([{ category: { slug: 'beverages' }, category_id: 5 }])
    expect(filterByGroup('Home')).toEqual([{ category: { slug: 'household' }, category_id: 9 }])
    expect(filterByGroup('Care')).toEqual([{ category: { slug: 'baby-toddler' }, category_id: 10 }])
    expect(filterByGroup('Other')).toEqual([{ category: { slug: 'snacks-treats' }, category_id: 6 }])
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
