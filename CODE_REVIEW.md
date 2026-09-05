# Checkstar — Full-Stack Code Review

**Date:** 2026-09-04 · **Scope:** `backend/` (Laravel 11 API), `frontend/` (Next.js 15 web), `mobile/` (Expo SDK 54), plus docs, seed data and repo hygiene.
**Method:** Full read of routes, ~50 controllers/services/models/migrations on the backend; the frontend data layer, stores, guards and key screens; the mobile app structure, API client and stores. Frontend `tsc`, `vitest`, `next lint`, `next build` and mobile `tsc` + `jest` were actually executed in a clean checkout. The PHP suite could not be executed (no PHP runtime available in this sandbox) — backend findings are from close static reading and cross-checking against the existing tests.

---

## 1. What this system is trying to be

A rebuild of Checkstar's static 2016-era brochure site (spec'd in `checkstar.md`) into a real grocery-delivery platform for a 3-store Durban chain:

| Layer | Tech | Job |
|---|---|---|
| `backend/` | Laravel 11, Sanctum, SQLite (dev) | Product catalogue, specials, cart, ordering → pricing → store fulfillment → rider dispatch → delivery confirmation, COD "payments", rider gamification, ops dashboards, behavioral analytics |
| `frontend/` | Next.js 15 App Router, React Query, Zustand, Tailwind, motion | Customer storefront + cart/checkout, account, rider dashboard, store/ops dashboards, admin CRUD |
| `mobile/` | Expo 54, React Navigation, Tamagui, Zustand/Query | Customer app (browse/cart/checkout/tracking) + rider app (claim → buy → deliver → route map) |

The domain model is genuinely thought through — `CONTEXT.md` defines a ubiquitous language (Customer, Rider, Store, Dispatch Policy, Order Intake, Order Claim, Store Context, Delivery Confirmation, Rider Stats Recorder), and the backend largely honours it: `OrderStateMachine`, `PaymentStateMachine`, `DispatchPolicy`, `DispatchService`, `OrderClaim` (FOR UPDATE SKIP LOCKED), `OrderIntake`, `ManualDispatch`, `StoreContext`, `DeliveryConfirmation`, `RiderStatsRecorder`. This is far above the usual "fat controller" Laravel prototype.

### Executive verdict

**This is an impressively well-documented, well-decomposed vertical-slice MVP — with a shocking number of dead, broken, or half-wired paths between its layers.** The backend core (order placement → store selection → claim → delivery → payment-on-confirm) is real and largely tested. But:

- The **web frontend does not compile for production** (`next build` fails outright).
- The **homepage's Trending/Popular/New carousels can never load** (backend route shadowing + a latent 500 in the controller that owns them).
- The **web rider dashboard's primary button (Items Bought) is guaranteed to 422** against the current API.
- The **stock reservation system is an illusion**: reserved quantity is never released for delivered orders, never consulted by any availability check, and one "decrement" only happens in memory — a test even pins the bug as expected behaviour.
- Riders can be **double-booked onto unlimited simultaneous orders**.
- An ops user can **hijack another store's order** through `/operations/assign-rider` (its sibling endpoint has the guard; this one doesn't).
- The **customer is never told when an order is auto-cancelled** by dispatch failure (no push for `cancelled`/`retrying`).
- **No CI** runs frontend or mobile checks; the mobile test suite currently has **21 failing suites / 119 failing tests** on a fresh install, and nothing would know.

Each layer is individually above average for a prototype; the *seams* between them are where the project actually stands. Honest distance-to-production: **the domain core is ~60–70% there; the product as a whole is not shippable today.** With focused work: ~2–4 weeks to a hardenable closed beta for the COD-only, single-city scope; materially longer for real payments, monitoring and ops maturity.

---

## 2. What is genuinely good (be fair before the beating)

1. **Ubiquitous language + docs discipline.** `CONTEXT.md` is a real glossary with "avoid" terms; ADRs exist (`docs/adr/`); the Expo SDK pin is documented in three places and *enforced by a postinstall script* (`mobile/scripts/check-expo-sdk.js`). Most teams 10× this size don't do this.
2. **Domain modelling.** Status transitions go through state machines, not ad-hoc `status` writes; pricing has one authority (`PricingService`); store selection has one authority (`StoreFulfillmentService`); the claim path is centralised in `OrderClaim` with row locking and latency instrumentation; controllers are thin and delegate to services/Form Requests. The intended architecture (documented in `CONTEXT.md`) is mostly *actually implemented*.
3. **Ordering flow correctness on the happy path.** Server-authoritative pricing (client totals are never trusted), product snapshots on order items, duplicate-item consolidation, quantity caps enforced at three levels, idempotent delivery confirmation (`DeliveryConfirmation` re-locks and re-checks), refund/payment audit trail (`Transaction` records).
4. **Backend test suite** (~45 files) covers state machines, pricing cascade, dispatch policy, ETA, cancellation, stock edge cases, store context, tracking redaction. Tests are readable and intent-named.
5. **Security basics mostly present:** bcrypt, rate limiting on essentially every route, Sanctum + SPA CSRF (`statefulApi`), PII redaction in tracking (`TrackingService::PII_PATTERNS`), policies for order access, role middleware, validation-based mass assignment in admin CRUD.
6. **Mobile app craft:** SecureStore token storage, single-flight token refresh with boot-timeout fallback, adaptive polling, offline cart sync with `dropped` feedback, a real theme token system with automated **accessibility/contrast tests**, reduced-motion support, per-item "items bought" selection.
7. **Frontend craft:** React Query used properly (staleTime, invalidation patterns), persisted cart with server merge, motion system with `useReducedMotion` respected, Esc/body-scroll handling in the header menu, `tsc` clean, 98 vitest tests green, lint nearly clean.

---

## 3. Critical bugs (user-visible or data-corrupting, verified)

### 3.1 The web frontend cannot build for production — `next build` fails
Six page-level Server Components use `dynamic(() => import(...), { ssr: false })`, which is a hard error in Next 15 App Router:

- `src/app/(auth)/auth/register/page.tsx:4`
- `src/app/(dashboard)/operations/page.tsx:11`
- `src/app/(dashboard)/operations/analytics/page.tsx:12–15`

`next build` aborts: *"`ssr: false` is not allowed with `next/dynamic` in Server Components."* A secondary build blocker: `next/font/google` fetches fonts at build time and fails without internet — vendor the fonts (`next/font/local`) for hermetic builds.

**Implication:** nobody has run a production build. `npm run dev` is the only verified path. **How to fix:** add `'use client'` wrappers (a small client file per page that owns the `dynamic` import) or make the page files client components; self-host fonts. Add `next build` to CI so this class of error can never land silently again.

### 3.2 Homepage carousels are unreachable: route shadowing **plus** a latent 500
`backend/routes/api.php`:

```php
164: Route::get('/products/{slug}', ...);        // registered FIRST
165: Route::get('/products/trending', ...);      // dead route
166-167: /products/popular, /products/new-arrivals  // dead routes
```

Laravel matches in registration order, so `GET /api/products/trending` is captured by `{slug}` and 404s in `ProductController::show`. The frontend homepage (`useTrendingProducts` → `/products/trending`) therefore always renders its error/empty state.

It gets worse: even if the routes were reachable, `ProductCarouselController` converts models to arrays **before** enrichment:

```php
->get()->sortBy(...)->values()->toArray();      // lines 48/65/110
return $this->enrichProducts($products);        // absolutizeImages(Product $product) ← receives array
```

→ `TypeError` → 500. These endpoints have never been executed end-to-end. **Fix:** move the three static routes *above* the `{slug}` route; drop the `->toArray()` calls and enrich the Eloquent collection before serialising.

### 3.3 Web rider "Items Bought" button is a guaranteed 422
- Backend (`RiderController.php:105`): `'item_ids' => 'required|array|min:1'`
- Frontend (`src/lib/api.ts:128`): `request<Order>('/rider/items-bought/${id}', { method: 'POST' })` — **no body**.

The web rider dashboard's main workflow action fails every time ("Could not place order"-style error). The mobile app *does* send `item_ids`, proving the API changed without the web following. **Fix:** pass selected item ids from `RiderDashboardClient` (or make `item_ids` optional server-side and default to all items).

### 3.4 `markItemsBought`'s "idempotency" guard breaks partial batches and corrupts stock accounting
`RiderOrderService::markItemsBought` (line 84) refuses to process anything if *any* `ItemsBought` log exists for the order:

1. Rider marks items 1–2 bought (out of 4) → log created, stock −2.
2. Rider marks items 3–4 → guard trips → **silent 200 no-op** → items 3–4 are never decremented.
3. Order proceeds to Delivered → stock for items 3–4 is permanently overstated.

The API *requires* partial batches (`item_ids.*`), and the mobile UI is built around per-item selection — this will happen in week one of real usage. The existing test `test_mark_items_bought_is_idempotent` only tests the full-repeat case and thereby *sanctions* the bug. **Fix:** idempotency must be per item, not per order — e.g. add `bought_at` to `order_items` and do a conditional atomic update (`UPDATE ... WHERE bought_at IS NULL`), or a unique `(order_id, order_item_id)` index on a buys-log table. Also: two concurrent calls currently race past the `exists()` check (TOCTOU) and can double-decrement — the per-item conditional update fixes both problems at once.

### 3.5 The stock *reservation* system is decorative — and leaks forever
Three facts, all verified:

- `OrderClaim::reserveInventory()` adds to `reserved_quantity` on claim (comment: "to prevent concurrent oversell").
- **No availability check anywhere subtracts `reserved_quantity`** — not `OrderIntake`, not `StoreFulfillmentService::storeCanFulfillCart`, not the public product endpoints.
- On "items bought", the reserved decrement happens **in memory only** (`RiderOrderService.php:118` sets the attribute, then `$sp->decrement('stock_quantity')` persists only the stock column). The test `test_mark_items_bought_does_not_persist_reserved_quantity_change` asserts this exact behaviour — i.e. the suite pins the bug as a feature.
- Cancellation *does* release reservations (`OrderStateMachine`), but **Delivered orders can never cancel** → every delivered order's reservation is a permanent leak. `reserved_quantity` ratchets upward monotonically.

Today the leak is inert only because nothing reads the column. The moment someone "finishes" the design by computing `available = stock − reserved` (the obvious next step), the store silently runs out of everything. **Fix (pick one and write it down in CONTEXT.md):** either (a) make reservations real — subtract reserved in every availability check, release on delivery (not just cancel), fix the in-memory decrement with `decrement('reserved_quantity')`, add DB `CHECK (reserved_quantity >= 0)`, and add a reconciliation command — or (b) delete the column and accept oversell with a store-manager surface to handle out-of-stock at pick time. Option (a) is the correct one for a grocery business.

### 3.6 Riders can be double-booked without limit
`DispatchPolicy::eligibleRider()` returns `Rider::where('is_available', true)->first()` — it never excludes riders who already hold active orders, and nothing sets `is_available = false` on claim. The claim transaction locks only the *order* row, so two concurrent dispatches both select the same rider. One popular rider accumulates every order; `activeDeliveries` happily shows a pile. **Fix:** inside `OrderClaim`'s transaction, lock the rider row too and either (a) flip `is_available = false` on claim and back to true on Delivered/Cancelled, or (b) reject riders with ≥ N active orders (`->whereDoesntHave('orders', fn ($q) => $q->whereIn('status', [...])) ` inside the lock).

### 3.7 `/operations/assign-rider` lets any ops user claim any store's order with any rider
`DispatchController::assignRider` → `ManualDispatch::assignByIds` → `dispatchToRider` checks the rider belongs to the *context store* but **never checks the order belongs to it** — and `OrderClaim::claim` unconditionally writes `store_id = $store->id`. A logistics officer for Store A can assign Store A's rider to Store B's pending order and effectively steal it. The sibling endpoint `StoreDispatchController::dispatch` *does* check `order.store_id !== store->id → 403`, so this is an inconsistency, not a design choice. Manual dispatch also ignores `max_radius_km` and delivery distance entirely. `DispatchSuggestionService::getSuggestion` and `EventFeedService` are similarly unscoped across stores. **Fix:** add the same order-store check to `dispatchToRider`; scope suggestion/event/audit feeds by `StoreContext` (developer exempt via explicit store_id); document cross-store powers as a developer-only capability.

### 3.8 Riders can't view their assigned orders — enum-vs-string policy bug
`OrderPolicy.php:37`: `if ($user->role !== 'rider' ...)`. `User::$role` is cast to a `UserRole` enum, and an enum instance is never `!==`-comparable to a string — this condition is **always true**, so `isAssignedRider()` always returns `false`. Riders get 403 on `GET /orders/{id}` for orders assigned to them (the mobile/web rider flows use rider-specific endpoints and mostly mask it — which is why no test caught it; there is no rider case in `OrderPolicyTest`). **Fix:** `$user->role !== UserRole::Rider`. Add the missing policy test.

### 3.9 Auto-cancelled orders are silent
`SendOrderPushNotification::$statusMessages` covers `confirmed`, `preparing`, `out_for_delivery`, `delivered` — **not `cancelled` or `retrying`**. `DispatchService::retry` cancels orders after 5 failed attempts; the customer's app simply goes quiet. For a food/grocery delivery product this is the single worst customer-experience bug in the system. **Fix:** add messages for `cancelled` (with the reason) and `retrying` ("we're still finding a rider…"). Consider an in-app banner from order status polling.

### 3.10 The retry chain can die silently, stranding orders
`RetryDispatch` is queued **inside** the `OrderIntake` DB transaction. With the default database queue and `after_commit = false`, the job can be picked up by a worker **before the order commits** → `retry()` sees a stale/non-final order → returns `skipped` → **no further retries are ever scheduled**; the order sits in `retrying` until manual intervention (nothing sweeps stuck `retrying` orders either — the job is the only mechanism). Under the `sync` driver, `release()` doesn't re-run the job, so retries never happen at all. **Fix:** set `after_commit = true` for this job (or dispatch it after the transaction returns), add a scheduled sweeper (`orders where status = retrying and updated_at < X` → re-enqueue), and decide the queue-worker story for production (`queue:work` with supervisor, not the dev `queue:listen`).

### 3.11 Mobile rider stats always show "—" (envelope mismatch)
`mobile/src/lib/apiClient.ts` `fetchRiderStats()` returns the raw response but is typed as the *inner* object. The backend returns `{ data: { xp, level, ... } }`, so `stats?.average_rating` (RiderHomeScreen:218) is `undefined` → the UI permanently renders the placeholder. Tests mock `fetchRiderStats` with the *inner* shape, hiding the bug. Same theme as frontend `api.claimOrder` typing the envelope as `Order`. **Fix:** unwrap `res.data` here; grep both apps for every `request<T>`/`api.get<T>` and verify against the actual controller response shapes — the envelope convention (`{data}` vs `{data, meta}` vs bare paginator) is inconsistent enough that a typed `unwrap()` helper is warranted.

---

## 4. Security review

**Mostly sound basics, several real gaps:**

| # | Finding | Severity |
|---|---|---|
| S1 | **Suspended users keep full access.** `is_active` is only checked at login; Sanctum tokens never expire (`sanctum.php: 'expiration' => null`) and no middleware re-checks `is_active`. Deactivating an account does nothing to live sessions. Also: `refresh` mints a new token without revoking the old one, and **password reset doesn't revoke existing tokens** — a stolen token survives a password change. | High |
| S2 | **`verifyEmail` is unsigned, unthrottled and guessable.** The "hash" is `sha1(email)` (`AuthController::verifyEmail`) — anyone who knows your email can verify it for you. It's also the only Laravel signed-link flow that skipped `signedUrl` middleware. Mitigating factor: nothing actually *requires* a verified email anywhere, so the whole feature is decorative today. | Medium |
| S3 | **Cross-store authorization gaps** (§3.7) on operations endpoints. | High (insider) |
| S4 | **User enumeration**: `forgotPassword` validates `exists:users,email` and returns distinct outcomes ("Unable to send reset link" 500 vs success). Login is correctly uniform. | Low-Med |
| S5 | **Rider self-registration has zero vetting** yet exposes customer names/addresses/phones via `/rider/available-orders` and order details. Standard for delivery apps, but there's no admin approval state for new riders (`is_available=false` is the only gate, and riders can flip it themselves). | Medium (process) |
| S6 | **Unauthenticated tracking endpoints** (`/tracking/view|search|contact`) write straight to the DB (60/min/IP) and feed recommendations + admin "top searches" — trivially poisonable. | Low-Med |
| S7 | CORS hardcodes LAN regexes and `allowed_headers: *` with `supports_credentials: true` — fine for dev, must be env-driven and minimised for prod. | Low |
| S8 | `pendingForStore`, `orders` (`per_page` unbounded), `available-orders` (unbounded `->get()`; the computed `$perPage` is unused dead code) — pagination/DoS hygiene. | Low |
| S9 | Order cancel TOCTOU: policy checked, then `stateMachine->transition` outside a lock — a concurrent rider claim produces an unhandled `InvalidArgumentException` → 500 instead of 409. | Low |
| S10 | Money is computed in **floats** end-to-end (`PricingService`, OrderIntake totals) while promotions use integer cents — two conventions, drift guaranteed. DB columns are `decimal(10,2)` (good), but PHP float arithmetic on money will eventually produce 18.999999999 splits. | Medium |

**Good:** throttling everywhere, PII redaction, CSRF/stateful SPA wiring, bcrypt(12), policies, no request-`->all()` mass assignment in admin CRUD, order-number collision retry.

---

## 5. Architecture / MVC assessment

**Backend — genuinely good bones, some decay at the edges:**

- The documented seams (`CONTEXT.md`) mostly exist: controllers validate → services orchestrate → models are thin. `OrderIntake` is a real orchestration root; `DispatchPolicy` keeps dispatch rules config-driven; `StoreContext` centralises role→store resolution.
- **Single oversized transaction:** `OrderIntake::place` does pricing → store resolution → order creation → item creation → stock checks → state transition → **dispatch (row locks)** → cart clearing → job queueing, all in one `DB::transaction`, with a synchronous HTTP push call (see §6) inside. The stock `lockForUpdate` is taken *after* the order row insert, in request item order — two concurrent orders locking the same products in different orders is a deadlock window (MySQL would roll one back; the UX becomes a random 500).
- **Dead/false documentation:** `DispatchPolicy::maxFallbackStores()` is configured, tested, and **never called by dispatch logic** — retries only re-try the pre-assigned store, so the CONTEXT.md promise "dispatch falls back to the next-nearest Store" is unimplemented. `OrderClaim`'s SKIP LOCKED try/catch can never fire at clause-build time (SQLite silently ignores locks), so the tests never exercise the concurrency they claim to. `OrderIntakeResult`/`ClaimResult` are nice, but `DispatchService` still returns raw arrays with stringly statuses.
- **Analytics/recommendation services are prototype-grade:** `RecommendationService` loads the entire products table and runs `$product->orderItems()->count()` per product (N+1 inside a map); `AnalyticsService` computes "revenue" including unpaid pending orders, fabricates `5.2km` rider distances, labels deliveries-per-rider as "utilization", and renders riders as `"Rider #id"`; `EventFeedService` paginates by merging three sources with colliding IDs and uses `||` SQL concatenation (SQLite/Postgres fine, **MySQL default treats `||` as OR** → garbage messages on the presumable production DB). `DispatchSuggestionService`'s ETA is `distance_m / 250` labelled "15 km/h" — that's metres-per-**minute** divided into **seconds**; every suggestion ETA is ~60× wrong (clamped to 60s), while `EtaCalculationService` correctly uses 8.33 m/s. Two ETA services, two different speeds, one wrong.
- Seeded data (OrderSeeder) manufactures `pending`/`retrying` orders that the real intake flow can never leave behind — which then makes the ops "stale pending" alert look meaningful when in production it can never fire.

**Frontend — good data layer, weak boundary discipline:** React Query keys/invalidation are coherent; the cart store is well-built with derived totals and capped quantities; but auth is localStorage-persisted `{user, isAuthenticated}` and the Next `middleware.ts` "protects" `/admin`, `/rider`, `/operations` by checking the mere **presence** of an `XSRF-TOKEN` cookie — which every visitor has. It's a UX redirect, not security (server enforces the real thing, so impact is cosmetic, but the code implies more than it does). Guest checkout per CONTEXT.md ("prompted at checkout") isn't implemented — a guest who taps "Place Order" gets a raw "Unauthenticated." string.

**Mobile — best-engineered of the three clients** (see §2), with two caveats: the API base-URL resolution is a dev-device heuristic (Metro-host IP sniffing) with no production configuration story (`eas.json` absent, no build profiles), and the test baseline is red (§7).

---

## 6. Performance

Current scale (3 stores, dozens of products/riders) hides all of this; none of it is hypothetical growth panic — several items are already O(N) waste per request:

1. **Synchronous Expo push inside the order transaction.** `OrderStatusChanged` listeners are not `ShouldQueue`, so `Http::post('https://exp.host/...')` (default 30s timeout) runs inside `OrderIntake`'s transaction while holding order/product locks. An Expo hiccup stalls checkout. The listener's own comment ("push failure should not block order processing") is currently false. **Fix:** `implements ShouldQueue` + `after_commit`, with retry/backoff and dead-letter logging.
2. **ETA/OSRM on the tracking GET path:** `EtaCalculationService` calls OSRM (2s timeout) and writes to the order during `GET /orders/{id}/rider-location`, which clients poll every few seconds — an external HTTP call plus a write per poll. Cache/dedupe by rider displacement (the `needsRecalculation` helper exists but isn't wired into the endpoint) and move writes off GET.
3. **N+1s:** `ProductController::appendStoreAvailability` (one query per product × 20/page + tracking aggregates), `RecommendationService` (full-table load + per-product count), `ManualDispatch::pendingForStore` (all unassigned orders × all stores per poll), `AnalyticsService::getRidersData` (2 queries/rider).
4. **Frontend fetches up to 20 pages × 100 products** client-side (`getAllProducts`) to filter in the browser — fine at 100 SKUs, breaks at 2,000. Server-side search/filter exists; use it.
5. **Ops console polls:** event feed every 5s, metrics 30s, alerts 30s — against unscoped services doing full-table scans; no pause when the tab is hidden.
6. SQLite-in-dev hides all query-shape problems; there is no query log review, no indexes on `order_activity_logs(order_id, event_type)` (the items-bought guard scans this), no EXU planning. `orders.order_number` has both a unique index and a redundant plain index.

---

## 7. Tests: what exists, and the large blind spots

**Exists and is decent:** ~45 backend test files focused on the right things (state machines, pricing cascade, dispatch, cancellation, stock, store context, tracking redaction); 98 green frontend vitest tests (stores, filters, motion tokens); mobile has *design-token/accessibility* tests, which is rare and admirable.

**What the suites miss — each missed item maps to a shipped bug above:**

1. **Contract/integration tests.** No test asserts the *shape* the frontend/mobile receive for any endpoint. This is exactly where 3.2, 3.3, 3.11 live. A thin layer of "response shape snapshot" feature tests per endpoint would have caught all three.
2. **Policy tests stop at customers.** No rider/assigned-rider case in `OrderPolicyTest` → the enum bug (3.8) survives.
3. **Partial flows.** The items-bought idempotency test only repeats the *full* call, codifying the partial-batch bug (3.4) as intended.
4. **Real concurrency.** Everything runs on SQLite, which ignores `FOR UPDATE SKIP LOCKED` (and the fallback try/catch never executes), so "first-claim-wins" and double-booking (3.6) are untested beyond happy paths. Run a CI matrix against MySQL/Postgres — that would also catch the `||` event-feed SQL and the Postgres-aborted-transaction order-number retry.
5. **Cross-store authorization.** No test that Store A's staff cannot act on Store B's order via `/operations/assign-rider`.
6. **Nothing runs in CI.** `backend/.github/workflows/*` are the untouched **Laravel skeleton** workflows (trigger on `master`/`*.x`; this repo's branch is neither, and they never run on this project's branches by push). There is **no workflow for frontend or mobile at all** — which is why `next build` is broken and 21 mobile suites are red with nobody noticing.
7. **Mobile suite is red today:** fresh `npm ci && npx jest` → **21 failed suites, 119 failed tests** ("Element type is invalid … got: undefined" in `TactilePressable`/`EmptyState` renders — Tamagui/motion mock or transform drift), while `tsc --noEmit` passes. The suite was clearly green at some point and rotted; there's no gate to keep it honest. (Also: `phpunit.xml` leaves the sqlite `:memory:` override commented out, so tests run against the real `database/database.sqlite` — `RefreshDatabase` will wipe dev data when someone runs the suite locally.)
8. **No build/typecheck gate anywhere** (frontend `next build` fails; backend has PHP matrix defined but effectively orphaned; mobile has no CI).

---

## 8. UI/UX and design consistency

**Strong:** a real motion identity (page transitions, progress bar, animated numbers, `useReducedMotion` everywhere), warm palette (`#EB6522` on `#FFFCF9`), Handlee display font, skeleton loaders, empty/error states on nearly every panel, mobile tokens with WCAG-audited contrast. The storefront reads as a coherent brand, a big step up from the 2016 site.

**Weak spots:**

- **Checkout:** no guest sign-in prompt (spec'd, absent); geolocation failure silently falls back to Durban CBD coordinates (there *is* a notice, `LocationFallbackNotice`, but the typed address is never geocoded — dispatch decisions run on coordinates that may be kilometres from the actual address; riders get sent to the wrong side of Durban).
- **Order tracking:** no visible state for `retrying` ("finding a rider") — the customer sees nothing between "confirmed" and a rider appearing, and silence after auto-cancel (3.9).
- **Color drift:** `#F58220` hardcoded in ~9 components vs the `#EB6522` token (plus `#F47A3A`, `#E07018` one-offs), and globals.css swiper styles reference `var(--color-primary)`/`var(--color-text-muted)` which are **never defined** — those styles silently no-op.
- Inconsistent pagination contracts (bare paginator vs `{data, meta}` depending on query params — `OrderController::index`, `Admin\SpecialController`) force every client to guess.
- Admin surfaces (banners, staff, messages) are functional but bare; banners can be created but the banner CRUD has no image upload (path strings only), and specials have **no way to attach products** — the `product_special` pivot is only ever read, so "collection specials" are unreachable through the product surface (only `sale_price` works; only seeders can populate the pivot).
- **Promotions are a movie set:** `/promotions/validate` computes discounts that nothing consumes, and `/promotions/apply` burns `used_count` with no link to any order — a customer can exhaust a code by tapping apply. Either wire promos into `OrderIntake` (code on order, atomic conditional `used_count` increment, discount columns) or remove the feature.
- ADR 0001 says the backend is "Django REST API" — doc rot even in the ADRs.

---

## 9. Database & schema review

**Good:** sensible FKs with correct cascade/null-on-delete, unique constraints where they matter (`reviews.order_id` unique — race-safe reviews; `store_product(store_id, product_id)` unique; `riders.user_id` unique), composite indexes matching query patterns (`orders [status, store_id]`, `riders [is_available, store_id]`), product snapshots preserving price history, soft deletes on users/products/stores, append-only activity log.

**Issues:**

1. **Statuses as unconstrained strings** (`orders.status`, `payment_status`): documented as intentional, but the enums are only enforced by code paths that have already been shown to have bypasses (seeders, `OrderStatus::from`). A `CHECK` constraint or lookup table would cost nothing and guard the audit trail.
2. **No `stock_quantity >= 0` / `reserved_quantity >= 0` checks**, and no invariant that `reserved <= stock`.
3. `stores UNIQUE(city, name)` + soft deletes = you can never re-create a store name after a soft delete.
4. Money as `decimal` columns (good) but float arithmetic in PHP (see S10).
5. `users` soft deletes + unique email: a soft-deleted user's email can never re-register (unique index still hits the ghost row).
6. Missing index for the hot guard query: `order_activity_logs(order_id, event_type)`.
7. `password_reset_tokens`/`sessions` tables exist and are used (session driver database) — fine — but tokens never expire (S1) so `personal_access_tokens` grows forever.
8. Test/production DB drift: everything is tuned on SQLite; MySQL/Postgres behaviour differs for `||`, SKIP LOCKED (actually *supported* on MySQL 8+/PG and silently dropped on SQLite), and transaction-abort semantics (the order-number retry loop cannot work on Postgres).

---

## 10. Repo & docs hygiene

- `products_dataset/` (11 MB, 272 files) and `original_site_assets/` (21 MB, 370 files) are committed reference material; `sneaksy.html` (146 KB design comp) and logo HTML experiments sit in the repo root. Move to LFS or a `reference/` folder outside the app tree; the `.gitignore` reveals several once-tracked generated artifacts.
- README references `MOBILE_APP_UX.md`, which no longer exists (deleted in the last commit with other "completed iteration docs") — dead links day one.
- Two parallel `*_test.php` seed scripts (`seed_store_products*.php`) sit loose in `backend/` outside the seeder convention.
- Backend `CHANGELOG.md` is the Laravel skeleton file; frontend `tsconfig.tsbuildinfo` is committed (build artifact).

---

## 11. How far from production-ready? (honest scoring)

| Dimension | Grade (of 10) | One-liner |
|---|---|---|
| Domain modelling / architecture intent | **8** | State machines, policies, single-authority services; some promised behaviour unimplemented |
| Backend correctness | **5** | Happy path solid; stock reservation illusory, rider double-booking, cross-store gap, retry chain fragile |
| API design & contract consistency | **4** | Three envelope shapes, dead endpoints, clients drifted from server |
| Frontend (web) | **4.5** | Nice UX shell, broken build, broken carousels, cosmetic auth gate, no guest checkout |
| Mobile | **6.5** | Best craft; red test suite, dev-only API config, envelope bug |
| Database/schema | **6.5** | Good indexing/FKs; missing constraints, soft-delete traps, SQLite-only validation |
| Security | **5** | Basics strong; token lifecycle, verification, cross-store scoping need work |
| Performance | **6** | Fine at demo scale; sync push in txn, N+1s, polling design won't survive growth |
| Testing | **4.5** | Good unit intent; zero contract tests, zero concurrency truth, no CI for 2 of 3 apps, mobile suite red |
| Docs & language | **7.5** | Excellent CONTEXT/ADRs; drift already visible (fallback dispatch, Django reference, dead links) |
| **Overall** | **~5/10** | An honest, promising **pre-alpha vertical slice** — not production-ready |

**Blunt version:** you cannot take real orders with this system today. The three flows that would break first — rider marking items, stock accuracy, order-cancellation silence — are the three flows a grocery business lives on. The gap to production is not "more features"; it is **finishing the last 20% of every feature that's already started**, and adding the boring guarantees (CI, contracts, constraints, queues, monitoring) that this codebase's own documentation promises.

---

## 12. Remediation roadmap (what, why, how)

### P0 — ship-blockers (fix this week)

| # | Fix | How |
|---|---|---|
| 1 | Web prod build | Wrap the six `dynamic(…, {ssr:false})` imports in `'use client'` client components (or mark pages client); self-host Inter/Handlee via `next/font/local`. Add `next build` to CI. |
| 2 | Carousel endpoints | Move `/products/trending|popular|new-arrivals` above `/products/{slug}` in `routes/api.php`; in `ProductCarouselController`, drop `->toArray()` and enrich the Eloquent collection. |
| 3 | Rider items-bought (web) | Send `item_ids` from `RiderDashboardClient` (per-item checkboxes like mobile), or make `item_ids` optional server-side. |
| 4 | Per-item bought idempotency | Add `bought_at timestamp NULL` to `order_items`; replace the activity-log guard with `UPDATE order_items SET bought_at=now() WHERE id IN (...) AND bought_at IS NULL` inside the transaction (atomic + race-safe + allows batches). Keep the log for audit only. |
| 5 | Reservation truth | Decide (a) real reservations or (b) delete the column. For (a): availability = `stock_quantity - reserved_quantity` in `OrderIntake` + `StoreFulfillmentService`; `decrement('reserved_quantity')` (not in-memory) at buy; release on **Delivered** too; `CHECK (reserved_quantity >= 0)`; nightly reconciliation command comparing `SUM(items.qty of active orders) vs reserved`. |
| 6 | Rider double-booking | In `OrderClaim`'s transaction: `Rider::where('id',…)->lockForUpdate()` + reject if active orders ≥ N (or flip `is_available=false` on claim / true on Delivered+Cancelled). |
| 7 | Cross-store assign guard | Add `order.store_id === $contextStore->id` check in `ManualDispatch::dispatchToRider`; scope suggestion/events/audit by StoreContext; enforce `max_radius_km` + distance in manual dispatch. |
| 8 | Policy enum bug | `$user->role !== UserRole::Rider` in `OrderPolicy`; add rider-view tests. |
| 9 | Push notifications off the hot path | `SendOrderPushNotification implements ShouldQueue` (+ `afterCommit()`); add `cancelled`/`retrying` messages; queue the OSRM ETA update; add the scheduled `retrying` sweeper; set `after_commit` on `RetryDispatch`. |
| 10 | CI | One workflow, three jobs: `phpunit` (PHP 8.2–8.4 + MySQL matrix later), `vitest + tsc + next build`, `jest + tsc`. Only the skeleton Laravel workflows exist today and they don't even trigger on this branch. |

### P1 — robustness & security (next 2–4 weeks)

1. **Token lifecycle:** set `sanctum.expiration` (e.g. 60 days), revoke all tokens on password reset, add an `EnsureUserIsActive` middleware to the sanctum group, delete (not just create) on `refresh`.
2. **Email verification:** use Laravel's signed verification URLs (`EmailVerificationRequest`), throttle it, and decide whether checkout requires `verified` — if yes, add the `verified` middleware to order placement; if no, delete the feature.
3. **Guest checkout:** on 401 from `POST /orders`, redirect to `/auth/login?redirect=/cart` (the param plumbing already exists in middleware) — matches CONTEXT.md's promise.
4. **Address geocoding:** geocode the typed address (Google/Nominatim) at checkout, show the resolved pin on a map, and use *those* coordinates for fulfillment; keep GPS as a helper, not the sole source.
5. **Money:** integer cents end-to-end (a tiny `Money` class or `xCents` columns via cast) — one convention, no float drift.
6. **Dispatch fallback or doc correction:** either implement the documented next-nearest-store fallback in `DispatchService::retry` (the policy knob already exists) or rewrite CONTEXT.md — silent spec drift is how the other bugs happened.
7. **Promotions:** wire `promo_code` into `PlaceOrderRequest` + `OrderIntake` (validate → compute discount → store `discount_cents` on order → atomic `UPDATE promotions SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses` inside the order transaction) — or delete the endpoints.
8. **Unify the API envelope:** every endpoint returns `{ data, meta? }`; kill the double-wrapped paginators; add contract tests per endpoint (assert keys/shapes) shared by all three clients.
9. **MySQL/Postgres CI matrix** + replace `||` concatenation with Eloquent selects; make the order-number retry not depend on catching exceptions inside a transaction (retry the closure via `DB::transaction(function() { … }, attempts: 3)` or generate collision-free numbers with a sequence table).
10. **Observability:** real health check (DB write, queue depth, pending dispatch count), structured logs, error tracker (Sentry/Flare), failed-job notifications, and surface `AuditService` failures as warnings, not `Log::debug`.

### P2 — quality & scale (next 1–2 months)

1. Fix the mobile test baseline (mock/transform drift in `TactilePressable`/`EmptyState` renders), and add CI; un-mock the envelope in the fixed tests.
2. Force `:memory:` sqlite in `phpunit.xml` (currently commented out → tests can wipe dev data).
3. Server-side filtering/pagination for the web catalogue; kill `getAllProducts`'s 20-page crawl.
4. Wire `needsRecalculation` into the tracking endpoint; cache OSRM per rider-displacement; stop writing on GET.
5. Analytics truth: join `users` for rider names, exclude `pending` from revenue, compute distance from actual coordinates, fix the `#id` placeholders and the 60× ETA constant (single `config/routing.php` speed constant shared by both ETA services).
6. Specials admin: add product attach/sync endpoints (`sync` on `product_special` with `special_price`), and decide min-vs-max semantics for overlapping specials (currently cheapest wins — fine for customers, document it).
7. Token/name cleanups: remove dead `per_page` in `availableOrders`, `delivery_fee_cents`, the SKIP LOCKED try/catch, `PaymentStateMachine::$recordTransaction`; define the swiper CSS vars or delete the block; consolidate `#F58220` → `primary` token.
8. Data/repo: move `products_dataset`/`original_site_assets` to LFS or out of the repo; fix README/ADR links (Django claim, `MOBILE_APP_UX.md`).
9. Load-shape the ops console (pause polling on `visibilitychange`, SSE or long-poll for the event feed instead of 5s polling).
10. If production is MySQL: run `php artisan test` against MySQL in CI *before* users arrive, and add `CHECK` constraints for statuses/stock.

---

## 13. The one-paragraph honest summary

Checkstar is three apps written by someone (or someones) who *reads* the right books: the ubiquitous language is real, the state machines are real, the tests are intent-named, the mobile theme has contrast tests. It is also three apps written somewhat *past* each other — the backend ships endpoints the web never updated and can't call, the homepage showcases endpoints that 404, the reservation system exists everywhere except where it would matter, and nothing mechanical (a build, a CI run, a failing suite) has been allowed to say "stop" for a while: the web can't compile, and the mobile suite is 21 suites red. The distance to production is therefore not architectural — the bones are good — it's **integration integrity and operational finish**. Do the P0 list (roughly a week or two of focused work) and this becomes a genuinely testable closed beta; add P1 and it becomes a business you could defend running with real customers and real cash-on-delivery. Until then, the honest label is: *a high-quality prototype that has never once been run end-to-end through all of its own features.*
