# 02 — Browse Products

**What to build:** The homepage shows an animated category grid. Clicking a category navigates to a product listing page with cards for each product (name, price, unit, image). Clicking a product shows its detail page with full description, price, unit, and an Add to Basket button. Stock shows as available/unavailable per the first store's inventory.

**Blocked by:** 00 — Scaffold Monorepo

**Status:** ready-for-agent

- [ ] `categories`, `products`, `store_product` table migrations + Eloquent models
- [ ] Seeders: 13 categories with icons/images, ~50 products with varied units (each, kg, 2L), inventory across 3 stores
- [ ] `GET /api/categories` with product counts
- [ ] `GET /api/products?category=X` with pagination
- [ ] `GET /api/products/:id` with full detail
- [ ] Homepage category grid (motion staggered entrance)
- [ ] Product listing page with filtered grid
- [ ] Product detail page with description, price, unit, image, Add to Basket button
- [ ] Vitest API tests + component tests
