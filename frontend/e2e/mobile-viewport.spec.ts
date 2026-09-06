import { test, expect, devices } from '@playwright/test'
import { getFirstProduct } from './helpers'

// Emulate a real iPhone: UA, touch, DPR and viewport — not just a narrow window.
// browserName pinned to chromium (Apple descriptors default to WebKit, which is
// not available in this environment).
test.use({ ...devices['iPhone 14 Pro'], browserName: 'chromium' })

test.describe('Mobile viewport (iPhone 14 Pro, 393×852, touch)', () => {
  test('core pages have no horizontal overflow', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    const routes = [
      '/',
      '/products',
      `/products/${product.slug}`,
      '/cart',
      '/recipes',
      '/about',
    ]

    const offenders: string[] = []
    for (const route of routes) {
      await page.goto(route)
      await page.waitForTimeout(600) // let layout / carousels settle
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }))
      if (scrollWidth > innerWidth + 1) {
        offenders.push(`${route}: scrollWidth ${scrollWidth}px > viewport ${innerWidth}px`)
      }
    }

    expect(offenders, `horizontal overflow detected:\n${offenders.join('\n')}`).toEqual([])
  })

  test('cart is operable end-to-end on touch', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    await page.goto('/products')
    await page.getByLabel(`Add ${product.name} to cart`).first().tap()

    await expect(page.getByLabel(/View cart, 1 item/)).toBeVisible()

    await page.goto('/cart')
    await expect(page.getByText(product.name).first()).toBeVisible()
    await page.getByLabel(`Remove ${product.name} from cart`).tap()
    await expect(page.getByText(product.name)).toHaveCount(0)
  })
})
