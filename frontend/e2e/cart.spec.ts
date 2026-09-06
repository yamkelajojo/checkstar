import { test, expect } from '@playwright/test'
import { getFirstProduct, money, num, snapMotion } from './helpers'

test.describe('Cart', () => {
  test('quantity stepper updates line totals and subtotal', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    const unit = num(product.price)

    await snapMotion(page)
    await page.goto('/products')
    await page.getByLabel(`Add ${product.name} to cart`).first().click()
    await page.goto('/cart')

    await expect(page.getByText(product.name).first()).toBeVisible()

    await page.getByLabel(`Increase quantity of ${product.name}`).click()

    const doubled = money(unit * 2)
    await expect(page.getByText(doubled).first()).toBeVisible()
  })

  test('removing a line item empties it from the cart', async ({ page }) => {
    const product = await getFirstProduct(page.request)

    await snapMotion(page)
    await page.goto('/products')
    await page.getByLabel(`Add ${product.name} to cart`).first().click()
    await page.goto('/cart')
    await expect(page.getByText(product.name).first()).toBeVisible()

    await page.getByLabel(`Remove ${product.name} from cart`).click()

    await expect(page.getByText(product.name)).toHaveCount(0)
  })
})
