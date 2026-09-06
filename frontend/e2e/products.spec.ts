import { test, expect } from '@playwright/test'
import { escapeRegExp, getFirstProduct } from './helpers'

test.describe('Products listing', () => {
  test('lists products returned by the API', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    await page.goto('/products')
    await expect(
      page
        .getByRole('link', { name: new RegExp(escapeRegExp(product.name)) })
        .first()
    ).toBeVisible()
  })

  test('grid exposes multiple product links', async ({ page }) => {
    await page.goto('/products')
    const cards = page.locator('a[href^="/products/"]')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThanOrEqual(4)
  })
})
