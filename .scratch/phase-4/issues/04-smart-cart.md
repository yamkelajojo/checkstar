# 04 — Smart Cart

**What to build:** Any visitor (guest or logged-in) can add products to a cart. For guests, the cart persists in localStorage via Zustand persist middleware. On login, the guest cart is synced to the server and merged with any existing server-side cart. The cart UI shows items with quantities, line totals, subtotal, and delivery fee. Items can be removed or quantities adjusted.

**Blocked by:** 02 — Browse Products, 03 — Customer Auth

**Status:** ready-for-agent

- [ ] Zustand cart store with persist middleware (localStorage for guests)
- [ ] Cart UI — drawer or page: item list with qty controls, subtotal, delivery fee
- [ ] Add to Basket button wired on product detail page (from 02)
- [ ] Login sync — guest cart sent to server and merged on login
- [ ] Server-side cart model + migration (`carts` / `cart_items`)
- [ ] Cart sync API endpoint
- [ ] Quantity increment/decrement animations (motion spring)
- [ ] Vitest store tests + cart sync integration test
