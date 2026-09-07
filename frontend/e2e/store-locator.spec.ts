import { test, expect } from '@playwright/test'
import { snapMotion } from './helpers'

/**
 * Store locator map — every public map use case:
 *  - /stores: all stores get a branded Checkstar pin with a working popup
 *  - /stores/[slug]: the store's own detail map pins just that store
 *
 * Tile imagery may be unavailable in locked-down environments (the map
 * degrades to a notice); pins, popups and controls must work regardless,
 * so this spec never depends on raster tiles loading.
 */

async function getStores(request: import('@playwright/test').APIRequestContext) {
  const res = await request.get('/api/stores')
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  const stores: Array<{ id: number; name: string; slug: string; address: string; city: string }> = body.data.filter(
    (s: { is_active?: boolean }) => s.is_active !== false
  )
  expect(stores.length).toBeGreaterThan(0)
  return stores
}

test.describe('Store locator map', () => {
  test('locator renders one branded pin per store with a working popup', async ({ page }) => {
    const stores = await getStores(page.request)
    await snapMotion(page)
    await page.goto('/stores')

    // Leaflet booted
    await expect(page.locator('.MapContainer.leaflet-container').first()).toBeVisible({ timeout: 30_000 })

    // One branded pin per active store — never a default blue marker
    await expect(page.locator('.checkstar-map-pin')).toHaveCount(stores.length, { timeout: 20_000 })

    // Pin anatomy: brand-orange teardrop, navy locator badge, white star
    const svg = page.locator('.checkstar-map-pin svg').first()
    await expect(svg.locator('path').first()).toHaveAttribute('fill', '#EB6522')
    await expect(svg.locator('circle')).toHaveAttribute('fill', '#262D3A')
    await expect(svg.locator('g path')).toHaveAttribute('fill', '#ffffff')

    // Popup interaction: clicking a pin names that store
    await page.locator('.checkstar-map-pin').first().click()
    const popup = page.locator('.leaflet-popup-content')
    await expect(popup).toBeVisible()
    await expect(popup).toContainText(stores[0].name)
  })

  test('store detail map pins exactly that store', async ({ page }) => {
    const stores = await getStores(page.request)
    const store = stores[0]
    await snapMotion(page)
    await page.goto(`/stores/${store.slug}`)

    await expect(page.locator('.checkstar-map-pin')).toHaveCount(1, { timeout: 20_000 })
    await page.locator('.checkstar-map-pin').first().click()
    const popup = page.locator('.leaflet-popup-content')
    await expect(popup).toBeVisible()
    await expect(popup).toContainText(store.name)
  })

  test('pins stay interactive even when tile imagery is unavailable', async ({ page }) => {
    // In environments where tile hosts are blocked the map shows its
    // degraded notice — pins and popups must still work above it.
    await snapMotion(page)
    await page.goto('/stores')

    await expect(page.locator('.checkstar-map-pin').first()).toBeVisible({ timeout: 30_000 })
    await page.locator('.checkstar-map-pin').first().click()
    await expect(page.locator('.leaflet-popup-content')).toBeVisible()

    // If the degradation notice is present it names the condition honestly
    const notice = page.getByRole('status').getByText(/Map unavailable/)
    if (await notice.count()) {
      await expect(notice).toBeVisible()
    }
  })
})
