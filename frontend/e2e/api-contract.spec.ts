import { test, expect } from '@playwright/test'

/**
 * Integration suite: the frontend↔API contract as served through the
 * site's own /api proxy (frontend → backend), not mocked at the test layer.
 */
test.describe('API contract (via site proxy)', () => {
  test('GET /api/products returns a paginated list with the product shape', async ({ request }) => {
    const res = await request.get('/api/products')
    expect(res.ok()).toBeTruthy()

    const body = await res.json()
    expect(body.current_page).toBe(1)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)

    const product = body.data[0]
    for (const key of ['id', 'name', 'slug', 'price']) {
      expect(product, `product must expose "${key}"`).toHaveProperty(key)
    }
    expect(Number.isFinite(Number(product.price))).toBe(true)
  })

  test('GET /api/categories and /api/recipes return non-empty lists', async ({ request }) => {
    const categories = await request.get('/api/categories')
    expect(categories.ok()).toBeTruthy()
    expect((await categories.json()).data.length).toBeGreaterThan(0)

    const recipes = await request.get('/api/recipes')
    expect(recipes.ok()).toBeTruthy()
    expect((await recipes.json()).data.length).toBeGreaterThan(0)
  })

  test('GET /api/recipes/:slug resolves a single recipe', async ({ request }) => {
    const list = (await (await request.get('/api/recipes')).json()).data
    const slug = list[0].slug

    const res = await request.get(`/api/recipes/${slug}`)
    expect(res.ok()).toBeTruthy()
    const recipe = await res.json()
    expect(String(recipe.slug ?? recipe.data?.slug)).toContain(slug)
  })

  test('GET /api/products/trending returns featured products', async ({ request }) => {
    const res = await request.get('/api/products/trending')
    expect(res.ok()).toBeTruthy()
    expect(Array.isArray((await res.json()).data)).toBe(true)
  })
})
