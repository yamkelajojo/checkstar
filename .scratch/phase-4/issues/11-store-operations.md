# 11 — Store Operations

**What to build:** Three staff roles get operational dashboards:
- **Store Manager:** Views orders for their store, updates status manually, checks stock levels, toggles product availability, views order activity logs, views staff list.
- **Logistics Officer:** Monitors orders across all stores, manually dispatches an order to a specific Rider, reassigns orders, views dispatch algorithm performance metrics.
- **Store Owner:** Manages store settings (name, address, hours, delivery radius), hires/fires store staff (Store Managers + Logistics Officers).

**Blocked by:** 03 — Customer Auth, 02 — Browse Products, 07 — Place an Order

**Status:** ready-for-agent

- [ ] `store_staff` table migration + role-based middleware
- [ ] API endpoints for Store Manager: list store orders, update order status, view stock, toggle product availability, view activity logs
- [ ] API endpoints for Logistics Officer: monitor all orders, manual dispatch, reassign, algorithm metrics
- [ ] API endpoints for Store Owner: update store settings, manage staff CRUD
- [ ] UI dashboards for each role (tabbed or per-role route)
- [ ] Vitest API tests (role gating + CRUD) + Playwright e2e per role
