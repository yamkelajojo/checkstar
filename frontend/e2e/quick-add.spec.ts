import { test, expect } from '@playwright/test'
import { escapeRegExp, getFirstProduct, snapMotion } from './helpers'

test.describe('Quick add to cart', () => {
  test('adding from a product card fires toast + badge', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    await snapMotion(page)
    await page.goto('/products')

    await page.getByLabel(`Add ${product.name} to cart`).first().click()

    await expect(
      page.getByText(new RegExp(`^Added ${escapeRegExp(product.name)}`))
    ).toBeVisible()
    await expect(page.getByLabel(/View cart, 1 item/)).toBeVisible()
  })

  test('cart contents survive a page reload', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    await snapMotion(page)
    await page.goto('/products')
    await page.getByLabel(`Add ${product.name} to cart`).first().click()
    await expect(page.getByLabel(/View cart, 1 item/)).toBeVisible()

    await page.reload()

    await expect(page.getByLabel(/View cart, 1 item/)).toBeVisible()
  })
})
