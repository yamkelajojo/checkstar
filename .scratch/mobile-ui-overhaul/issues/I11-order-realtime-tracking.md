# I11 — Order Real-time Status Tracking Integration Test

**What to build:** `OrderDetailScreen` polls for status updates (or WebSocket) → timeline animates on status change. Rider assignment shows rider info.

**Blocked by:** I06, 07a, 08a, 17d

**Status:** ready-for-agent

- [ ] Polling: `useQuery` with `refetchInterval: 15000` (15s) for `fetchOrder` when status ∈ {confirmed, preparing, out_for_delivery}
- [ ] Status change detection: `useEffect` watches `data.status` → triggers `springs.bouncy` animation on timeline step
- [ ] Timeline: vertical steps (pending → confirmed → preparing → out_for_delivery → delivered), active step highlighted `primary`, completed `success`, current `primary` with pulse
- [ ] Rider info: when status = `out_for_delivery`, show rider name, photo, rating, phone (masked), vehicle
- [ ] Map placeholder: static map image with rider/customer pins (deferred: real map SDK)
- [ ] Push notification → deep link (I08) → opens OrderDetail with `fromNotification: true` → auto-scrolls to timeline
- [ ] Cancel button: available until `out_for_delivery` → `cancelOrder` API → `Toast` confirmation → status = `cancelled`
- [ ] Test: mock API returns advancing statuses → timeline animates each step

**Notes:** Reference `mobile/src/features/orders/OrderDetailScreen.tsx`, `mobile/src/features/orders/model.ts`, `mobile/src/lib/apiClient.ts:128-161` (fetchOrder, confirmDelivery, cancelOrder). Critical for delivery transparency.