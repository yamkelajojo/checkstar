## What to build

Guest → server cart merge on sign-in: additive `/cart/sync` backend support (writes the delivery Store's `store_product_id`), the merge flow on login, and server-authoritative cart for signed-in Customers.

## Acceptance criteria

- [ ] **Additive backend:** `/cart/sync` also writes the delivery Store's `store_product_id` for each item (existing sync behavior preserved for web).
- [ ] On sign-in: guest cart draft merges into the server cart via `/cart/sync`; merge resolves conflicts (server cart authoritative) without losing guest items; stale/duplicate items cleaned up.
- [ ] After merge, the server cart is authoritative for the signed-in Customer; cart reads go through the server.
- [ ] Checkout refetches the server cart on focus so the merged cart shows in place (choreography with Slice 11).
- [ ] Merge logic unit-tested: conflict resolution, stale cleanup, store-product id mapping.

## Blocked by

- Blocked by Slice 7 (cart draft)
- Blocked by Slice 8 (auth)
- Blocked by Slice 9 (delivery-store + store-scoped browse)
