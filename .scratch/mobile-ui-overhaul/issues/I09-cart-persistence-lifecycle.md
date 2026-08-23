# I09 — Cart Persistence + App Lifecycle Integration Test

**What to build:** Cart survives app termination (72h), background/foreground transitions, and restores on boot. Uses `storage` + `useCart` store.

**Blocked by:** 06c, 06g, 08d, I03

**Status:** ready-for-agent

- [ ] Add to cart → `useCart` items persist to `AsyncStorage` (via `storage.set`) immediately
- [ ] App background → `AppState.addEventListener('change')` → `storage.set(STORAGE_KEYS.cart, items)` (72h TTL)
- [ ] App foreground → rehydrate cart from storage if `status !== 'authenticated'` (guest cart)
- [ ] Authenticated user → cart syncs to backend via `syncCart` API on sign in (existing `model.ts`)
- [ ] Cart badge on `CustomerTabs` reflects persisted count on cold start
- [ ] Expired cart (>72h) → cleared, shows empty state
- [ ] Test: add items → kill app → cold start → badge shows count, items render

**Notes:** Reference `mobile/src/features/cart/store.ts`, `model.ts`, `mobile/src/lib/storage.ts`, `mobile/src/stores/deliveryStore.ts`. MOBILE_APP_UX.md: "persist cart on app pause (the example's 72h-save pattern)". Critical for conversion — abandoned carts recover.