import { expect, type APIRequestContext } from '@playwright/test'
import { formatZar } from '../src/lib/money'

/** Escape a string for safe inclusion in a RegExp. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface MockProduct {
  id: number
  name: string
  slug: string
  price: number | string
}

export interface MockRecipe {
  id: number
  title: string
  slug: string
}

/**
 * Fetch a real product straight from the API the site itself consumes
 * (via the Next.js /api proxy) so tests never hardcode seed data.
 */
export async function getFirstProduct(request: APIRequestContext): Promise<MockProduct> {
  const res = await request.get('/api/products')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  const list: MockProduct[] = body.data
  expect(list.length).toBeGreaterThan(0)
  return list[0]
}

export async function getFirstRecipe(request: APIRequestContext): Promise<MockRecipe> {
  const res = await request.get('/api/recipes')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  const list: MockRecipe[] = body.data
  expect(list.length).toBeGreaterThan(0)
  return list[0]
}

export function num(value: number | string): number {
  return Number(value)
}

/** Site money format — single-sourced from the app's own formatter so the
 * E2E suite can never drift from `formatZar` ("R 12.99", space grouping). */
export function money(value: number): string {
  return formatZar(value)
}

/**
 * Snap framer-motion animations (odometer, springs, toasts) to their final
 * values so text assertions are deterministic.
 */
export async function snapMotion(page: import('@playwright/test').Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' })
}
