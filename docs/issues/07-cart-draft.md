## What to build

The local cart draft: cart zustand store with 72h+ persistence and badge count, the Cart screen, product-card steppers wired to the real store, and unit tests for the cart rules. Guest-first — no server cart yet (that's Slice 10).

## Acceptance criteria

- [ ] `stores/cart` zustand store: add, increment/decrement stepper, remove; persisted to `@react-native-async-storage/async-storage` (72h+ pattern); badge count reads from the store.
- [ ] Product-card inline steppers (from Slice 4) now drive the real cart store; haptic `tap` on add/remove.
- [ ] Cart screen: item rows with `FadeSlideIn` entrances, tap row → product detail, steppers, running subtotal, free-delivery threshold banner, min-order nudge, cart-persist trust note, Checkout button enabled/disabled by cart validity (non-empty + ≥ minimum).
- [ ] jest-expo unit tests for cart rules: add/stepper/remove, persistence round-trip, merge-on-sync, store-switch revalidation (flag + remove) — the pure rules isolated from UI.
- [ ] No server cart dependency; guest cart survives app restart.

## Blocked by

- Blocked by Slice 4 (guest catalog browse)
