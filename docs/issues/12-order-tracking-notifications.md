## What to build

Live order tracking and post-delivery flows: order detail with the status timeline, polling, local status notifications with deep-nav, delivery confirmation, cancellation, and the Rider review card.

## Acceptance criteria

- [ ] Order detail: status timeline `pending → confirmed → preparing → out_for_delivery → delivered` updating in place; shows the **real fulfilling Store** (set by OrderClaim), not the aspirational chosen Store.
- [ ] Polling via TanStack Query `refetchInterval`: ~20s while active, ~10s during `out_for_delivery`, stops on terminal status.
- [ ] Local notifications (`expo-notifications`) on detected status changes, each carrying `data: { orderId }`; `lib/notifications` bridge subscribes to taps at boot **and** checks `getLastNotificationResponse()` for cold-start taps; resolves the route per role via a module-level navigation ref; OrderDetail reuses the existing query key so a tap never double-fetches.
- [ ] Delivery confirmation: Customer confirms receipt → Order `delivered` + Payment `paid` atomically (existing DeliveryConfirmation path); success haptic + toast.
- [ ] Cancel: button while `status` ∈ {pending, confirmed, preparing} — **not** surfaced at `out_for_delivery`; 32px confirm sheet with warning haptic, optional reason chips ("Changed my mind" / "Found elsewhere" / "Order is late") mapped to the `reason` field; on success status shows `cancelled` in place, glass toast "Order cancelled", reason lands in the Order Activity Log.
- [ ] Review: inline card in Order detail when `status === delivered` && no review yet; 5 amber stars (`selection` haptic per tap) + optional comment (max 500, enforced); `POST /orders/{id}/review`; on success card collapses to "Thanks — your Rider's rating is updated" with `success` haptic.
- [ ] Order history list (Account) sorted by date, tapping into Order detail; `EmptyState` ("No orders yet") when empty.

## Blocked by

- Blocked by Slice 11 (checkout + COD + order placed)
