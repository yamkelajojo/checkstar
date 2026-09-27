# Test traceability — requirements → design → tests (V-model / STLC)

**Date:** 2026-09-27
**Purpose:** every behaviour Checkstar promises has a named test that fails if the promise breaks, and every test traces back to a requirement somebody actually stated. This document is the two-way map.

**How to read it:** `REQ-<DOMAIN>-<nn>` → *source of truth* (where the requirement was stated) → *implementation* → *verification* (test file and what it pins) → *level* (V-model stage) → *status*.

Levels follow the V-model: the left side is requirement/design decomposition, the right side is the matching test level.

```
  Product requirement  ────────────────────────────  System / acceptance gate (GATES.md, CI matrix)
      Domain requirement  ────────────────────────  End-to-end (Playwright, mobile journey suites)
          Screen / component design  ─────────────  Component & screen tests (real renders)
              Module / service contract  ─────────  Unit tests (pure functions, services)
```

---

## Test inventory (at the time of writing)

| Suite | Command | Scale | Runs in CI |
|---|---|---|---|
| Backend (Laravel 11, PHPUnit) | `npm run test:backend` / `cd backend && php artisan test` | 477 tests, 3100+ assertions | ✅ PHP 8.2, 8.3, 8.4 (SQLite) + PHP 8.3 (MySQL 8) |
| Web unit + component (Vitest, jsdom, RTL) | `cd frontend && npx vitest run` | 53 files / 466 tests | ✅ (with `tsc --noEmit`, `next lint`, `next build`) |
| Web end-to-end (Playwright) | `cd frontend && npx playwright test` | 12 specs / 32 tests | ❌ **gap** — needs a live API + web server; see G-1 |
| Mobile unit + screen (Jest, RNTL) | `cd mobile && npm test` | 71 suites / 670 passed / 3 skipped | ✅ (with `tsc --noEmit` and the Expo SDK pin check) |

CI workflow: `.github/workflows/tests.yml` → six jobs (Backend PHP 8.2 / 8.3 / 8.4, Backend MySQL 8, Frontend, Mobile). Last all-green run: `36287076597` (PR #2).

---

## Requirement → test matrix

### Maps (`REQ-MAP`)

| ID | Requirement | Source of truth | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-MAP-01 | Maps must work on web **and** mobile for every map surface | user mandate ("all map functionality must work") | `frontend/src/components/MapContainer.tsx`, `OrderTrackingMap.tsx`; `mobile/src/components/shared/RouteMap.tsx`, `LiveDeliveryMap.tsx` | `MapContainer.test.tsx` (8), `OrderTrackingMap.test.tsx` (10), `RouteMap.test.tsx` (5), `rider-routemap-integration.test.tsx` (3), `route-explorer-navigation-integration.test.tsx` (2) | component / integration | ✅ |
| REQ-MAP-02 | Maps must work with **no credentials** on a fresh clone | `docs/manager-qa-refactor-plan.md`; ADR 0003 | `frontend/src/lib/mapTiles.ts` (OSM default) | `mapTiles.test.ts` — default provider, blank-token rejection | unit | ✅ |
| REQ-MAP-03 | Mapbox adopted where it genuinely works better | user mandate ("if it will work better, implement it") | `lib/mapTiles.ts` token-gated Mapbox raster; `docs/adr/0003-map-providers.md` records why mobile cannot | `mapTiles.test.ts` (URL, 512 px hints, token trimming, no leakage), `MapContainer.test.tsx` (provider reaches `L.tileLayer`) | unit / component | ✅ |
| REQ-MAP-04 | A map that cannot load must explain itself, not show a black rectangle | UI audit P1 | `MapContainer.tsx` tileerror/tileload counters | `MapContainer.test.tsx` — outage after 3 failures, recovery on first tile, no false outage when some tiles land | component | ✅ |
| REQ-MAP-05 | Decimal **strings** from the API must never break a coordinate | `docs/manager-qa-refactor-plan.md` (`.toFixed()` audit) | `frontend/src/lib/polyline.ts`, `mobile/src/lib/numbers.ts` (`toFiniteNumber`) | `polyline.test.ts` (web), `numbers.test.ts` + `polyline.test.ts` (mobile), `delivery-coords.test.ts` | unit | ✅ |

### Media / catalogue (`REQ-MEDIA`)

| ID | Requirement | Source | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-MEDIA-01 | Seeded products must show their images (the reported regression) | user bug report | `backend/app/Services/MediaService.php`, `backend/public/products/**` (29/29 packshots) | Backend feature tests over the seeded catalogue (CI, 4 PHP/DB jobs) | system | ✅ |
| REQ-MEDIA-02 | A missing, foreign-hosted or 404ing image degrades to the branded placeholder — never a blank card, never a thrown route | UI audit; `SafeImage` docblock | `frontend/src/components/SafeImage.tsx`, `lib/media.ts` | `SafeImage.test.tsx` (20), `media.test.ts` | component / unit | ✅ |
| REQ-MEDIA-03 | A product with no image must not print developer copy | design critique §Fixed-7 | `ProductCard.tsx` renders `SafeImage` unconditionally | `ProductCard.test.tsx` "shows the branded placeholder for missing images, never developer copy" | component | ✅ |

### Design language (`REQ-DSN`)

| ID | Requirement | Source | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-DSN-01 | One money format across the ecosystem | user mandate (cohesion); critique §1 | `frontend/src/lib/money.ts`, `mobile/src/lib/currency.ts` | `money.test.ts` (18), `currency.test.ts` (8) — **mirrored tables**, plus component assertions in `ProductCard`, `CartDrawer`, `SaleDetailClient`, `CartScreen`, `CheckoutScreen`, `AccountScreen` | unit / component | ✅ |
| REQ-DSN-02 | One date/time format, independent of browser locale and ICU version | critique §2 | `frontend/src/lib/dates.ts`, `mobile/src/lib/formatters.ts` | `dates.test.ts` (14), `formatters.test.ts` (34) — month-table determinism ("Sep", never ICU's "Sept"), em dash for missing dates | unit | ✅ |
| REQ-DSN-03 | One status/role vocabulary; enums never rendered raw | critique §3 | `frontend/src/lib/labels.ts`, `lib/motion/variants.ts` (`statusConfig`), `mobile/src/lib/status.ts` | `labels.test.ts` (30), `mobile/src/lib/__tests__/status.test.ts` (4) — both assert the *same* strings | unit | ✅ |
| REQ-DSN-04 | One branded map pin on both platforms | design specificity | `MapContainer.tsx` `checkstarPinIcon` + `PIN_BADGE_NAVY`; `mobile/src/components/shared/StorePin.tsx` | `MapContainer.test.tsx` (pin HTML carries the brand colour), `token-consistency.test.ts` (mobile) | component | ✅ |

### Authentication & roles (`REQ-AUTH`)

| ID | Requirement | Source | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-AUTH-01 | Every role lands on its own surface after sign-in (developer, store_owner, store_manager, logistics_officer, customer, rider) | `CONTEXT.md`; user mandate ("all flows for every role") | `LoginClient.tsx` role routing; `AdminNav.tsx`, `AccountSubNav.tsx` gating; API authorisation | `LoginClient.test.tsx` — 6 role cases; `manager-surfaces.test.tsx`; backend policy tests (CI) | component / system | ✅ |
| REQ-AUTH-02 | `?redirect=` returns the visitor where they were headed, and cannot be abused | security review | `LoginClient.tsx` same-origin guard | `LoginClient.test.tsx` — `//evil`, `https://evil`, `javascript:` all refused | component | ✅ |
| REQ-AUTH-03 | An existing session is restored without re-login | `LoginClient` design | `checkAuth()` on mount; `mobile` storage bootstrap | `LoginClient.test.tsx`; mobile `storage.test.ts`, `OnboardingScreen.test.tsx` | component | ✅ |
| REQ-AUTH-04 | Rider sign-up is a separate, discoverable path | product design | `/auth/register/rider`; mobile onboarding "I'm a Rider" → `('Auth', { intent: 'rider' })` | `LoginClient.test.tsx` (link href), `OnboardingScreen.test.tsx` (3) | component | ✅ |

### Commerce (`REQ-CART`, `REQ-ORDER`)

| ID | Requirement | Source | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-CART-01 | Add / increase / decrease / remove with an undo window | product design | `CartDrawer.tsx`, `CartClient.tsx`, `stores/cart-store.ts`; mobile `CartScreen` | `CartDrawer.test.tsx` (18) incl. the q=1 boundary and the 5 s toast timer, `cart-events.test.ts`, mobile `cart.test.ts` / `cartStore.test.ts` / `cartSync.test.ts` | component / unit | ✅ |
| REQ-CART-02 | Totals are money-formatted and quantity-multiplied everywhere | REQ-DSN-01 | `lib/money.ts` adopted at cart, drawer, product, checkout, orders, admin | `CartDrawer.test.tsx`, `ProductCard.test.tsx`, mobile `pricing.test.ts`, `orderTotal.test.ts` | component / unit | ✅ |
| REQ-ORDER-01 | An order can be placed and its lifecycle followed | `CONTEXT.md` order lifecycle | `OrderDetailClient.tsx`, `TrackingClient.tsx`, mobile `CheckoutScreen` / `OrderDetailScreen` | `checkout-flow-integration-e2e.test.tsx` (mobile), `full-customer-journey-e2e.test.tsx` (mobile), backend order feature tests (CI), Playwright `cart.spec.ts` (not in CI) | integration / e2e | ✅ (mobile+backend), ⚠️ web e2e not gated — G-1 |
| REQ-ORDER-02 | Live tracking shows the rider, and says so when the ping is stale | product design (90 s threshold) | `OrderTrackingMap.tsx`, mobile `LiveDeliveryMap.tsx` | `OrderTrackingMap.test.tsx` — LIVE vs STALE, polling gated by status, pins + bounds | component | ✅ |
| REQ-ORDER-03 | A route is drawn when geometry exists, and a dashed fallback when it does not | product design | `OrderTrackingMap.tsx`, mobile `RouteMap.tsx` | `OrderTrackingMap.test.tsx` (both paths), `polyline.test.ts` | component / unit | ✅ |
| REQ-ORDER-04 | **No payment integration** — payment status is tracked separately, by design | user mandate (standing constraint) | `paymentStatusConfig`; no gateway code anywhere | Absence asserted by review, not by a test; critique P3-1 proposes settlement wording | design decision | ✅ (deliberate) |

### Operations & admin (`REQ-OPS`)

| ID | Requirement | Source | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-OPS-01 | Store staff can manage products, sales and banners | role model | `ProductsClient`, `SpecialsAdminClient`, `BannersClient` | `SpecialsAdminClient.test.tsx` and the admin suite, `manager-surfaces.test.tsx`, backend admin feature tests (CI) | component / system | ✅ |
| REQ-OPS-02 | Homepage hero survives an operator unpublishing a banner mid-visit | critique §Fixed-5 | `BannerCarousel.tsx` index clamping | `BannerCarousel.test.tsx` "keeps a slide on screen when the banner list shrinks under the visitor" | component | ✅ |
| REQ-OPS-03 | Banners are edited in a modal (not a route) and autoplay respects the visitor | `docs/manager-qa-refactor-plan.md`; a11y | `BannerCarousel.tsx`, `admin/Modal.tsx` | `BannerCarousel.test.tsx` (18) — autoplay, hover/focus pause, reduced motion, pause control | component | ✅ |
| REQ-OPS-04 | Dispatch: pending orders are visible and assignable; audit logs link back to /operations | `docs/manager-qa-refactor-plan.md` | `DispatchConsoleClient.tsx`, `AuditLogsClient.tsx`, `backend/app/Services/RoutingService.php` | `DispatchPanel` tests, audit-log client tests, backend routing/dispatch tests (CI), Playwright `manager-surfaces.spec.ts` (8, not in CI) | component / system | ⚠️ rider identity still `#12` — critique P1-3 |
| REQ-OPS-05 | Rider flows: dashboard, order detail with map, history | role model | `RiderDashboardClient`, mobile `RiderHomeScreen`, `RiderOrderDetailScreen`, `RiderHistoryScreen` | mobile rider suites (`model.test.ts`, `RiderOrderDetailScreen.test.tsx`, `rider-routemap-integration.test.tsx`), Playwright (not in CI) | component / integration | ✅ |

### Accessibility & resilience (`REQ-A11Y`)

| ID | Requirement | Source | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-A11Y-01 | Overlays announce themselves and can be escaped | critique P1-2 | `admin/Modal.tsx` (full focus trap), `CartDrawer.tsx` (dialog + Escape) | `CartDrawer.test.tsx` (dialog role, aria-modal, Escape, closed-state ignores Escape) | component | ⚠️ CartDrawer still lacks focus trap/restore — P1-2 |
| REQ-A11Y-02 | `prefers-reduced-motion` removes motion, never content | motion token design | `motion/react` usage across both clients; carousel autoplay guard | `BannerCarousel.test.tsx` (no autoplay, arrows still work), `src/test/setup.ts` matchMedia polyfill, mobile `accessibility-audit.test.ts` | component | ✅ |
| REQ-A11Y-03 | Images, buttons and prices are named for assistive tech | UI audit | `alt` on every media path, `aria-label` on add-to-cart and quantity controls | `SafeImage.test.tsx`, `ProductCard.test.tsx` (button name, 40 px target), mobile `accessibility-verification.test.ts`, `contrast.test.ts` | component | ✅ |
| REQ-A11Y-04 | Nothing crashes a route: bad data degrades to a placeholder | UI audit P1 | `SafeImage`, `MapContainer`, `OrderTrackingMap`, `toFiniteNumber`, `toDate`, `toMoney` | the unit suites above (each has explicit invalid-input cases) | unit | ✅ |

### Runnability (`REQ-RUN`)

| ID | Requirement | Source | Implementation | Verification | Level | Status |
|---|---|---|---|---|---|---|
| REQ-RUN-01 | `git pull && npm run setup && npm run dev` works on the user's Windows machine | user mandate | `scripts/setup.mjs`, `scripts/dev.mjs`, root `package.json`, `README.md` | Manual on Windows (Host DOJO); idempotency by design in `setup.mjs` | acceptance | ⚠️ manual only — G-2 |
| REQ-RUN-02 | Mobile stays on Expo Go 57 (fleet pin) | `AGENTS.md`; user constraint | `mobile/package.json`, `app.json`, `scripts/check-expo-sdk.js` | CI Mobile job runs `npm run check:sdk-pin` | system | ✅ |
| REQ-RUN-03 | All suites runnable with one command | user mandate | `scripts/test-all.mjs`, `npm test`, `npm run typecheck` | CI Frontend/Mobile/Backend jobs run exactly those | system | ✅ |

---

## STLC phase → artifact map

| STLC phase | Artifact in this repo | What it produces |
|---|---|---|
| Requirement analysis | `CONTEXT.md` (ubiquitous language), user mandates recorded in PR #2, `docs/manager-qa-refactor-plan.md` | The `REQ-*` ids above and the standing constraints (no payments, Expo Go 57 pin, Windows-runnable) |
| Design | `frontend/ARCHITECTURE.md`, `docs/adr/0001`–`0003`, `docs/route-explorer.md`, mobile `AGENTS.md`, theme/token modules | Decisions with alternatives and consequences; the design language this matrix verifies |
| Implementation | `backend/app/**`, `frontend/src/**`, `mobile/src/**` | Code that cites its requirement in a docblock where the reason is not obvious (`SafeImage`, `mapTiles`, `labels`, `money`, `dates`) |
| Test design | The test files named in each row — written **before** the fix for every behaviour change this session (red → green) | 1 613 automated checks across three suites |
| Test execution | `npm test` (all three), CI matrix in `.github/workflows/tests.yml` | Six green jobs; backend verified on 3 PHP versions and 2 databases |
| Release / acceptance | `GATES.md` (nine gates with reproduction commands), `README.md` quick start | The user's "everything works on my machine" gate |
| Maintenance | `backend/ci-diagnostics-*.md` (bot), `docs/ui-audit-2026-09-27.md`, `docs/design-critique-2026-09-27.md` | Drift detection and the standing backlog with one DRI per item |

---

## Known gaps (declared, not hidden)

- **G-1 — Web Playwright e2e is not in CI.** 32 tests across 12 specs (`frontend/e2e/`) cover home, products, product detail, cart, quick-add, recipes, store locator, navigation (desktop + mobile viewports), manager surfaces and the API contract. They need a seeded API and a running web server, which the current workflow does not boot. *Close it by:* adding a job that runs `php artisan migrate --seed && php artisan serve` + `next start`, then `playwright test`. Until then, web end-to-end assurance comes from component tests plus the backend's own HTTP-level feature tests.
- **G-2 — Windows acceptance is manual.** `npm run setup` / `npm run dev` are exercised by hand on the user's machine; CI runs on Ubuntu. *Close it by:* a `windows-latest` job running `npm run setup` and `npm run typecheck` (no browser needed).
- **G-3 — Real-device mobile testing is manual.** RNTL covers rendering and behaviour; GPS, camera, push and Expo Go's own runtime are verified on the device fleet. *Close it by:* an EAS build + a device checklist per release.
- **G-4 — Mapbox tiles are verified by contract, not by pixels.** Without a token in CI (deliberately — ADR 0003), tests assert the provider selection and the `L.tileLayer` arguments, not a rendered Mapbox tile.
- **G-5 — Performance is not measured yet.** `docs/manager-qa-refactor-plan.md` requires measurement-led performance work; no budget or Lighthouse/CI timing gate exists. *Close it by:* a build-size + LCP budget assertion in the Frontend job.
- **G-6 — Backend diagnostics files lag CI.** `backend/ci-diagnostics-*.md` are written by a bot on failure and can be one commit behind GitHub Actions. Trust the check statuses (`gh pr checks`), not the files.

---

## Reproducing every claim in this document

```bash
npm ci                        # root orchestrator deps
npm run setup                 # backend .env, key, migrated + seeded sqlite
npm test                      # backend + frontend + mobile, one summary
npm run typecheck             # tsc --noEmit for frontend + mobile

cd frontend && npx vitest run                      # 53 files / 466 tests
cd frontend && npx playwright test                 # 32 e2e tests (needs api + web running)
cd mobile && npm test                              # 71 suites / 670 passed / 3 skipped
cd backend && php artisan test                     # 477 tests
gh pr checks 2                                     # the six CI jobs
```
