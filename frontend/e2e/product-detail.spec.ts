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

  test('inline CTA morphs into the floating CTA over the related shelf', async ({ page }) => {
    const product = await getFirstProduct(page.request)
    await snapMotion(page)
    await page.goto(`/products/${product.slug}`)

    const inline = page.getByRole('button', { name: 'Add to Cart', exact: true }).first()
    await expect(inline).toBeVisible()

    // Scroll the related shelf fully into view → floating CTA mounts and the
    // inline one morphs away. (scrollIntoViewIfNeeded only nudges the tall
    // section into view; align its top to the viewport so the intersection
    // threshold is decisively crossed.)
    await page.getByLabel('Related products').evaluate((el) =>
      el.scrollIntoView({ block: 'start', behavior: 'instant' })
    )

    const floating = page.getByLabel(`Add ${product.name} to cart`)
    await expect(floating).toBeVisible()
    await expect(inline).toBeHidden()

    // The floating CTA adds the product you are VIEWING and confirms.
    await floating.click()
    await expect(
      page.getByText(new RegExp(`^Added ${escapeRegExp(product.name)}`))
    ).toBeVisible()
    await expect(page.getByLabel(/View cart, 1 item/)).toBeVisible()

    // Scrolling back above the shelf morphs the inline CTA in again.
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(inline).toBeVisible()
    await expect(floating).toBeHidden()
  })
})
