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

  test('Also In-Store carousel shows distinct brand logos and cycles them', async ({ page }) => {
    await page.goto('/')
    const section = page.getByLabel('Also in store')
    await expect(section).toBeVisible()
    await expect(section.getByText('Airtime, data & bill payments')).toBeVisible()

    const visibleNames = () =>
      section.locator('svg[role="img"] text').evaluateAll((els) =>
        els.map((el) => (el.textContent ?? '').trim()).filter(Boolean)
      )

    await expect(section.locator('svg[role="img"]').first()).toBeVisible()
    const first = await visibleNames()
    expect(first.length).toBeGreaterThanOrEqual(2)
    // No brand may appear twice on screen at the same instant.
    expect(new Set(first).size).toBe(first.length)

    // The carousel must actually cycle within one brand period (2s) + margin.
    await page.waitForTimeout(3200)
    const second = await visibleNames()
    expect(second.join('|')).not.toBe(first.join('|'))
    expect(new Set(second).size).toBe(second.length)
  })
})
