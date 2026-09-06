import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test('renders the hero and header chrome', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByLabel(/^View cart/)).toBeVisible()
  })

  test('surfaces shoppable products on the landing page', async ({ page }) => {
    await page.goto('/')
    const productLinks = page.locator('a[href^="/products/"]')
    await expect(productLinks.first()).toBeVisible()
  })
})
