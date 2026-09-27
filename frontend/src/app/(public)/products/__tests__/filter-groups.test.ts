import { describe, it, expect } from 'vitest'
import { FILTER_GROUPS } from '../ProductsClient'

// The 15 slugs seeded by backend/database/seeders/CategorySeeder.php.
// FILTER_GROUPS must stay in sync — if admin creates a new category,
// it must belong to a group or the group will look empty (the reported
// "Home will look empty" bug). See docs/critique-2026-09-28-full.md P1.
const SEEDED_SLUGS = [
  'fruits-vegetables',
  'meat-poultry',
  'bakery',
  'dairy-eggs',
  'beverages',
  'snacks-treats',
  'pantry-staples',
  'frozen-foods',
  'household',
  'baby-toddler',
  'health-beauty',
  'wines-spirits',
  'pet-supplies',
  'ready-meals-deli',
  'stationery-school',
] as const

describe('FILTER_GROUPS — stays in sync with seeded categories (STLC: prevents empty group)', () => {
  it('contains only known category slugs', () => {
    const allSlugs = FILTER_GROUPS.flatMap(g => g.slugs ?? [])
    const unknown = allSlugs.filter(s => !(SEEDED_SLUGS as readonly string[]).includes(s))
    expect(unknown, `FILTER_GROUPS references unknown slugs: ${unknown.join(', ')}`).toEqual([])
  })

  it('covers every seeded category (no orphan category)', () => {
    const allSlugs = new Set(FILTER_GROUPS.flatMap(g => g.slugs ?? []))
    const uncovered = (SEEDED_SLUGS as readonly string[]).filter(s => !allSlugs.has(s))
    expect(uncovered, `seeded slugs not in any FILTER_GROUP: ${uncovered.join(', ')}`).toEqual([])
  })

  it('has no duplicate slug across groups', () => {
    const allSlugs = FILTER_GROUPS.flatMap(g => g.slugs ?? [])
    const duplicates = allSlugs.filter((s, i) => allSlugs.indexOf(s) !== i)
    expect(duplicates, `slug appears in multiple groups: ${[...new Set(duplicates)].join(', ')}`).toEqual([])
  })

  it('exposes a helper to find unknown slugs at runtime (for live categories)', async () => {
    // The helper lives next to FILTER_GROUPS so ProductsClient can warn
    // in dev when the live API has a slug the static groups don't know.
    const mod = await import('../ProductsClient')
    expect(typeof (mod as unknown as { findUnknownFilterSlugs?: unknown }).findUnknownFilterSlugs).toBe('function')
    const { findUnknownFilterSlugs } = mod as unknown as { findUnknownFilterSlugs: (groups: typeof FILTER_GROUPS, known: string[]) => string[] }
    expect(findUnknownFilterSlugs(FILTER_GROUPS, [...SEEDED_SLUGS])).toEqual([])
    expect(findUnknownFilterSlugs(FILTER_GROUPS, ['fruits-vegetables'])).toEqual(
      expect.arrayContaining(['meat-poultry']),
    )
    // Unknown slug in live categories should NOT be reported — only unknown in groups
    expect(findUnknownFilterSlugs(FILTER_GROUPS, [...SEEDED_SLUGS, 'new-pet-food'])).toEqual([])
  })
})
