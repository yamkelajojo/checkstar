# 05 — Specials & Promotions

**What to build:** The visitor sees a specials page with time-bound collection banners (e.g. "Winter Warmers" with a themed image and date range). Below each banner, the associated products are shown. Products that have their own `sale_price` show that price regardless of collection membership. Product-level `sale_price` takes priority over collection-based pricing.

**Blocked by:** 02 — Browse Products

**Status:** ready-for-agent

- [ ] `specials` table migration (name, slug, description, banner_image, type: collection/product_collection, date range)
- [ ] `product_special` pivot migration
- [ ] `products.sale_price` column (nullable decimal, used if set)
- [ ] Seeders with 2-3 active collection specials + products with sale_prices
- [ ] `GET /api/specials` returning collections with their products + correct resolved price
- [ ] `GET /api/products?on_special=true` filter
- [ ] Specials page with animated collection banners + product grid
- [ ] PricingService unit tests verifying sale_price > collection priority
- [ ] Vitest API tests
