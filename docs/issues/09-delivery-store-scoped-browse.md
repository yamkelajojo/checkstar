## What to build

Delivery-Store resolution and store-scoped browsing: additive `?store_id=` backend scoping, nearest-Store pick via `expo-location`, the Store picker, Home header override, persistence, and store-switch cart revalidation. The chosen Store is an aspirational browse filter only — the Order timeline shows the real fulfilling Store (no order-intake change).

## Acceptance criteria

- [ ] **Additive backend:** optional `?store_id=` on public `/products` (+ categories/specials) scopes to `store_product` availability (excludes `is_available=false` / zero-stock); requests without `store_id` behave exactly as today.
- [ ] On first Home: `expo-location` picks the nearest Store within its `delivery_radius_km`; permission decline → Store picker.
- [ ] Home header shows the chosen Store with a manual override (picker); choice persisted across sessions.
- [ ] Browse, search (Slice 6), and catalog requests now pass `?store_id=`; cart/checkout use the chosen Store's `store_product_id`s.
- [ ] Store-switch revalidation: items unavailable at the new Store are flagged and removed only behind a confirm sheet — never silently; the pure revalidation rules (from Slice 7 tests) drive this and are covered by unit tests.
- [ ] Zero backend change to order intake — no `aspirational_store_id`, no per-Store pricing (pricing stays product-global per the verified schema).

## Blocked by

- Blocked by Slice 4 (guest catalog browse)
- Blocked by Slice 7 (cart draft)
