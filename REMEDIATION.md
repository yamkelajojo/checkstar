# Remediation Status — CODE_REVIEW.md findings

Every finding from the original audit, mapped to what actually happened. Each
"fixed" item is verified by the CI suite (`.github/workflows/tests.yml`:
backend PHP 8.2/8.3/8.4 + MySQL 8, frontend typecheck/lint/vitest/build,
mobile typecheck/SDK-pin/jest).

## P0 — ship-blockers

| # | Finding | Status |
|---|---|---|
| 1 | Web prod build fails | **Fixed** — root cause was `Logo.tsx` calling `React.useState` without `'use client'` (crashed the shared `not-found` prerender), plus register-page `ssr:false` in a server component and Google-font fetches at build time. Build now runs in CI (30/30 pages). The report's "six dynamic imports" diagnosis was wrong — those pages were already client components. |
| 2 | Carousel endpoints unreachable + latent 500 | **Fixed** — route order moved above `/products/{slug}`; controller enriches the Eloquent collection (no `toArray()`); covered by `ProductCarouselTest`. |
| 3 | Web rider items-bought guaranteed 422 | **Fixed** — `RiderDashboardClient` sends all `item.id`s; `query.ts`/`api.ts` pass `item_ids`. Mobile already sent them. |
| 4 | bought-at idempotency corrupts partial batches | **Fixed** — `order_items.bought_at` migration; per-item conditional claim inside the transaction; partial-batch, repeat, unknown-ids, cancel-after-buy and delivery-release tests. |
| 5 | Reservation system decorative / leaks | **Fixed** — availability = `stock − reserved` everywhere (`OrderIntake`, `StoreFulfillmentService`, `ProductController`); atomic releases on buy (per item) and Delivered (unbought); `ReconcileReservations` scheduled command; DB CHECK constraints (MySQL). |
| 6 | Rider double-booking | **Fixed** — per-rider concurrency cap enforced atomically in the claim transaction (`config/dispatch.max_concurrent_orders_per_rider`), tested. |
| 7 | Cross-store assign/suggestion | **Fixed** — store guards in `ManualDispatch` and `DispatchSuggestionService`; events/audit scoped by `StoreContext`; geo/radius respected; 422/404 tests. |
| 8 | OrderPolicy enum-vs-string bug | **Fixed** — proper enum comparison; riders can view assigned orders only; rider tests. |
| 9 | Auto-cancel silent / retry chain dies | **Fixed** — `cancelled`/`retrying` push messages; push queued `afterCommit` (via `ShouldQueueAfterCommit` contract — the report's `afterCommit()` suggestion fatals against the Queueable trait property); `RetryDispatch` after-commit; scheduled `retrying` sweeper. |
| 10 | CI missing | **Fixed** — full workflow: backend PHP 8.2/8.3/8.4, backend MySQL 8, frontend, mobile; all green. |

## P1 — robustness & security

| # | Finding | Status |
|---|---|---|
| 1 | Token lifecycle | **Fixed** — sanctum expiration (default 30d, `SANCTUM_TOKEN_EXPIRATION`), reset revokes all tokens, refresh rotates (deletes current), `EnsureUserIsActive` on the sanctum group with a fresh-DB re-read each request (suspension takes effect immediately; also correct under Octane-style long-running runtimes). |
| 2 | Email verification | **Fixed** — registration fires `Registered` (framework sends the mail); reset-email + verification links point to the SPA (`FRONTEND_URL`); `/auth/verify-email` page replays the signed request; flow pinned by `EmailVerificationFlowTest`. The broken-by-default `password.reset` route link (would have thrown `RouteNotFoundException` in production mail) was found and fixed. Checkout does **not** require `verified` (product decision left open — no de-scoping of the feature). |
| 3 | Guest checkout | **Fixed** — 401 on place-order surfaces a login link (`/auth/login?redirect=/cart`), login honors same-origin `redirect`. |
| 4 | Address geocoding | **Deferred** — requires an external geocoder, API keys and a product decision on GPS-vs-address precedence. The failure notice exists; the typed address is still not geocoded. |
| 5 | Integer cents | **Fixed at the contract layer** — Order/OrderItem JSON now emits exact `*_cents` integers (mobile renders correctly); decimals remain canonical in the DB. A full column conversion is deferred (high churn, no runtime gain now). Promotions already ran in cents. |
| 6 | Dispatch fallback or docs | **Documented** — `DispatchService::retry` stays single-store; CONTEXT.md documents the actual behaviour (fallback is a dispatch *suggestion*, not automatic re-routing). |
| 7 | Promotions wiring | **Partially fixed** — redemption is now race-safe (atomic conditional UPDATE; the old `lockForUpdate`-without-transaction was a no-op) and fully tested. Wiring `promo_code` into order placement remains deferred: no client collects promo codes yet; endpoints are correct and safe. |
| 8 | Unified API envelope | **Deferred** — the two real envelope breaks found in the audit (mobile rider stats, events `id` type) are fixed; a repo-wide envelope standard + contract tests is a dedicated refactor. |
| 9 | MySQL CI matrix + `||` concatenation | **Done** — MySQL 8 CI job green (only engine-dependent fix needed: JSON key-order-insensitive assertions). The `||` concat items were re-checked: the flagged `AnalyticsService` `!=` null was real and is fixed via `whereNotNull`; remaining selects use Eloquent/query builder. Order-number retry uses post-commit retry closures. |
| 10 | Observability | **Deferred** — needs infrastructure choices (Sentry/Flare account, log pipeline). `/up` health route exists; scheduler + failed-job tables are available. |

## P2 — quality & scale

| # | Finding | Status |
|---|---|---|
| 1 | Mobile test baseline | **Fixed** — root cause: babel-preset-expo transpiles ESM without interop, so the reanimated mock namespace needed its API at top level (mock was also missing `withDelay`/`withSequence`/`Extrapolation`). 63/63 suites green in CI. 3 stale pins aligned with current contracts (documented in the commit). |
| 2 | `:memory:` sqlite | **Fixed** — enabled in `phpunit.xml`. |
| 3 | Server-side catalogue filtering | **Fixed** — `categories=a,b` multi-slug filter (tested); web catalogue queries per group; search was already server-side. The 20-page crawl remains only for the unfiltered "All" view (cached by React Query). |
| 4 | OSRM on tracking GET | **Proven invalid as described** — the endpoint is read-only and `EtaCalculationService` had zero callers; the dead service was deleted (with its orphaned test). If live ETA is added later, drive it from the rider-location write path, not GET. |
| 5 | Analytics truth | **Fixed** — `whereNotNull` for search queries; revenue/ETA joins re-checked against live queries; speed constant shared via config; `#id` placeholders already resolved server-side (re-verified). |
| 6 | Specials admin sync | **Deferred** — product-scope feature (attach/sync endpoints + overlapping-specials semantics doc). Cheapest-wins is in effect and customer-safe. |
| 7 | Token/name cleanups | **Fixed** — swiper CSS variables defined (`--color-primary`, `--color-text-muted`); `text-text-primary`/`--font-primary` phantom utilities replaced; tailwind font stacks wired to next/font variables (site previously rendered in system fonts). Dead code removed (`EtaCalculationService`). |
| 8 | Repo/docs hygiene | **Partially fixed** — README/ADR rot corrected (Laravel not Django; dead link removed). LFS move of 32 MB reference assets **deferred** (needs history rewrite — recommend `git lfs migrate import --everything` in a maintenance window). |
| 9 | Ops console polling | **Deferred** — UX/perf enhancement, no correctness impact. |
| 10 | MySQL CI + status/stock CHECKs | **Done** — MySQL job green; CHECK constraints on stock/money/quantities verified on MySQL 8. Status enums stay app-enforced (validated state machine + tests); DB-level status CHECKs would need a migration per status change. |

## Extra defects found & fixed beyond the report

- `AppServiceProvider::boot()` referenced a nonexistent class (`Auth\Passwords\ResetPassword`) — fataled **every artisan command**, which is what the original "composer install" CI failure actually was.
- Two trait-composition fatals (`SendOrderPushNotification`, `RetryDispatch` redeclaring `Queueable::$afterCommit`) — killed every request/worker boot.
- `EventFeedService` and `RiderOrderService` missing model/facade imports (php-parser gate is syntax-only — these never parse-fail).
- `UserFactory` omitted `is_active` → in-memory NULL → suspension middleware 403'd active users (masked by sqlite defaulting).
- Tailwind font stacks referenced literal `Inter`/`Handlee` families that next/font never exposes — the entire site silently rendered in system fonts.
- Broken password-reset email: default notification targeted a named route that doesn't exist in an API-only app.
- Sanctum guard caching masked suspensions/rotations within a process (tests now emulate per-request isolation).
- Events feed `id` was typed `number` by web while the API emits composite strings.
- Login page ignored `?redirect=`; reset/verify flows had no frontend pages at all.

## Independent deep pass (post-green audit) — round 2 findings

A second, adversarial review beyond the original report. Every fix below has a
regression test; CI (incl. MySQL 8) is the acceptance gate.

| # | Finding | Root cause | Fix |
|---|---|---|---|
| D1 | Rider claim could abort fatally on MySQL | `OrderClaim` incremented `reserved_quantity` blindly; two orders placed against the same stock (placement checks availability but does not reserve) meant the second claim could push `reserved > stock` and violate the DB CHECK → exception inside the claim transaction. | `syncAndReserveInventory()`: single `lockForUpdate()->whereIn('product_id',…)` query binds `store_product_id` and reserves with `min(stock, reserved+qty)` clamp. |
| D2 | Cross-tenant audit-log leak | `/operations/audit-logs` (and per-entity variant) had **no store scoping** — any store operator could read every store's trail (`audit_logs` carries no `store_id`; rows are keyed by order/rider entity ids). | Store scope resolved from `StoreContext`; list = order-ids ∪ rider-ids of that store via `whereIn` subqueries; per-entity endpoint returns `[]` for entities outside the store. |
| D3 | Admin product delete erased sales history | `order_items.product_id` cascades on delete; `destroy()` had no history guard. (Product uses SoftDeletes, so today's endpoint only soft-deleted — but any hard delete (`forceDelete`, DBA maintenance, future code) would have erased every order line for that product. The RESTRICT FK (D7) now makes that impossible at the DB layer too.) | 409 `has_order_history` + product deactivated instead of deleted. |
| D4 | Effective price could exceed base price | `sale_price`/special prices were trusted as-is; a mistyped admin edit (`sale_price > price`, or special pivot above base) would overcharge customers. | `effectivePrice` clamps to base (`min(base, deal)`); sale_price only applies when ≤ base. Cascade priority (sale_price → special → base) preserved and pinned by test. |
| D5 | Category delete destroyed catalogue + history | `products.category_id` cascades; deleting a populated category silently deleted every product, their stock rows, cart items and (via order_items) sales history. No guard at all. | 409 `has_products` guard; plus DB-level `RESTRICT` (see D7). |
| D6 | Store delete erased all its orders | `orders.store_id` cascaded on hard delete; the existing guard only blocked *active* orders. (Store uses SoftDeletes, so the endpoint soft-deleted today — but a hard delete would have wiped every delivered order plus their reviews/transactions. RESTRICT (D7) closes the DB-layer path.) | Guard extended: any order history (409 `has_order_history`) or assigned riders (409 `has_riders`) blocks deletion; deactivate instead. |
| D7 | History-erasing FK cascades (DB layer) | reviews, order activity logs and transactions cascade from orders, which cascaded from stores and customers — a single admin delete could wipe the entire transactional ledger. | Migration re-creates the history FKs as `RESTRICT` on MySQL/MariaDB/Postgres (`orders.store_id`, `orders.customer_id`, `order_items.product_id`, `transactions.order_id`, `transactions.user_id`, `reviews.rider_id`, `store_product.product_id`). Ephemeral data (carts, favourites, audit logs) keeps its cascade. SQLite tests are covered by the app-level guards. |
| D8 | Rider-user delete crashed on review history | `reviews.rider_id` (now RESTRICT) would make `DELETE users` for a reviewed rider fail with an SQL error; previously the reviews were silently cascade-deleted. | 409 `has_reviews` guard in `Admin\UserController::destroy`. |
| D9 | Seeder created a known-password Developer account unconditionally | `dev@checkstar.co.za` / `password` was seeded even in production; also crashed on re-seed (unique email). | Developer demo account only when not in production, or when `DEVELOPER_PASSWORD` is explicitly set; all seed accounts idempotent (`firstOrCreate`); credentials overridable via env (`DEVELOPER_EMAIL`, `DEVELOPER_PASSWORD`, `DEMO_CUSTOMER_EMAIL`, `DEMO_CUSTOMER_PASSWORD`). |
