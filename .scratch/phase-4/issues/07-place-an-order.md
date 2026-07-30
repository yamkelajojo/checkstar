# 07 — Place an Order

**What to build:** A logged-in Customer checks out from their cart — enters delivery address and optional notes — and places the order. The order is created with status `pending` and payment `pending`. The Customer sees an order confirmation page with the order number and a summary. The Customer can view their order history sorted by date.

**Blocked by:** 03 — Customer Auth, 04 — Smart Cart

**Status:** ready-for-agent

- [ ] `orders` table migration (customer_id, store_id, status, payment_status, delivery_address, delivery_notes, subtotal, delivery_fee, total)
- [ ] `order_items` table migration (snapshot of product data + price at time of order)
- [ ] `order_activity_logs` table migration (append-only audit)
- [ ] Place order API — validates cart, creates order + items + activity log, clears cart
- [ ] `GET /api/orders` — list Customer's orders sorted by date
- [ ] `GET /api/orders/:id` — order detail with items
- [ ] Checkout page — address form, order summary, place order button
- [ ] Order confirmation page — order number, status, item summary
- [ ] Order history page — list of past orders
- [ ] Cancel order API + UI button (only if status is `pending`)
- [ ] Vitest API tests + Playwright e2e (add items → checkout → confirmation)
