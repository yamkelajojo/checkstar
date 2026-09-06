import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('desktop header nav reaches the products page', async ({ page }) => {
    await page.goto('/')
    // Scope to the header nav — the footer repeats the same links.
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'Products', exact: true })
      .click()
    await expect(page).toHaveURL(/\/products/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
