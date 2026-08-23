# 12 — Cart Tab UI Overhaul

**What to build:** Cart screen (`CartScreen.tsx`) with item list, inline steppers, swipe-to-remove, sticky bottom bar with subtotal, min-order nudge, checkout CTA. Cart persists 72h (existing). Live badge count on tab bar.

**Blocked by:** 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 08-port-greenbidder-utils, 09-replace-lucide-icons

**Status:** ready-for-agent

- [ ] Item rows: `ProductCard` compact variant, inline `Stepper` (+/−), line total (`formatZar`), swipe-to-delete
- [ ] Sticky bottom: subtotal, free-delivery progress bar, min-order nudge (disabled checkout until met)
- [ ] Checkout button: enabled only when min-order met + items exist; navigates to CheckoutScreen (modal)
- [ ] Empty state: `EmptyState` with "Your cart is empty" + CTA to browse
- [ ] Cart badge on tab bar: live count from `useCart` store (existing, verify styling)
- [ ] Persistence: 72h save on app pause (existing `cartRules`, verify)
- [ ] All tokens from Tamagui config; `Stepper` uses `springs.press`
- [ ] TalkBack: stepper announces quantity, remove announces deletion

**Notes:** Reference `mobile/src/features/cart/CartScreen.tsx`, `CartScreen.test.tsx`, `store.ts`, `model.ts`. GreenBidder `src/screens/buyer/CartScreen.jsx` for patterns. MOBILE_APP_UX.md: Flutter Cart → Cart (sticky bottom, min-order nudge, real checkout).