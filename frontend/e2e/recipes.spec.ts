import { test, expect } from '@playwright/test'
import { escapeRegExp, getFirstRecipe, snapMotion } from './helpers'

test.describe('Recipe detail', () => {
  test('About popover flow: trigger, add to cart, toast + badge', async ({ page }) => {
    const recipe = await getFirstRecipe(page.request)
    await snapMotion(page)
    await page.goto(`/recipes/${recipe.slug}`)

    // Every ingredient exposes an "About {product}" popover trigger — the
    // trigger is named after the ingredient PRODUCT, not the recipe title.
    const aboutTrigger = page.getByRole('button', { name: /^About / }).first()
    await aboutTrigger.click()
    const productName = (await aboutTrigger.getAttribute('aria-label'))?.replace(/^About /, '')
    expect(productName, 'About trigger must expose the product name').toBeTruthy()

    // The popover exposes an add button for that product.
    const addInPopover = page.getByLabel(`Add ${productName} to cart`).last()
    await expect(addInPopover).toBeVisible()
    await addInPopover.click()

    await expect(
      page.getByText(new RegExp(`^Added ${escapeRegExp(productName!)}`))
    ).toBeVisible()
    await expect(page.getByLabel(/View cart, 1 item/)).toBeVisible()
  })
})
