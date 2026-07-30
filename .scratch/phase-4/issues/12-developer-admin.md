# 12 — Developer Admin

**What to build:** A Developer gets full CRUD on every entity: products (with bulk operations), categories (with icons/sort order), specials (with date ranges and product assignments), recipes (structured ingredients + method), community posts (gallery + CSR), career listings, contact messages, users, riders, and stores. A system health page shows cache status and queue metrics.

**Blocked by:** 02 — Browse Products, 05 — Specials & Promotions, 09 — Dispatch & Delivery, 11 — Store Operations

**Status:** ready-for-agent

- [ ] Admin panel layout (sidebar navigation, breadcrumbs)
- [ ] Product CRUD with bulk operations (edit price, toggle visibility)
- [ ] Category CRUD with icon/image upload and sort order
- [ ] Specials CRUD with date pickers and product multi-select
- [ ] Recipes CRUD (structured JSON ingredients + method)
- [ ] Community posts CRUD (gallery images + CSR content)
- [ ] Career listings CRUD
- [ ] Contact messages inbox with reply
- [ ] Users/Riders/Stores CRUD
- [ ] System health page — DB connection, cache status, queue length
- [ ] Vitest API tests + Playwright e2e for each admin section
