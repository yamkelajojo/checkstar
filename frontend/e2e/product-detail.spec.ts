import { test, expect } from '@playwright/test'
import { escapeRegExp, getFirstProduct, money, num, snapMotion } from './helpers'

test.describe('Product detail', () => {
  test('renders name, price and the related-products shelf', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    await snapMotion(page)
    await page.goto(`/products/${product.slug}`)

    await expect(
      page.getByRole('heading', { level: 1, name: new RegExp(escapeRegExp(product.name)) })
    ).toBeVisible()
    await expect(page.getByText(money(num(product.price))).first()).toBeVisible()
    await expect(page.getByLabel('Related products')).toBeVisible()
  })

  test('add to cart from the detail page fires toast + badge', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    await snapMotion(page)
    await page.goto(`/products/${product.slug}`)

    // The main buy-box CTA is labelled "Add to Cart" (the aria-labelled
    // variant is the floating CTA that only mounts once the related shelf
    // scrolls into view).
    await page.getByRole('button', { name: 'Add to Cart', exact: true }).first().click()

    await expect(
      page.getByText(new RegExp(`^Added ${escapeRegExp(product.name)}`))
    ).toBeVisible()
    await expect(page.getByLabel(/View cart, 1 item/)).toBeVisible()
  })
})
