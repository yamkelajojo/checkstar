import { test, expect, devices } from '@playwright/test'

// Emulate a real iPhone for the hamburger-menu journey. Pin browserName to
// chromium: Apple device descriptors default to WebKit (defaultBrowserType:
// 'webkit'), which is not available here.
test.use({ ...devices['iPhone 14 Pro'], browserName: 'chromium' })

test.describe('Navigation — mobile', () => {
  test('hamburger menu opens and navigates', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Open menu').click()
    const menu = page.getByLabel('Navigation menu')
    await expect(menu).toBeVisible()

    await menu.getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/\/products/)
  })
})
