# I08 — Deep Linking + Notification Handling Integration Test

**What to build:** App handles `checkstar://` scheme and push notification taps → navigates to correct screen with params. Works from cold start and background.

**Blocked by:** 05b, I06, 17d (logo for splash)

**Status:** ready-for-agent

- [ ] URL scheme: `checkstar://order/123` → `OrderDetail` screen with `orderId: 123`, `fromNotification: true`
- [ ] Universal Links / App Links configured (iOS Associated Domains, Android Asset Links) — deferred to dev build
- [ ] Cold start: `Linking.getInitialURL()` in `RootNavigator`/`App.tsx` → parses → navigates after auth check
- [ ] Background: `Linking.addEventListener('url', handler)` → navigates if authenticated, queues if not
- [ ] Push notification payload: `{ orderId, type: 'status_update' }` → same deep link handling
- [ ] `fromNotification` prop on `OrderDetailScreen` → shows "Opened from notification" banner, auto-refreshes status
- [ ] Auth gate: if deep link requires auth and user is guest → redirect to Auth with `intent: 'checkout'` → after sign in, complete deep link
- [ ] Test: `npx expo start` → `adb shell am start -W -a android.intent.action.VIEW -d "checkstar://order/456" com.checkstar.mobile` (emulator)

**Notes:** Reference `mobile/app.json:scheme`, `mobile/src/navigation/types.ts:14` (`fromNotification`), `mobile/src/features/orders/OrderDetailScreen.tsx`. Critical for order tracking engagement.