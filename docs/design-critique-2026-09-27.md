# Checkstar design critique — whole-system cohesion review

**Date:** 2026-09-27
**Method:** ⚠️ DEGRADED: single-context (no sub-agent tool is exposed in this environment, and impeccable's CLI detector + browser overlay injection need a live browser and network, which this sandbox does not have). Assessment A (design review) and Assessment B (evidence) were therefore run by one reviewer against the repository source, its test suites and CI results rather than a rendered browser session. Every claim below cites a file, a test or a CI run so it can be checked without a browser.
**Framework:** `pbakaus/impeccable` → `.agents/skills/impeccable/reference/critique.md` (Design Health Score, Design Specificity Verdict, Priority Issues P0–P3, Persona Red Flags, Cognitive Load Assessment, Heuristics Scoring Guide).
**Surface:** the whole ecosystem — Next.js 15 storefront + admin + operations + rider web apps, Expo SDK 57 mobile app (customer/rider/store), and the Laravel 11 API as it presents itself to users.

**Evidence base at review time:** frontend 53 test files / 466 tests green, `tsc --noEmit` clean; mobile 71 suites / 670 passed / 3 skipped, `tsc --noEmit` clean; backend green on PHP 8.2/8.3/8.4 + MySQL 8 (GitHub Actions run `36287076597`, PR #2).

---

## Design Health Score

Nielsen's ten heuristics, 0–4 each (`4` = genuinely excellent). Scored *after* the fixes logged at the bottom of this document, with the pre-fix score in brackets where the session changed it.

| # | Heuristic | Score | Key issue / evidence |
|---|-----------|-------|----------------------|
| 1 | Visibility of System Status | 3 | Strong: 42 files use skeleton/shimmer loading, the tracking map shows a LIVE/STALE rider badge with a 90 s staleness threshold (`OrderTrackingMap.tsx`), login shows "Signing in…", map tiles that fail announce themselves instead of showing a black rectangle (`MapContainer.tsx` + test). Gap: sign-in and registration validate only on submit — no inline field feedback (`LoginClient.tsx`). |
| 2 | Match System / Real World | 4 [was 2] | Now speaks South African retail fluently and identically on both clients: `R 1 234.50` (`lib/money.ts`, `mobile/src/lib/currency.ts`), `27 Sep 2026, 14:30` (`lib/dates.ts`, `mobile/src/lib/formatters.ts`), "Out for delivery" / "Being packed" (`lib/labels.ts`, `mobile/src/lib/status.ts`). Durban suburbs, motorbike couriers, pack sizes ("400ml", "bunch") and a real SA pantry catalogue. Remaining nit: payment vocabulary is shown although no payment integration exists (deliberate — see P3-1). |
| 3 | User Control and Freedom | 3 | Undo on cart removal with a 5 s window (`CartDrawer.tsx`, tested), Escape closes the cart drawer and `components/admin/Modal.tsx`, "Clear" basket, cancel order, admin breadcrumbs exist (`app/(admin)/layout.tsx`, `DashboardNav.tsx`). Gap: the admin Modal has a full focus trap and focus restore; the storefront CartDrawer does not (P1-2). |
| 4 | Consistency and Standards | 3 [was 2] | Money, dates and status/role vocabulary are now single-sourced per client with mirrored test tables on both sides, and the admin kit (`PageHeader`, `SearchInput`, `EmptyState`, `ErrorState`, `StatusBadge`, `ConfirmDialog`, `Modal`) is used consistently across admin/rider surfaces. Remaining: storefront empty states and error copy are still ad hoc (P1-1), and motion tokens are parallel dialects (P2-1). |
| 5 | Error Prevention | 3 | `ConfirmDialog` on destructive admin actions; login refuses `//evil`, `https://evil` and `javascript:` redirects (tested); cart quantity can never reach 0 without an undo offer; decimal-string coordinates are coerced through `toFiniteNumber` on both clients so a `"31.02"` from the API cannot crash a map. Gap: no inline form validation on auth surfaces; no cross-field check that a sale ends after it starts is surfaced at the input. |
| 6 | Recognition Rather Than Recall | 3 | Cart drawer is globally reachable, tracking shows From / Rider / To in one row, the order timeline renders activity with human words (`humanize`), the specials editor prints each product's base price next to its input so nobody has to remember it. Gap: the dispatch console identifies riders as `Current rider: #12` (`DispatchConsoleClient.tsx`) — the person assigning the job has to recall who 12 is (P1-3). |
| 7 | Flexibility and Efficiency | 2 | Admin search, status filters, a developer store-switcher and role-scoped navigation are all present. But there are no keyboard shortcuts anywhere except Escape, no bulk status change on the orders board, no saved filters: a manager clearing 30 orders clicks per row (P2-2). |
| 8 | Aesthetic and Minimalist Design | 3 | Coherent visual language: one branded pin shared by both platforms (`PIN_BADGE_NAVY #262D3A` + brand orange `#EB6522`), `tabular-nums` on every money string, 16 px radii and a documented shadow ladder, motion derived from spring physics rather than taste. Gap: the dispatch console card gives five grey text rows equal weight next to a mono order number (Visual Noise Floor). |
| 9 | Error Recovery | 3 | `ErrorState` with retry on admin surfaces, `apiErrorReason` on mobile, `SafeImage` degrades a 404/foreign host/optimizer rejection to the branded placeholder (20 tests), map tile outages explain themselves, an undecodable route geometry falls back to a dashed straight line (`OrderTrackingMap.tsx`, tested), missing dates render an em dash instead of "Invalid Date". Gap: eight variants of "Something went wrong…" across the web. |
| 10 | Help and Documentation | 2 | Excellent for the people building it (`README.md`, `GATES.md`, `docs/adr/`, `AGENTS.md`, `docs/ui-audit-2026-09-27.md`, mobile onboarding flow). Thin for the people using it: no in-product explanation of admin metrics ("Avg Order Value"), no web onboarding, empty states rarely link to the action that would fill them. |
| **Total** | | **29/40 (72 %)** | **Good** — solid, coherent core with three priority gaps worth fixing before this is shown to real store staff. |

---

## Design Specificity Verdict

**This is an authored product, not a category-interchangeable template.** The evidence is in the details that could not have come from a generic grocery starter:

- The catalogue is a real South African pantry: 29 seeded products with brand-accurate names and pack sizes (Rajah curry powder 80 g, Tennis biscuits 200 g, Peppermint Crisp 49 g) and 29 matching 600×600 webp packshots on a white plate (`backend/database/seeders/SouthAfricanPantrySeeder.php`, `backend/public/products/`).
- Geography is load-bearing, not decorative: Durban coordinates as the default map centre (`MapContainer.tsx` → `DURBAN_CENTER`), three stores, motorbike couriers, route geometry decoded from the API into a brand-orange polyline.
- The brand mark is drawn once and reused everywhere: the orange teardrop pin with the navy locator disc and white star is the same SVG on web (`checkstarPinIcon`) and mobile (`StorePin`), sharing the `PIN_BADGE_NAVY` constant. Leaflet's default blue marker appears nowhere.
- The role model mirrors a real SA supermarket org — developer, store_owner, store_manager, logistics_officer, customer, rider — and it is enforced in three places at once (nav gating, API authorization, login routing per role, all tested).
- Money, dates and status vocabulary now follow South African conventions on purpose, with the sources recorded (`R 1 234.50`; decimal point because tills, bank statements and SA grocer sites print it; space grouping because that is the SA number convention).

**Where it goes generic:** the admin dashboard is a standard KPI-card grid; the Chart.js charts use near-default styling with only the border colour touched (`RevenueChart.tsx`); the auth pages are a centred card. None of these are wrong — they are the places where the product's character is thinnest, and they are staff-facing, where density beats delight.

---

## Overall Impression

The system feels like one product now, and it did not three days ago. The functional spine is genuinely solid: every map, cart, order, dispatch and role flow has a real render test behind it, failure paths are designed rather than accidental, and CI is green across three PHP versions, MySQL, web and mobile. The weakness was never the features — it was that the two clients had each grown their own dialect for the same three sentences (a price, a date, an order status), and that a handful of raw enum values had leaked into customer-facing text. Those are now single-sourced and mirrored by tests on both sides.

The single biggest remaining opportunity is **staff efficiency**: the customer experience is polished, but the people who run the store click too much and read too many equally-weighted grey rows. Fix the dispatch console's rider identity and give the orders board keyboard/bulk handling, and the admin stops feeling like a customer app with extra columns.

---

## What's Working

1. **Failure paths are designed, and now pinned by tests.** `SafeImage` has a documented reason for every branch (next/image throws for un-allow-listed hosts, the optimiser rejects SVG, a stored path can 404 after render) and 20 tests hold it there. `MapContainer` counts tile errors and only declares an outage after three failures with zero successes, then recovers the moment a tile lands. `OrderTrackingMap` falls back to a dashed straight line when route geometry cannot be decoded. This is the opposite of the usual "happy path only" prototype.
2. **`components/admin/Modal.tsx` is a gold-standard dialog.** `role=dialog`, `aria-modal`, labelled by its title, Escape closes, focus moves in on open, Tab is trapped between first and last focusable, and focus returns to the trigger on close. It is documented in the file header and it works. (The CartDrawer should copy it — P1-2.)
3. **Motion is engineered, not vibed.** Both clients derive their springs from physics with the damping ratio written down (`frontend/src/lib/motion/tokens.ts` computes ζ = c / 2√(mk) and estimates settling time; `mobile/src/theme/motion.ts` labels each spring with its ζ), and both honour `prefers-reduced-motion` — the carousel's autoplay is disabled by it (tested), not merely softened.

---

## Priority Issues

### [P1-1] Storefront empty states and error copy are ad hoc while the pattern already exists
**What:** `components/admin/EmptyState.tsx` and `ErrorState.tsx` are used consistently across admin and rider surfaces, and mobile has one shared `EmptyState` ("No products here yet." / "This shelf is empty for now — try another category."). The storefront does neither: "No orders yet", "No orders found", "Nothing here yet — check back soon.", "This store has no products assigned yet." and eight variants of "Something went wrong…" are written inline, each with its own weight, colour and punctuation.
**Why it matters:** an empty state is the one screen every new customer sees first, and it is where the app should say what to do next. Inconsistent copy reads as three apps stitched together — exactly the "Inconsistent Pattern" cognitive-load violation — and a support call ("it says something went wrong, what went wrong?") is the predictable outcome.
**Fix:** promote a single storefront `EmptyState` (icon, title, one line of guidance, optional action link) and a single `ErrorNotice` (what failed, why if known, a retry) and adopt them on the storefront surfaces; reuse mobile's wording where the surfaces match. Standardise on: title = what is missing, caption = what to do next.
**Suggested command:** `$impeccable clarify`

### [P1-2] The cart drawer is a modal that does not behave like the app's own modal
**What:** `CartDrawer.tsx` now has `role=dialog`, `aria-modal`, a label and Escape-to-close (added this session, tested) — but no focus management. Focus stays on the page behind the drawer, Tab walks into the storefront, and focus is not restored on close. `components/admin/Modal.tsx` already implements all three correctly.
**Why it matters:** a keyboard or screen-reader user adding an item to the cart lands in a dialog they cannot navigate, and can tab "away" into content that is visually behind a scrim. It is the most-used overlay on the storefront.
**Fix:** lift the focus behaviour out of `admin/Modal.tsx` into a shared hook (`useDialogFocus(panelRef, onClose)`) and use it in both places — one dialog pattern for the whole ecosystem, not two. Add `aria-hidden`/`inert` on the background while open.
**Suggested command:** `$impeccable harden`

### [P1-3] The dispatch console asks a human to recall database ids
**What:** `DispatchConsoleClient.tsx` renders `Current rider: #12` and a status pill, in a card of five equally-weighted grey rows.
**Why it matters:** this is the screen a logistics officer uses to get an order moving. "Who is 12?" forces a trip to the riders page — a Context Switch and a Jargon Barrier on the highest-pressure surface in the product.
**Fix:** show the rider's name, their rating and their current load (the API already carries rider relations on other surfaces), keep `#12` as a secondary mono detail, and give the card one primary element (the order number + the assign action) with everything else muted.
**Suggested command:** `$impeccable clarify`

### [P2-1] Motion tokens are parallel dialects
**What:** `frontend/src/lib/motion/tokens.ts` (`spring.apple`, `spring.snap`, `spring.press`, `ease.apple`) and `mobile/src/theme/motion.ts` (`springs.gentle/standard/snappy/bouncy/press`) express the same design intent with different numbers and different names, with nothing cross-referencing them.
**Why it matters:** the same interaction — a press, a card entering view — will physically feel different on the two clients, and there is no way to notice the drift because no test compares them.
**Fix:** write the mapping down (`docs/design-language.md`: `spring.apple ↔ springs.apple`, ζ and settling time for each) and add a token test on each side asserting the shared pairs. Do not merge the modules — the platforms' animation runtimes differ; agree the *feel*, not the code.
**Suggested command:** `$impeccable document`

### [P2-2] No keyboard efficiency for the people who use this all day
**What:** the only keyboard affordance in the web app is Escape. No `/` to focus search (`components/admin/SearchInput.tsx`), no `j`/`k` on the orders board, no multi-select, no bulk status change.
**Why it matters:** a store manager processes dozens of orders a shift. Every row is currently a click-and-wait cycle; this is the difference between a tool and a form.
**Fix:** add `/` to focus the nearest search input, `Esc` to clear it, row selection with `Shift`+click and one bulk "Confirm selected" action on the orders board. Announce bulk results with the existing toast pattern.
**Suggested command:** `$impeccable optimize`

### [P3-1] Payment vocabulary without a payment system
**What:** `paymentStatusConfig` renders payment states across order surfaces although no payment integration exists (deliberate, and correct for this prototype).
**Why it matters:** a store owner reading "payment pending" will look for a gateway that is not there.
**Fix:** rename the customer-facing wording to settlement language ("To be settled at delivery", "Settled") and keep the enum untouched in the API.
**Suggested command:** `$impeccable clarify`

### [P3-2] Counts are still browser-locale formatted
**What:** `analytics/page.tsx` (`sales.total_orders.toLocaleString()`) and `RiderDashboardClient.tsx` (`riderStats.xp.toLocaleString()`) — a US browser prints `1,234`, a South African one `1 234`, and mobile's `formatNumber` uses a non-breaking space with a comma decimal.
**Why it matters:** the same defect class as money and dates, on two small surfaces. It will keep recurring until counts have a home too.
**Fix:** add `formatCount` to the shared number modules on both clients (space grouping, no decimals for integers) and adopt it at those two sites plus `AnimatedNumber`'s default `format`.
**Suggested command:** `$impeccable polish`

---

## Persona Red Flags

**Jordan (First-Timer, customer, mobile-first, Umhlanga):** lands on the storefront, adds spinach, opens the cart, checks out. What breaks for them: (1) the login/register forms only complain after submit — Jordan types a password, hits "Sign In", and waits for a server round-trip to learn the field was empty; (2) if the cart is empty the copy is warm ("Add some groceries to get started — fresh picks await") but offers no button to go shopping; (3) on the tracking page, nothing explains *why* an order says "Finding a rider" or how long that takes. What works for them: the LIVE/STALE badge is honest, "Preparing your order — a rider will be assigned shortly" is exactly the right sentence, and a missing product image now shows the branded placeholder instead of the words "No image".

**Alex (Power User, store_manager, desktop, all day):** opens the orders board at 07:00 and works down it. What breaks: (1) no keyboard path at all — every filter change and row action is a mouse trip; (2) one status change per row, no bulk action, no saved filter for "today's pickups"; (3) `Avg Order Value` and `Total Revenue` tiles have no definition or time-range label, so Alex cannot tell whether the number is today or all-time; (4) the dispatch console's `#12` rider reference (P1-3). What works: breadcrumbs, `SearchInput`, `StatusBadge` consistency, and an audit trail that finally links back to /operations.

**Sipho (project persona — Checkstar rider, motorbike, one hand on the handlebar, Durban rain):** the mobile rider flow is his whole job. What works: large tap targets, `RouteMap`/`LiveDeliveryMap` with the same branded pin as the web, GPS staleness handled explicitly, and status vocabulary he shares with the customer ("Out for delivery"). What breaks: (1) his XP total on the web rider dashboard uses locale formatting and is the only number on that page he cannot read at a glance; (2) when the web dispatch console assigns him an order he is `#12` — the office cannot see his name, which is how mistakes get made in the rain; (3) the app has no offline copy for a failed route-geometry fetch beyond the dashed line, so in a signal dead zone he sees a straight line and no explanation.

---

## Cognitive Load Assessment

**Intrinsic load (the task itself):** choosing a store, filling a basket, tracking a delivery, dispatching riders. Irreducible and well handled — checkout sequences one decision at a time, the tracking page co-locates From/Rider/To with the map, and the specials editor prints each product's base price beside its input.

**Extraneous load (added by the design):** this is where the session's work landed.
- *Inconsistent Pattern* — **fixed**: three dialects for money, dates and status vocabulary across two clients; now single-sourced with mirrored tests.
- *Jargon Barrier* — **mostly fixed**: `out_for_delivery`, `store_owner` and `order_status_changed` reached real screens; now "Out for delivery", "Store owner", "Order status changed". **Open:** rider ids on the dispatch console (P1-3), payment vocabulary (P3-1).
- *Visual Noise Floor* — **open**: the dispatch console card gives five grey rows equal weight (P1-3 fix includes the hierarchy).
- *Context Switch* — **open**: manager → riders page to resolve `#12`; Alex → analytics to guess a time range.
- *Hidden Navigation* — **not present**: admin breadcrumbs and role-scoped nav exist; the audit-logs back link now goes to /operations.
- *Memory Bridge* — **not present** on the surfaces reviewed: the cart drawer is globally reachable and the specials editor repeats the base price where it is needed.
- *Wall of Options* — **borderline** on the admin dashboard (many tiles at once); acceptable for staff, would fail a customer.
- *Multi-Task Demand* — **not present**: checkout and dispatch sequence their steps.

**Germane load (learning the system):** the six-role model is the one thing a new staff member must learn, and it is taught implicitly by hiding what a role cannot use. It is not taught explicitly anywhere — there is no in-product explanation of what a logistics officer can do that a store manager cannot (see heuristic 10).

**Working-memory check:** no surface reviewed asks a user to hold more than three values in their head while deciding. The dispatch console comes closest (order number, status, address, rider id, item count) — which is the argument for P1-3.

---

## Minor Observations

- `components/AnimatedNumber.tsx` falls back to `n.toLocaleString()` when no `format` is passed — the same locale drift as P3-2, one file away from being fixed.
- `SpecialsAdminClient.tsx` keeps a local `formatMoney` for its decimal **input** placeholder and `toMoney().toFixed(2)` semantics. That is correct and deliberate (an editable field must hold a plain number, not `R 24.99`); it is called out here so it is not "cleaned up" into the display formatter by mistake.
- The em dash is now the app's single "unknown" glyph across dates (`DATE_PLACEHOLDER`), labels (`UNKNOWN_LABEL`) and analytics tiles. Worth writing into a design-language doc before someone introduces "N/A".
- `Logo.tsx` uses `toFixed(2)` for a pixel value — not money, correctly untouched by the money migration.
- The tile provider is resolved per map init rather than at module scope (`MapContainer.tsx`), which is what makes `NEXT_PUBLIC_MAPBOX_TOKEN` work with Next's build-time inlining; the comment in `lib/mapTiles.ts` explains why the literal expression matters. Do not "simplify" it into a module constant.
- `mobile/src/lib/formatters.ts` exports `formatNumber`, `formatRelativeTime`, `truncate` and `titleCase`, of which only `formatDate`/`formatTime` are used by screens. Harmless, but `formatNumber`'s comma decimals are a trap if anyone reaches for it to format money — money is `lib/currency.ts`.

---

## Questions to Consider

- If the dispatch console showed one thing per order — the rider's face and name — and everything else on demand, would assignments get faster or slower?
- Should the customer ever see the word "status" at all, or only sentences ("Sipho is 4 minutes away")?
- What would a confident version of the admin dashboard look like: three numbers that decide the day, instead of twelve that describe it?
- If money, dates and status now have one home each, what is the fourth dialect nobody has noticed yet — distances (`1.2km` vs `1,2 km`), phone numbers, or store names?

---

## Fixed during this review (test-first, with commits)

| # | Defect | Fix | Evidence |
|---|--------|-----|----------|
| 1 | Money rendered three ways: `R24.99` (web, 30+ inline sites), `R${v.toLocaleString()}` (charts), `R 24,99` (mobile, `Intl('en-ZA')`) | One house format `R 1 234.50` in `frontend/src/lib/money.ts` + `mobile/src/lib/currency.ts`, adopted at every display site; decimal **inputs** left alone | `money.test.ts` (18), `currency.test.ts` (8), mirrored cross-client tables |
| 2 | Dates rendered 13 ways on web (two of them bare `toLocaleDateString()`, i.e. the browser's locale) + 6 more via `toLocaleString('en-ZA')`; mobile bypassed its own `formatters.ts` in 5 places; ICU prints "Sept" or "Sep" depending on engine | One house format `27 Sep 2026, 14:30` from explicit month tables in `frontend/src/lib/dates.ts` + `mobile/src/lib/formatters.ts`; all sites adopted | `dates.test.ts` (14), `formatters.test.ts` (34) |
| 3 | Raw enums on screen: `out_for_delivery` (dispatch console), `order.status.replace(/_/g,' ')` under CSS `capitalize` → "Out For Delivery", `store_owner` on the profile, `logistics officer`/`Logistics Officer` depending on the file | `frontend/src/lib/labels.ts` (`orderStatusLabel`, `customerStatusLabel`, `roleLabel`, `humanize` in sentence case) + `statusConfig` labels now come from it; mobile `lib/status.ts` aligned and gained `retrying`/`ready` | `labels.test.ts` (30), `mobile/src/lib/__tests__/status.test.ts` (4) |
| 4 | Tile source hardcoded inside `MapContainer`; no way to adopt Mapbox without editing UI code | `frontend/src/lib/mapTiles.ts` provider abstraction: OSM with no credentials, Mapbox raster when `NEXT_PUBLIC_MAPBOX_TOKEN` is set (512 px tiles + zoom offset), token never logged or attributed | `mapTiles.test.ts` (6), `MapContainer.test.tsx` (8), ADR `docs/adr/0003-map-providers.md` |
| 5 | Homepage hero vanished when an operator unpublished a banner: a stale index pointed past the end of the list and the component returned `null` | Indices clamped in `BannerCarousel.tsx` | `BannerCarousel.test.tsx` "keeps a slide on screen when the banner list shrinks under the visitor" |
| 6 | Cart drawer had no dialog semantics and ignored Escape | `role=dialog`, `aria-modal`, label, Escape-to-close | `CartDrawer.test.tsx` (18) |
| 7 | A product with no image printed the developer copy "No image" | Renders `SafeImage` → the branded placeholder, alt text stays the product name | `ProductCard.test.tsx` |
| 8 | A missing timestamp rendered "Invalid Date" to customers | `DATE_PLACEHOLDER` em dash on both clients | `dates.test.ts`, `formatters.test.ts` |
| 9 | jsdom has no `matchMedia`, so any component honouring `prefers-reduced-motion` was untestable | Polyfill in `frontend/src/test/setup.ts` | carousel reduced-motion test |

## Backlog (each with one owner — no shared ownership)

| Priority | Item | DRI | Definition of done |
|---|---|---|---|
| P1 | Storefront `EmptyState` + `ErrorNotice` adoption (P1-1) | web storefront owner | One component each; eight "Something went wrong" variants gone; copy pattern = what is missing / what to do next |
| P1 | Shared `useDialogFocus` used by admin Modal **and** CartDrawer (P1-2) | web a11y owner | Focus in on open, Tab trapped, focus restored; background inert; both tested |
| P1 | Dispatch console rider identity + card hierarchy (P1-3) | operations owner | Name, rating, load visible without leaving the screen; one primary element per card |
| P2 | Motion-token mapping doc + parity tests (P2-1) | design-systems owner | `docs/design-language.md` table; a test on each side asserting the shared pairs |
| P2 | Keyboard + bulk actions on the orders board (P2-2) | admin owner | `/` focuses search, `Shift`+click selects, one bulk confirm, results toasted |
| P3 | Settlement wording for payment states (P3-1) | backend/API owner | Customer surfaces say "settled"/"to be settled"; enum unchanged |
| P3 | `formatCount` on both clients (P3-2) | whoever touches analytics next | No `toLocaleString()` left in a render path |

---

## Run Notes

- **Target slug:** whole repository (`frontend/`, `mobile/`, `backend/` as user-visible surface) — no single URL; this environment has no browser to point at.
- **Assessment independence:** not achieved (single context). Flagged in the header as DEGRADED rather than reported as a dual-agent run.
- **CLI detector:** unavailable — the impeccable launcher needs network + a live browser; the sandbox reaches only a small allow-list of hosts. Fallback signal used: source review plus the repository's own test suites (53 web files / 466 tests, 71 mobile suites / 670 passed) and GitHub Actions run `36287076597`.
- **Browser visibility / overlay injection:** not attempted (no browser). No user-visible overlays exist; every finding cites a file and line-level behaviour instead.
- **Live server cleanup:** no servers were started for this review; the two background test runs completed and exited.
- **Temp-file cleanup:** the impeccable clone lives in `/tmp/impeccable` (outside the repository); nothing was written into the repo except this document.
- **Snapshot persistence:** the skill's `.dsh` snapshot store is not present in this repository; this file is the persisted artifact, and `docs/ui-audit-2026-09-27.md` remains the scored UI audit it complements.
