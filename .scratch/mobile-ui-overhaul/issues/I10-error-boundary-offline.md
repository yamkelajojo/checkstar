# I10 — Error Boundary + Offline Resilience Integration Test

**What to build:** Global error boundary catches render errors, shows friendly fallback. Offline detection shows cached data + banner, auto-reconnects.

**Blocked by:** 05b, 07a, I07, S01

**Status:** ready-for-agent

- [ ] Error Boundary: `ErrorBoundary` component (class or `react-error-boundary`) wrapping `RootNavigator` children
  - Fallback UI: `Card` with "Something went wrong", "Try again" button (`onReset`), "Contact support" link
  - Logs error to console (dev) / analytics (prod)
  - Does not catch navigation errors (handled by React Navigation)
- [ ] Network status: `NetInfo.addEventListener` → `isConnected` in global store/context
- [ ] Offline banner: persistent `Toast`/`Banner` at top: "You're offline. Showing cached data." with `warning` color
- [ ] React Query: `cacheTime: 1000 * 60 * 60 * 24 * 7` (7 days), `staleTime: 0` offline → serves cache
- [ ] Retry: failed queries auto-retry on reconnect (`retry: 3`, `retryDelay: exponential`)
- [ ] Mutation queue: `placeOrder`, `syncCart`, `confirmDelivery` queue offline → flush on reconnect
- [ ] Test: airplane mode → browse Home/Browse (cached) → add to cart (queued) → reconnect → sync flushes

**Notes:** Reference `mobile/src/lib/apiClient.ts` (onUnauthorized), `mobile/src/lib/queryKeys.ts`, `mobile/src/stores/session.ts`. Quality bar: "Cached last-known data + toast on network failure". No error boundary currently exists.