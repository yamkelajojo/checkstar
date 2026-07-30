# 09 — Dispatch & Delivery

**What to build:** When an Order reaches `confirmed` status, the DispatchService begins: it finds the nearest Store with an available Rider using Haversine proximity, falls back to the next-nearest if no Rider claims within the retry window, and cancels the Order if all Stores are exhausted. Riders can claim available orders atomically (`FOR UPDATE SKIP LOCKED`) — only the first claim wins. The claimed Rider progresses the order through `preparing → out_for_delivery → delivered`, marking items as bought at the store step. On delivery, the Customer confirms receipt and rates the Rider (1-5 stars + text). Every state transition is recorded in the Order Activity Log. Redis backs the dispatch retry queue.

**Blocked by:** 07 — Place an Order, 08 — Rider Onboarding & Dashboard

**Status:** ready-for-agent

- [ ] DispatchService — Haversine proximity, store failover config, retry scheduling
- [ ] Atomic Rider claim — `FOR UPDATE SKIP LOCKED` query
- [ ] Order status flow: confirmed → preparing → out_for_delivery → delivered
- [ ] Rider actions: claim, mark items bought, mark out for delivery, mark delivered
- [ ] Customer delivery confirmation + rating (reviews table)
- [ ] Auto-cancel when all stores exhausted
- [ ] Redis queue config for retry backpressure
- [ ] Customer order tracking timeline (from activity logs)
- [ ] Full Playwright e2e: place order → auto-dispatch → Rider claims → delivers → confirm
- [ ] Vitest unit tests for DispatchService + atomic claim logic
