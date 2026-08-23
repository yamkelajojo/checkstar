# 16 — Checkout + Order Detail + Order Placed Screens Overhaul

**What to build:** Checkout flow (`CheckoutScreen.tsx` modal) → address entry → place order → `OrderPlacedScreen.tsx` → `OrderDetailScreen.tsx`. Real dispatch integration, status timeline.

**Blocked by:** 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 08-port-greenbidder-utils, 09-replace-lucide-icons, 12-cart-tab-overhaul

**Status:** ready-for-agent

- [ ] Checkout: address autocomplete (or manual entry), delivery notes, payment method (cash on delivery), min-order validation, `Button` disabled until valid
- [ ] Place order → `placeOrder` API → navigate to `OrderPlacedScreen` (success animation, order number, ETA)
- [ ] OrderPlaced: `AnimatedLogo` stacked, order summary, "Track order" CTA → `OrderDetailScreen`
- [ ] OrderDetail: status timeline (pending → confirmed → preparing → out_for_delivery → delivered), rider info when assigned, items list, delivery map placeholder
- [ ] Status colors: semantic tokens (`warning`, `info`, `primary`, `success`)
- [ ] Real-time: poll `fetchOrder` or WebSocket for status updates
- [ ] Cancel action: `cancelOrder` API (available until `out_for_delivery`)
- [ ] TalkBack: timeline announced as live region on status change

**Notes:** Reference `mobile/src/features/checkout/CheckoutScreen.tsx`, `mobile/src/features/orders/OrderPlacedScreen.tsx`, `OrderDetailScreen.tsx`, `model.ts`. GreenBidder `src/screens/buyer/CheckoutScreen.jsx`, `OrderDetailScreen.jsx`. MOBILE_APP_UX.md: Flutter Checkout stub → real dispatch flow.