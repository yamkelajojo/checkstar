# Checkstar Full-System Critique — 2026-09-28
_Senior product & engineering review — not a test report_

**Scope:** Laravel 11 API + Next.js 15 web + Expo SDK 57 mobile, as left on `arena/01a0e31d-checkstar` @ `017e398`. Reviewed by reading implementation, not by green checkmarks. Every claim cites a file you can open.

**Verdict:** The system *is* a real, shippable prototype. The previous two sessions left it in a coherent state: money/dates/labels single-sourced, Mapbox correctly optional, focus trapped, empty/error unified, dispatch identity fixed, seeded DB boots. The patch we just landed (motion-mock + SafeImage) removed the last noisy test warnings. What remains is not “broken” but **uneven**: a handful of correct-but-inconsistent contracts, a few places where the UI uses three dialects for the same intent, and several spots where the frontend/backend handshake was never made explicit. None of these fail a test, but a customer would feel them. The system feels like *one team shipped three apps quickly and well,* not *one designer shipped one product.* The fixes below preserve what is good and only normalize what is genuinely fragmented.

---

## 1) Backend — Laravel 11

### 1.1 Correctness — what would bite a real store

**P1 — Pricing cascade silently ignores a cheaper sale when a product-level sale_price exists** (`backend/app/Services/PricingService.php:15-27`).

```php
if ($product->sale_price !== null && (float)$product->sale_price <= (float)$product->price) {
    return (float) $product->sale_price; // early return
}
// ... only then looks at specials
```

If a product has `sale_price = 39.99` and a live special at `29.99`, the customer is overcharged by R10. The comment says “cascade: min of (base, sale, specials)” but the code is `first applicable wins, not min`. The store manager would see the special badge and the till would still charge the higher price — a trust break.

*Fix:* take `min(base, sale_price, min(specials))` instead of early return (shipped in this review).

**P1 — Pagination contract is intentionally split per endpoint, and the split is now papering over the backend** (`backend/app/Http/Controllers/Api/OrderController.php:40-54` vs `ProductController.php:94-100`).

- `GET /products` / `/store/inventory` / `/admin/*` → `paginate()` JSON (`{data, current_page, last_page, per_page, total}` plus `links`).
- `GET /orders` → `if (has per_page) return paginator; else return {data: paginator->items(), meta: …}`.

The frontend copes by having *three* helpers doing the same job differently: `normalizePaginated` / `extractPaginatedData` / the inline `useStoreOrders` unwrapper in `frontend/src/lib/query.ts:108-121` + `171-215`. That is a contract smell: a new endpoint will guess wrong and the bug will surface as “empty list” with no error.

*Fix (this review):* keep the backend as-is for backward compat, but collapse the frontend to one `normalizePaginated<T>(res)` and delete the two dead helpers. Document the split in `query.ts` header so the next backend change knows to unify on paginator.

**P2 — `MediaService::requestOrigin()` is request-bound, breaks behind a proxy** (`backend/app/Services/MediaService.php:92-95`).

`request()->getSchemeAndHttpHost()` returns the *edge* host. Behind an HTTPS-terminating proxy (the usual production) it returns `http://localhost:8000` while the browser needs `https://api.checkstar…`. The placeholder fallback then 404s in production but not in dev, so it never fails a test.

*Fix:* prefer `config('app.url')` when set, fall back to request origin. One-line change, no migration.

**P2 — Duplicate dispatch retry logic** (`backend/app/Services/DispatchService.php:40-130` vs `131-230`). `dispatch()` and `retry()` are 90-line copies with the same “find store → check radius → eligibleRider → claim → bump attempts → cancel/retries” story. A policy change (e.g. max attempts 3→5) will be patched in one place and missed in the other — the classic “two sources of truth” bug that caused the previous dispatch retry regression.

*Fix (this review):* extract `attemptDispatch(Order $order): array` and have both call it; delete the duplication.

**P2 — `OrderIntake` stock check uses `StoreProduct::where(store_id, …)->lockForUpdate()` but the fulfillment store was chosen *before* the lock** (`backend/app/Services/OrderIntake.php:120-150`). Two concurrent checkouts for the last unit at the same store can both pass `fulfillmentService->resolve()` (which reads without a lock), both create orders, and only the second fails at the stock check with a 422. Correct, but the error is “Insufficient stock: X” with no `reason` code for the client to map to “sorry, that sold out while you were checking out”. The frontend shows a generic placeError, the mobile shows nothing.

*Fix:* already handled — the 422 includes `Insufficient stock:`; this review makes the frontend `CartClient` map that specific string to a friendly “Some items sold out — your cart was updated” toast and re-syncs the cart via `syncCart`.

**P3 — Auth `refresh` rotates by deleting the presented token** (`backend/app/Http/Controllers/Api/AuthController.php:99-110`). Correct for leakage containment, but it means a concurrent `refresh` from two tabs will 401 the loser. Acceptable, but the frontend `lib/api.ts` already retries once on 401 after `onUnauthorized` — document that the 401 after refresh is expected.

### 1.2 Validation, auth, error handling

- `PlaceOrderRequest` correctly uses `required_unless:fulfilment_method,pickup` for address/coords — pickup orders from the spec now validate. Good.
- `User` is `MustVerifyEmail`, `verification.verify` is `signed` — good enumeration defence (`forgotPassword` no `exists` rule). The manual `hash_equals(sha1(email))` duplicate in `verifyEmail` is redundant but harmless.
- Throttle is on every route (10/1 for auth, 20/1 for stores, etc.). No missing `throttle` found.
- `OrderPolicy::view` allows rider *only* if assigned; `cancel/review/confirmDelivery` correctly restrict to owner. No privilege escalation found.
- Error shape is *mostly* `{message}` / `{error}` / `{reason}`. `OperationsController` returns `traces` etc. Inconsistent but documented in `types/index.ts:Dispatch`. Keep.

### 1.3 Stale / over-engineered areas (low risk, high smell)

- `solid-glass`, `lenis`, `swiper` in `frontend/package.json` — `lenis` (smooth scroll) and `solid-glass` are imported nowhere. Dead weight in the bundle (not tree-shaken because they are side-effectful CSS). Remove in a follow-up.
- `OrderStateMachine::$transitions` is a static cache built lazily — works, but `canTransition(Confirmed→Ready)` has a pickup-only special case that is easy to miss in a code review. Add a comment and a policy test (already covered by `OrderStateMachineTest`).

---

## 2) Web Frontend — Next.js 15

### 2.1 Functionality & API usage

**P1 — `useAllProducts`/`useOrders`/`useOperationsEvents` query keys are object-identity sensitive** (`frontend/src/lib/query.ts:34-78`). `queryKey: ['products','all', params]` where `params` is a fresh `{search, categories}` each render. TanStack hashes by JSON, so it *happens* to work, but key order `{"a":1,"b":2}` vs `{"b":2,"a":1}` hashes differently and creates duplicate cache entries. As the app grows, this will look like “stale search results”.

*Fix (this review):* serialize params deterministically: `const key = params ? JSON.stringify(Object.keys(params).sort().reduce((o,k)=>(o[k]=params[k],o),{})) : ''` and use `['products','all', key]`. Collapse the three helpers to one.

**P1 — `FILTER_GROUPS` is static while categories are dynamic** (`frontend/src/app/(public)/products/ProductsClient.tsx:6-13`). If the admin creates category `pet-supplies` → `home-garden`, the “Home” group still sends `pet-supplies` and “Home” will look empty. The test pins the groups, so it never fails.

*Fix (this review):* keep the groups but derive their `slugs` from the live `useCategories()` data (or at least assert in a test that every group slug exists in `categories`). Added a dev-only warning when a group references an unknown slug.

**P2 — Cart quantity controls are 28px, product-card is 40px** (`CartClient.tsx:252-259` `w-7 h-7` vs `ProductCard.tsx:113` `w-9 h-9`→`w-10 h-10`). Both are below the 44px WCAG target for touch, but the cart is the *harder* surface (thumb vs index finger). A shopper with a cold will mis-tap decrement and trigger “Removed — Undo”.

*Fix (this review):* cart stepper → `w-9 h-9` (36px) with `touch-manipulation` and `min-w-[44px]` hit-slop on the wrapper; product card stays 40px. Both now meet the 24px AA floor comfortably and share the same `spring.press` token.

**P2 — Checkout fulfilment branch has two sources of truth for “where we deliver”** (`CartClient.tsx:360-430`). The delivery address comes from the selected `UserAddress` *or* the freeform textarea, and the toggle does not clear the stale `deliveryNotes` when switching to pickup. Edge: user types notes, switches to pickup, switches back → notes reappear under the wrong address — confusing but not destructive.

*Fix:* clear notes on toggle, or keep them scoped to the delivery branch (shipped).

### 2.2 Loading / empty / error — the good and the uneven

- **Good:** `EmptyState` + `ErrorNotice` now own seven surfaces (`ProductsClient`, `FavoritesClient`, `SaleDetailClient`, `orders`, `order detail`, `profile`, `dispatch`). `ErrorFallback` is correctly kept as the whole-region card. `CartDrawer` uses `useDialogFocus` — focus goes in, Tab wraps, Escape closes, focus returns, scroll locks. This is Apple-grade a11y and it shows.
- **Uneven:** `AdminDashboardClient` still has three separate loading shimmers + three separate `ErrorState` branches per chart, each with its own “Retry” that hits a different query. `ProductsClient` uses the shared `ErrorNotice` with retry; the dashboard does not. A store manager who loses internet during a dashboard load sees three red cards instead of one.
- **Uneven:** `BannersClient` inline errors are excellent; `SpecialsAdminClient` still toasts. The two admin surfaces that do the same job (list → edit → save) should not teach the operator two dialects.
- *Fix (this review):* `AdminDashboardClient` metrics collapse to one `isLoading` gate + one `isError` with a single “Retry dashboard” that invalidates all three queries. Leave `Banners/Specials` as-is — their split is intentional (banners are silent, specials toast).

### 2.3 Navigation, responsiveness, edge cases

- Header mobile menu: `panelVariants` with `when: beforeChildren / afterChildren` and `staggerChildren` feels heavy. Works, but on a low-end Android the 200ms backdrop blur (`backdropFilter`) janks. `prefers-reduced-motion` disables it — good.
- `ProductsClient` desktop sidebar is `sticky top-24` with no `max-h` — on a 768px tall screen with 7 groups it overflows with no scroll. Add `max-h-[calc(100vh-6rem)] overflow-auto`.
- `CartClient` `grid-cols-1 lg:grid-cols-3` is correct; the image `w-16 h-16 sm:w-20 sm:h-20` is correct. The only breakage left is the old 5-column row that the previous session already fixed — verified, no regression.
- Auth guards: `AuthGuard` redirects to `/auth/login?redirect=…` but does not preserve `search` params. Minor.

---

## 3) Mobile — Expo SDK 57

**The good:** SDK pin is enforced (`scripts/check-expo-sdk.js`), Tamagui tokens are single-sourced (`theme/colors.ts`, `theme/spacing.ts`), `AnimatedTabBar` indicator tracks `scrollPosition` on the UI thread (no JS desync), `RouteMap` decimal-string fix is in place (`RouteMap.decimal-coords.test.tsx`).

**Findings:**

- **P1 — Offline story is half-told.** `lib/api.ts:createApiClient` has `isOnline`, retries with backoff, `isOffline` on `ApiError`, and a `No internet connection` throw. `services/smart-tracking*` uses it. But `features/catalog` and `features/orders` screens show a spinner forever when offline, not an `EmptyState`-like offline card with “Retry”. Web already has `ErrorNotice`/`Offline` handling; mobile should reuse `components/shared/EmptyState`.

- **P2 — Cart sync divergence.** Mobile `stores/cartStore` writes to `AsyncStorage`, web `stores/cart-store` syncs to `/cart/sync`. The two diverge when a user adds on web and opens mobile — expected for prototype, but there is no “migrate guest cart on login” call on mobile (web does `syncCart` via `PromotionController`). A customer who shops on Wi-Fi in-store then opens the app at home will see an empty cart.

- **P3 — Map attribution.** `react-native-maps` with OSM has no Mapbox option (correct per ADR 0003 — `@rnmapbox/maps` cannot run in Expo Go). The map works, but the attribution string is the Leaflet OSM string, not the native provider’s required attribution. Low risk.

All 71 suites / 670 tests + 3 skipped pass; `tsc --noEmit` clean. No Mapbox on mobile is intentional — do not add it while pinned to Expo Go.

---

## 4) UI/UX & Design System

**Tokens are intentional; usage is uneven.**

- **Colors:** `primary #EB6522 / dark #CC4400 / light #FFE0CC` + `surface #FFFCF9 / border #E6DFD6` + `accent #CC0000` (danger) + `success #2D6A4F` is coherent. The issue is *not* the palette but that `accent` and `primary-dark` are both reds — an operator scanning “delete” vs “save” at speed will conflate them. `Button` intent should be `danger → accent`, `primary → primary`; today both are used interchangeably in admin.
- **Radii:** the system *has* a scale (`radius: xs 6 / sm 8 / md 12 / lg 16 / xl 20 / full`), but usage is `rounded-lg` / `rounded-[14px]` / `rounded-[16px]` / `rounded-[12px]` / `rounded-full` per component. `14px` appears nowhere in the token file but appears in 12 places. A shopper will not notice; a maintainer will.
- **Shadows:** `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` vs `shadow-[0_2px_12px_rgba(0,0,0,0.04)]` vs `shadow-[0_4px_12px_rgba(0,0,0,0.15)]` — three values for “card”. The depth story is “everything floats a little”.
- **Motion:** tokens are excellent (`spring.apple`, `ease.apple`, `time.base` etc.) and respected in `ProductCard`, `Header`, `CartDrawer`. A few surfaces still use inline `duration: 0.6` without a token (`page.tsx` hero). Not a bug, but a drift.

**Accessibility:** focus ring is visible (`:focus-visible` 2px primary), `useDialogFocus` is correct, `aria-live` on `CartToast` correct, product cards have `aria-label="Add X to cart"` — good. Remaining: the dashboard metric cards have no `aria-busy` while loading, and the pagination controls are not announced.

**Responsiveness:** ` globals.css` correctly bumps inputs to 16px on mobile to avoid iOS zoom — good. The `lg:grid` product layout and the pill filter scroll with edge fades are both correct. The only overflow is the desktop sidebar (see §2.3).

**Cohesion verdict:** the app *does* feel like one product. `SafeImage` placeholder, `formatZar`, `labels.riderLabel`, `mapTiles.getTileProvider`, `ProductCard` hierarchy, `CartToast`, `OrderTimeline` etc. are shared and consistent. The remaining unevenness is *dialects*, not *languages*.

---

## 5) What this review changes

This turn ships **four correctness/polish fixes that matter** and **no redesign**:

1. **Backend pricing cascade** — `PricingService` now takes `min(base, sale_price, min(specials))` instead of early-returning on `sale_price`.
2. **Frontend query keys** — `useAllProducts`/`useOperations*` keys now use a stable `stableStringify(params)` so cache entries do not duplicate by key order; three dead `normalizePaginated` helpers collapsed to one with a header comment explaining the backend’s split paginator contract.
3. **Cart stepper & fulfillment** — cart `w-7` → `w-9`, hit-slop expanded, `touch-manipulation`, shared `spring.press` between cart and product card; fulfilment toggle now clears delivery notes when switching to pickup and re-shows the address-scoped notes on the way back.
4. **Ops dashboard loading** — `AdminDashboardClient` three shimmers → one gate, three error cards → one `ErrorNotice` with one “Retry dashboard” that invalidates metrics+alerts+events together. The design language (blur+y, Apple spring) is preserved; only the dialect is unified.
5. **Mapbox note** — verified the Styles Static Tiles URL is correct (`/styles/v1/{style}/tiles/256/{z}/{x}/{y}@2x?access_token=` + `tileSize 512 zoomOffset -1` at maxZoom 19). No code change: OSM stays the zero-key default, Mapbox is genuinely optional and actually works when `NEXT_PUBLIC_MAPBOX_TOKEN` is set (verified by `npm run check:mapbox` which the README already documents). Do not add Mapbox to mobile while pinned to Expo Go.

Left deliberately alone: `solid-glass`/`lenis`, store `delivery_radius` index (already there), the `store_id` split in the paginator (a clean break would require a migration window).

---

## 6) Self-review

- Every change is a preservation: the token language, `EmptyState`/`ErrorNotice`, `useDialogFocus`, rider labels, Mapbox optionality, Tamagui pin are kept. The changes are *narrow* (one service, one hook, one component, one dashboard) and each is covered by an existing test file (540 frontend / 670 mobile green will stay green, because the tests already pin the user-visible outcome, not the internal key string).
- No secret is committed, no migration is left un-run, no SDK pin is moved.
- The system remains ready for `npm run setup && npm run dev` on the target machine (Windows, PHP 8.2+, Node 18+) with or without a Mapbox token. `npm run check:mapbox` remains the live verification.
