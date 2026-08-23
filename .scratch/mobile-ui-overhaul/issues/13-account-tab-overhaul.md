# 13 — Account Tab UI Overhaul

**What to build:** Account screen (`AccountScreen.tsx`) polished: avatar/name, sign-in/out flow, orders list with status badges, navigation to OrderDetail. Proper empty/auth states. No crash (fixed in 01).

**Blocked by:** 01-fix-logo-crash, 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 09-replace-lucide-icons

**Status:** ready-for-agent

- [ ] Header: `Logo` lockup + user name (or "Guest"), consistent `spacing.lg` padding
- [ ] Auth state: Guest → "Sign in" button (primary, `Button`); Authenticated → "Sign out" (secondary, `Text` + icon)
- [ ] Orders section: `FlatList` with `Card` rows, status badge (color-coded: pending=warning, confirmed=info, preparing=primary, out_for_delivery=primary, delivered=success, cancelled=danger), date, total
- [ ] Order row press → `OrderDetailScreen` (modal/push)
- [ ] Empty states: Guest → "Sign in to see orders"; Authenticated + no orders → "No orders yet"
- [ ] Loading: `SkeletonCard` rows while `fetchOrders` loads
- [ ] Error handling: React Query `error` state → `Toast` with retry
- [ ] All tokens from Tamagui config; status colors map to semantic tokens (`warning`, `info`, `primary`, `success`, `danger`)
- [ ] TalkBack: status announced with order, sign-in/out buttons labeled

**Notes:** Reference `mobile/src/features/account/AccountScreen.tsx`. MOBILE_APP_UX.md: Flutter Profile → Account (avatar, identity, delivery prefs, location, orders, terms, about). GreenBidder `src/screens/buyer/ProfileScreen.jsx` for patterns. The crash fix (01) unblocks this screen.