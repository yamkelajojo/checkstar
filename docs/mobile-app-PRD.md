# Checkstar — Mobile App PRD (Customer + Rider)

**Date:** 2026-08-05
**Status:** Draft
**Branch:** `feat/mobile-app`
**Stack:** React Native (Expo SDK 54) + TypeScript — see ADR-0001, ADR-0002

---

## Problem Statement

Checkstar is a Durban-based supermarket chain with 3 physical stores that already runs a Laravel API backend (`backend/`) powering a Next.js web storefront. Customers cannot yet order groceries from their phones, and Riders have no mobile way to claim and fulfil deliveries. A delivery service exists on the backend (Dispatch, Order Claim, Rider lifecycle) but the only customer-facing surfaces are the web app — there is no native shopping, order-tracking, or Rider tool.

The plan for this app has been fully designed and grilled (31 resolved decisions across A1–A6, B1–B8, and the flow-choreography addendum F1–F11 + C — recorded in `docs/mobile-build-interview.md`). This PRD codifies that plan so the build is unambiguous.

## Solution

A standalone **mobile app** in a new `mobile/` folder at the repo root (sibling to `backend/` and `frontend/`, no monorepo workspace). It is a Customer-first grocery delivery app, plus a real (non-mocked) role-gated Rider shell in the same Expo project. It talks to the existing Laravel/Sanctum API — public endpoints serve Guest browsing; auth is via additive **Sanctum Personal Access Tokens** (`Authorization: Bearer`, token in `expo-secure-store`). The web cookie/SPA auth is untouched.

**Customer:** a 4-tab bottom-nav shell (Home, Browse, Cart, Account) with inline cart steppers, a Special pricing cascade (product `sale_price` → Collection Special → base price) shown on a unit-aware price gauge, live order tracking via polling + local notifications, COD payment (Stripe-prepared), and an on-brand motion language (GreenBidder boosters + Sneaksy gap-fillers).

**Rider:** a role-gated Rider shell (availability toggle, claim list, order detail with items-bought, delivery confirm, earnings/stats) wired to the real rider endpoints. Lighter polish, Customer-first.

The app is **prototype-only**: it runs in **Expo Go on an iPhone**; no EAS/dev build, no Play Store, no deployment.

---

## User Stories

### Onboarding & First Run

1. As a Guest, I want to see a branded Splash with the Checkstar logo assembling once (~650ms), so that the app feels like Checkstar.
2. As a Guest, I want a show-once Onboarding with 3 value-prop slides (fresh groceries delivered in Durban, save on Specials, track delivery live), so that I understand the app before shopping.
3. As a Guest, I want a "Start shopping" primary CTA that takes me straight into browsing without signing up, so that I can shop before committing to an account.
4. As a Guest, I want a secondary "I'm a Rider" CTA that routes to Rider registration, so that Checkstar employees can join as Riders.
5. As a Guest, I want a Skip button on Onboarding, so that I can reach the app immediately.
6. As a returning Customer, I want Onboarding not to replay (gated locally), so that I go straight from Splash to Home with a quick fade.
7. As a user, I want the app to respect the iPhone Reduce Motion setting, so that motion-heavy entrances snap to end state and I am not nauseated.

### Delivery-Store & Browsing

8. As a Guest or Customer, I want the app to resolve my nearest Store within its delivery radius on first Home using location, so that I see relevant inventory and delivery context.
9. As a Guest or Customer who declines location, I want a Store picker, so that I can choose where I shop.
10. As a Guest or Customer, I want the chosen Store shown in the Home header with a manual override, so that I can change it any time.
11. As a Guest or Customer, I want my chosen Store persisted across sessions, so that I don't re-pick every time.
12. As a Guest or Customer, I want the catalog scoped to my chosen Store's availability (`?store_id=`), so that out-of-stock or unavailable items at that Store are not shown.
13. As a Guest, I want to browse public catalog endpoints unauthenticated, so that I can explore before signing in.
14. As a Customer, I want a Home dashboard with a free-delivery threshold banner, search bar, Specials carousel, and category grid, so that I can start shopping fast.
15. As a Customer, I want a 2-pane Browse (category rail + product list), so that I can navigate the catalog with few taps.
16. As a Customer, I want real product search (debounced, min 2 chars, scoped to my Store) with recent searches and category chips, so that I can find items quickly.
17. As a Customer, I want product cards with a 2-col grid, sale price vs struck-through regular price, % off ribbon, and an inline add/stepper, so that adding to cart is one tap.

### Product Detail & Specials

18. As a Customer, I want a Product detail screen with zoomable gallery, price/unit, and a sticky bottom CTA, so that I can inspect an item before buying.
19. As a Customer, I want the Special pricing cascade applied (product `sale_price` first, then Collection Special, then base), so that the price I see is the real one.
20. As a Customer, I want a unit-aware price gauge comparing `sale_price` to `regular_price`, so that I can see how good the deal is.
21. As a Customer, I want a small badge on a Product card that opens a morph-from-badge summary popup (real data only, no AI), so that I can see a quick deal summary.
22. As a Customer, I want Specials surfaced on Home and as a dedicated strip, so that I can take advantage of current offers.

### Cart

23. As a Guest, I want a local cart (zustand persisted to async-storage) that survives app restarts, so that I don't lose my selections.
24. As a Guest, I want to change quantities and remove items with tactile steppers and haptic feedback, so that I can prepare my order.
25. As a Customer, I want a cart badge with a live count, so that I know my cart state at all times.
26. As a Customer, I want a running subtotal, delivery-fee threshold, and a min-order nudge, so that I know what I'll pay and when I qualify.
27. As a Customer, I want my guest cart merged into my account on sign-in via `/cart/sync` (server cart authoritative), so that nothing I added is lost.
28. As a Customer who switches Store, I want items unavailable at the new Store flagged and removed only after a confirm sheet, so that I am never silently over-billed.
29. As a Guest or Customer, I want a Checkout button that enables/disables based on cart state, so that I can't submit an empty or below-minimum order.

### Checkout & Orders

30. As a Guest, I want to fill in delivery address and notes, so that my groceries can be delivered.
31. As a Customer, I want to choose a payment method (Cash on delivery enabled; card "coming soon"), so that I know how I'll pay.
32. As a Guest at checkout, I want a sign-in prompt that pushes the Auth screen while keeping my checkout state mounted, so that nothing is lost.
33. As a Guest who signs in at checkout, I want my cart merged immediately and the server cart shown when I return, so that I can place the order right away.
34. As a Customer, I want to place an Order and land on an "Order placed" success screen with the Checkstar logo win, order number, and success haptic, so that I know my order was received.
35. As a Customer, I want to view my active Order with a live status timeline (`pending → confirmed → preparing → out_for_delivery → delivered`), so that I know where my delivery is.
36. As a Customer, I want the order timeline to poll every ~20s (faster during `out_for_delivery`) and update in place, so that status changes appear promptly.
37. As a Customer, I want a local notification on detected status changes, so that I am alerted without keeping the app open.
38. As a Customer, I want to tap a status notification and deep-link to that Order, so that I can see full details.
39. As a Customer, I want to see which Store is actually fulfilling my Order on the timeline, so that the shown Store matches reality even if dispatch fell back.
40. As a Customer, I want to confirm delivery when my order arrives, so that the Rider gets credit and COD payment processes.
41. As a Customer, I want to cancel my Order while it is `pending`, `confirmed`, or `preparing` (not `out_for_delivery`) via a confirm sheet with reason chips, so that I can back out before the Rider is en route.
42. As a Customer, I want to see my order history sorted by date, so that I can revisit past purchases.
43. As a Customer, I want to rate my Rider (1–5 amber stars + optional comment) inline in Order detail once delivered, so that I can give feedback that updates Rider stats.

### Account & Session

44. As a Customer, I want to register with email + password, so that I can place delivery orders.
45. As a Customer, I want to sign in and out, so that I can control my session.
46. As a Customer, I want my session token stored securely and my shell chosen by my role, so that I land on the right experience.
47. As a Customer, I want a graceful session-expiry flow (401 → clear token, "Session expired", return to sign-in) that still allows Guest browsing, so that I am never hard-locked.
48. As a Customer, I want my local cart draft and chosen Store to persist through sign-out and reconcile on next sign-in, so that I don't lose context.
49. As a Customer, I want an Account screen with profile, delivery preferences, order history, and app info, so that I can manage my account.

### Rider

50. As a Rider, I want to register with extra fields (vehicle type, banking details, availability), so that I can deliver orders.
51. As a Rider, I want to sign in and land in the Rider shell based on my role, so that I see rider tooling not the shop.
52. As a Rider, I want to toggle my `available` status on and off, so that I only receive deliveries when ready.
53. As a Rider, I want a claim list of available Orders at my store, so that I can choose which to deliver.
54. As a Rider, I want to claim an Order with one tap and be sure first-claim-wins, so that there is no double-assignment.
55. As a Rider, I want to see a "taken by another Rider" toast and the Order dropped from my list when my claim loses (409), so that I can move on.
56. As a Rider, I want an Order detail with items to buy at the Store and customer address/notes, so that I can fulfil the delivery.
57. As a Rider, I want to mark items as bought, so that inventory is decremented and the Customer knows their items are secured.
58. As a Rider, I want to mark an Order `out_for_delivery` and then `delivered`, so that the status timeline advances.
59. As a Rider, I want my earnings/stats (deliveries, average rating, XP) so that I can track my performance.
60. As a Rider, I want a notification tap for a claimed Order to deep-link to its detail, so that I can act fast.
61. As a Rider who wants to shop, I want to use a separate Customer account, so that my rider and shopper identities stay separate.

### Accessibility & Trust

62. As a user, I want ≥44pt hit targets and screen-reader labels on all interactive controls, so that I can use the app with assistive technology.
63. As a user, I want honest cost signals (free-delivery threshold, min-order nudge, cart-persist trust note), so that I am never surprised at checkout.
64. As a user, I want ZAR prices formatted consistently (e.g. `R 12,34`), so that amounts are unambiguous.

---

## Implementation Decisions

### Stack & Scaffolding (ADR-0001, ADR-0002, B2)

- **Framework:** React Native (Expo SDK 54) + TypeScript. Flutter is dropped; its app is a UX reference only.
- **Scaffold:** `create-expo-app --template blank-typescript` in a new standalone `mobile/` at repo root.
- **Navigation:** `@react-navigation` (bottom-tabs + native-stack) — **not** expo-router. Native push/pop and the default tab cross-fade; no `animation` prop overrides. Branded feel comes from per-screen entrances.
- **State:** `@tanstack/react-query` v5 = server-state (cache, refetch-on-focus, mutations, `refetchInterval` polling); `zustand` = client-state (cart draft, session/token, delivery-Store, onboarding flag, motion preferences).
- **Persistence:** `@react-native-async-storage/async-storage` (Expo-Go-bundled) for cart draft + onboarding gating; `expo-secure-store` for the auth token.
- **Theme:** plain `src/theme/` TypeScript token objects — **no Tamagui**. Two-font system per ADR-0002: platform system sans (weights 700–900, tight tracking) for UI; Caveat (`expo-font`, OFL) only on orange-emphasis moments (discount %, sale price, "Special Offer", active pill). `useColorScheme()` drives light/dark palettes.
- **Brand accent:** canonical Checkstar `#EB6522` (web stays `#EB6522`; native starts from Sneaksy `#eb7a43` and reconciles).
- **Motion language (one token set):** entrance `20/180`, press-in `18/450`, press-out `22/400`, exit ~60–70% faster; animate opacity + transform only. Reduce Motion snaps every primitive to end state.
- **Dependencies kept lean:** only `zustand` 5.0.14 + `react` 19.2.8 from `.opensrc`; one new dependency outside that set: `@tanstack/react-query` v5. No confetti, no AI, no recommendation engine.

### Auth (A2, F10, F11)

- **Mechanism:** additive backend — Sanctum **Personal Access Tokens** issued on register/login; mobile sends `Authorization: Bearer <token>`; token in `expo-secure-store`. Web cookie/SPA auth untouched.
- **Register/login:** email + password (no phone/OTP — no infra exists). Login response loads the user's `rider`, and the root picks the shell by role.
- **Guest → sign-in at checkout:** push Auth screen (`intent: 'checkout'`) keeping checkout mounted; on success run `/cart/sync`, return, refetch the server cart, allow Place order.
- **401 handling:** centralized in the API client — clear token + session, toast "Session expired — sign in again", navigate to Auth via a module-level navigation ref. Guest browsing still works. Explicit logout clears token + session only; cart draft and delivery-Store persist.

### Delivery-Store (A3, C)

- **Model:** "Delivery-Store first" — on first Home, `expo-location` picks the nearest Store within `delivery_radius_km`; permission-decline → Store picker; persisted; manual override in the Home header.
- **Backend seam (decision C):** the chosen Store is a purely **aspirational browse filter** — `?store_id=` scopes `/products` (+ categories/specials) to `store_product` availability. **Zero change to order intake** — `store_product` carries no price (verified in migrations), pricing is product-global; the Order timeline shows the actual fulfilling Store set by OrderClaim. No `aspirational_store_id` column.
- **Store-switch revalidation:** items unavailable at the new Store are flagged and removed behind a confirm sheet, never silently.

### Cart (A4, F10, F11)

- **Guest cart is local** — zustand persisted to async-storage (72h+). Signed-in: server cart authoritative; merge through `/cart/sync` (additive backend: sync writes `store_product_id`).
- Cart badge reads from the zustand store. Store-switch revalidation is a pure function (testable).

### Order Tracking (A5, F5)

- **Liveliness:** polling `GET /orders/{id}` ~20s while active, ~10s during `out_for_delivery`, stop on terminal; the timeline updates in place. No map pin (no coordinate API this phase).
- **Notifications:** `expo-notifications` local notifications on detected status changes, each carrying `data: { orderId }`; a `lib/notifications` bridge subscribes to taps and checks the last notification response for cold-start taps, then resolves the route per role and navigates via the navigation ref. OrderDetail reuses the TanStack Query key so a tap never double-fetches.
- **Remote push (FCM) and rider map are deferred.**

### Payment (A6)

- **COD v1 + Stripe-prepared.** Additive backend: `payment_method` enum on Orders (`cod` | `card`, default `cod`, set at intake). `PaymentStateMachine` unchanged — `paid` fires on Delivery Confirmation for COD today; later on charge success (same machine, different trigger). `transactions` table reserved for Stripe. Checkout has a payment-method selector seam: v1 shows only "Cash on delivery" (enabled); `card` disabled "coming soon". Refunds are ops-only.

### Deep Modules (B2 layout — feature/deep-module)

Each feature is hidden behind its own entry so its complexity concentrates behind a small interface:

1. **`lib/api`** — the API client seam: base URL, Bearer header injection, 401 interception (session expiry + toast + navigate), typed request/response, TanStack Query hooks per domain.
2. **`lib/currency`** — `formatZar(cents)` via `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`; the single ZAR formatting seam.
3. **`lib/strings`** — all hard-coded copy in one constants module (mechanical future-localization pass; no i18n library).
4. **`lib/notifications`** — local-notification scheduling + deep-nav bridge (tap/cold-start → route resolution).
5. **`stores/cart`** — cart draft: add/stepper/remove, 72h persistence, merge-on-sync, store-switch revalidation (flag + remove behind confirm), badge count. Pure rules isolated for testing.
6. **`stores/session`** — token + role + user; login/logout/expiry transitions drive shell selection.
7. **`stores/deliveryStore`** — chosen Store state, location resolution, manual override, persistence.
8. **`stores/motionPreferences`** — Reduce Motion flag (boot + change listener) feeding every motion primitive.
9. **`features/onboarding`** — 3-slide pager (`react-native-pager-view`), show-once gating, CTAs (Start shopping / I'm a Rider), Skip.
10. **`features/auth`** — register/login screens (email + password), rider registration (vehicle, banking, availability), session bootstrap, 401 redirect target.
11. **`features/home`** — delivery-aware header (Store + free-delivery threshold), Specials carousel (`FadeEdgeScroll` + `ScrollAwareCard`), category grid, search entry.
12. **`features/catalog`** — category rail + product grid/list, 2-col product card with angled image + inline stepper, `?store_id=` scoping, skeletons (`SkeletonCard`).
13. **`features/search`** — debounced live search (400ms, min 2 chars), recent searches (local, last 5), category chips, idle/searching/empty states.
14. **`features/product`** — product detail: gallery, price/unit, **price gauge** (sale vs regular, unit-aware), Product Summary Popup (morph-from-badge, real data, no AI), sticky CTA.
15. **`features/cart`** — cart screen: rows with FadeSlideIn, steppers, min-order nudge, cart-persist trust note, checkout entry.
16. **`features/checkout`** — address + notes + payment-method seam (COD enabled / card "coming soon"), guest→sign-in choreography, Place order.
17. **`features/orders`** — order history list, order detail with live status timeline, cancel sheet (statuses `pending|confirmed|preparing`), inline review card (delivered + no review yet), delivery confirmation.
18. **`features/rider`** — Rider shell: availability toggle, claim list, claim (409 → "already claimed" toast + drop + refetch), order detail/items-bought, out-for-delivery/delivered, earnings/stats, notification deep-nav.
19. **`components/shared`** — motion primitives (FadeSlideIn, TactilePressable, usePressAnimation, haptics, AnimatedLogo, AnimatedError/useErrorShake, FadeEdgeScroll, ScrollAwareCard, SkeletonCard, EmptyState), Logo (stacked + lockup), collection pills, glass toast, angled product image.

### Onboarding & Flow Choreography (Q6, F1–F11)

- **Onboarding:** 3 value-prop slides with staggered entrances + parallax; stacked logo hero-once; "Start shopping" → Browse as Guest; "I'm a Rider" → rider registration; show-once gating; returning users Splash → Home quick-fade.
- **Empty states:** one shared `EmptyState` (lucide glyph → heading → one secondary caption; delayed rise+scale entrance) for empty cart, empty order history, no search results, empty Specials — each with tailored copy + recovery CTA (e.g. Browse Specials, category chips).
- **Loading:** skeletons where the shelf shape is predictable (2-col product grid + a horizontal Specials-carousel variant); plain spinners for auth'd list fetches and store-resolution to avoid flicker.
- **Success moment:** "Order placed" is a native-stack push — hero-once AnimatedLogo win with a bouncy spring, Caveat line ("We'll get it to your door"), order number, `success` haptic, "View order" → timeline. No confetti.

### Additive Backend Changes (minimal, web untouched)

- Sanctum Personal Access Tokens on register/login.
- `?store_id=` on public `/products` (+ categories/specials) to scope `store_product` availability.
- `/cart/sync` writes the delivery Store's `store_product_id`.
- `payment_method` enum on Orders (`cod` default).
- No changes to order intake, dispatch, pricing, or payment state machines. All rider endpoints already exist.

---

## Testing Decisions

- **What makes a good test:** test **external behavior only** through the module's public interface — not implementation details. For pure modules (cart rules, currency, pricing, strings) this means: feed a typed input, assert the typed output, no mocking of internals, no snapshots. For the API client it means: assert the request it issues and the 401 handling it performs (via a mocked fetch), not its internal retry/header plumbing.
- **Modules tested** (confirmed with the user; extends B7):
  1. **Cart draft logic** — merge-on-sync (guest → server, conflict resolution), store-switch revalidation (flag + remove), persistence round-trip. *Prior art: existing backend CartSync merge semantics and the `frontend/` zustand cart tests if any; the Flutter example's cart model is UX reference only.*
  2. **`lib/currency` `formatZar`** — `R 12,34` formatting, cents rounding, zero, large amounts. *Pure function test, mirrors the pricing-cascade tests below.*
  3. **Pricing rules** — the app-side display cascade: product `sale_price` > Collection Special > base; priority and fallback. *Prior art: `PricingService::effectivePrice` backend tests in `backend/tests/`.*
  4. **`lib/strings` + `lib/api` client** — copy-constants integrity (no missing keys used) and API-client behavior (Bearer injection, 401 → session-clear + toast + navigate, base URL).
- **Runner:** `jest-expo` unit tests (works in Expo Go — no built binary needed). No component/snapshot churn.
- **Not tested this phase:** `Maestro`/`Detox` (need a built app binary; a prototype in Expo Go has none).
- **Cross-screen QA:** a manual **Expo Go checklist** on the user's iPhone covering the critical journey (browse → cart → checkout → order placed → track → review) plus a Rider smoke pass. Optional: a `node` API-contract sanity script against public endpoints + `?store_id=`.

---

## Out of Scope

- **Deployment / distribution** — prototype-only; no EAS/dev build, no Play Store, no app-store review (B6).
- **Web app changes** — no Next.js/frontend work in this PRD; additive backend changes are the only `backend/` work.
- **Remote push (FCM/APNs)** and **Rider map/live-coordinate tracking** — deferred (polling + local notifications instead).
- **Card payments / Stripe integration** — `payment_method` seam + `transactions` table prepared only; COD is the live path. Refunds are ops-only.
- **Phone/OTP auth, SMS notifications, email notifications** — no infrastructure exists; email+password only.
- **i18n / multi-language** — English-only; copy centralized in `lib/strings` for a mechanical future pass.
- **Banner Creator module** (Sneaksy Part B), **web dashboard dark system** (Sneaksy Part A.3) — separate web-app work, not part of this PRD.
- **Tamagui, expo-router, confetti, recommendation engine, AI product analysis** — deliberately excluded (one-new-dependency rule).
- **Store Owner / Store Manager / Logistics Officer mobile surfaces** — web-only roles.
- **Performance/load testing, security audit** — out of scope this phase.

---

## Further Notes

- **Source of truth:** this PRD + `docs/mobile-build-interview.md` (31 decisions) + `docs/adr/0001-mobile-react-native-expo.md` + `docs/adr/0002-mobile-typography-dual-font.md`. UX references: `MOBILE_APP_UX.md`, `GREENBIDDER_BOOSTERS.md`, `SNEAKSY_DESIGN_SYSTEM.md`. Backend facts: `backend/routes/api.php`, `backend/app/Services/` (OrderIntake, OrderController, DispatchService, PricingService), `backend/database/migrations/`.
- **Ubiquitous language** (CONTEXT.md): Customer, Guest, Rider, Store, Store Owner/Manager, Logistics Officer, Developer, Order, Order Status, Payment Status, Dispatch, Special, Product. Use these; avoid Buyer/User/Runner/Courier/Branch/Boss.
- **Rider-Customer separation:** a Rider who wants to shop creates a separate Customer account; both shells coexist behind one sign-in only in the sense that the role picks the shell — no role switching within a session.
- **First-claim-wins** stays implicit in the UI (atomic backend `FOR UPDATE SKIP LOCKED`); the app just surfaces the 409.
- **Brand:** primary `#EB6522` canonical; Caveat OFL attribution must be carried; system-sans rendering differs iOS vs Android by design.
- **Run target:** Expo Go on the user's iPhone; iOS-styled (San Francisco) per ADR-0002.
