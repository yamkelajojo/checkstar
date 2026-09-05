import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The public layout already renders the page's <main> landmark (motion.main).
 * Every page-level <main> inside src/app/(public) duplicates that landmark,
 * which breaks screen-reader main-region navigation on 100% of shopping
 * pages (found by the impeccable critique: 2 mains on 11/11 routes).
 * This pins the one-landmark convention structurally.
 */
function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (p.endsWith('.tsx') && !p.includes('__tests__')) out.push(p)
  }
  return out
}

const PUBLIC_DIR = join(__dirname, '..')

describe('public routes render exactly one <main> landmark', () => {
  it('no page component under src/app/(public) declares its own <main>', () => {
    const offenders = walk(PUBLIC_DIR).filter((f) => /<main(\s|>)/.test(readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })

  it('the layout still provides the single <main>', () => {
    const layout = readFileSync(join(PUBLIC_DIR, 'layout.tsx'), 'utf8')
    expect(layout).toContain('<motion.main')
  })
})
