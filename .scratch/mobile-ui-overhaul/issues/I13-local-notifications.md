# I13 — Local Notifications on Status Change Integration Test

**What to build:** When order status changes (polled in `OrderDetailScreen`), schedule a local notification via `expo-notifications`. Tapping notification deep-links to OrderDetail with `fromNotification: true`.

**Seam Under Test:** `OrderDetailScreen` useEffect status change detection → `Notifications.scheduleNotificationAsync` → deep link handling (I08)

**Blocked by:** I06, 08a, 17d, I08

**Status:** ready-for-agent

- [ ] Status change detection: `useEffect` watches `order.status` → when `previous !== current` and `previous != null`
- [ ] Notification content: title from `copy.orders.updateTitle`, body from `orderUpdateBody(newStatus)`, data `{ orderId }`
- [ ] Trigger: `null` (immediate)
- [ ] Permission: `Notifications.getPermissionsAsync()` → request if needed (graceful if denied)
- [ ] Deep link: notification tap → `checkstar://order/{orderId}` → `OrderDetailScreen` with `fromNotification: true`
- [ ] `fromNotification` prop: shows "Opened from notification" banner, auto-scrolls to timeline
- [ ] Test: mock `Notifications.scheduleNotificationAsync`, advance order status via mock API → verify call

**Notes:** Reference `mobile/src/features/orders/OrderDetailScreen.tsx:64-82` (useEffect), `mobile/src/features/orders/model.ts` (orderUpdateBody), `mobile/app.json:scheme`. Requires dev build for full push — local notifications work in Expo Go.