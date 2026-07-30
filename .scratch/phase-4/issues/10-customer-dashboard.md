# 10 — Customer Dashboard

**What to build:** A logged-in Customer has a dashboard showing their order history (filterable, sortable by date), active order with a real-time status timeline, ability to cancel pending orders, and a product search bar. Dashboard links to their profile editing page.

**Blocked by:** 03 — Customer Auth, 07 — Place an Order

**Status:** ready-for-agent

- [ ] Dashboard page — order history list with filters
- [ ] Active order card with status timeline (from order_activity_logs)
- [ ] Cancel order UI (only if `pending`)
- [ ] Product search (SQL LIKE on name/tags)
- [ ] Search results page with product cards
- [ ] Vitest API tests + Playwright e2e
