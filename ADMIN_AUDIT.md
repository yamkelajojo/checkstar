# Admin & Web Product Audit — Checkstar

Date: 2026-09-24 · Branch: `arena/01a0d214-checkstar`
Method: full read of the frontend route tree, admin screens, API layer, motion/design tokens,
backend routes/models/controllers for the sales & banners rework; live dev-server probe of all
public + auth-gated routes (curl/SSR HTML); full vitest/tsc/eslint baseline runs.
Limitation (stated honestly): no browser-automation/screenshot tooling exists in this
environment — visual checks are done against SSR HTML + component code + unit/component tests,
not pixel screenshots. The Laravel backend cannot be executed here (no PHP/Composer installable),
so P3 backend work is verified by code review + feature-test code only.

---

## 1. Baseline (before any changes this session)

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `vitest run` | **15 failing / 246** → **0 failing / 246** after baseline fixes (below) |
| `eslint src` | clean |
| `next dev` | all 11 public routes SSR 200; `/admin/*` 307 → `/auth/login?redirect=…` (guard works) |
| Backend | not executable in sandbox (no PHP) — review-only |

Baseline fixes (P0):
1. `ProductCard.test.tsx`, `ProductsClient.test.tsx` — `motion/react` mocks were missing
   `useReducedMotion` (the component uses it; 14 tests crashed at render).
2. `RecipeDetailClient.tsx` — the ingredient-popover product link had regressed to a generic
   "View product page" label; restored per-product accessible name (matches the repo's own
   standard: "Add {product} to cart" aria-labels).
3. `ProductCard.tsx` — Special badge weight had drifted to `font-semibold`; the test encodes
   the explicit user request (black badge, *lighter* weight) → back to `font-medium`.

## 2. Screen map (web admin area)

Nav today: **no persistent navigation.** `DashboardNav` is a breadcrumb ("Back / label"). The
only IA is the dashboard's role-filtered link-card grid. 16 pages, ~3,300 lines of client code.

| # | Screen | Purpose (JTBD) | Users | Data | Actions | Verdict |
|---|---|---|---|---|---|---|
| 1 | `/admin/dashboard` | "What do I need to do right now?" | all staff | stat tiles (dev), tools grid, recent orders, health | navigate | **Rework**: static tool list; no "needs attention"; recent orders deep-link to the *customer* order page; staff dashboard has no Sales tool despite owners/managers now managing sales |
| 2 | `/admin/banners` | Front the home page with promos | dev/owner/mgr | banner CRUD, free-form slides | create/edit/delete | Keep. Slide editor is good. **Extend**: show sale linkage |
| 3 | `/admin/staff` | Hire/fire store team | owner/dev | roster, hire form | add/revoke | Keep (owner protection, 409 handling — solid) |
| 4 | `/admin/inventory` | Keep shelves stocked | mgr/logi/owner/dev | stock rows, low/out counts, filters | adjust stock | Keep. **Fix**: developer types raw `store_id` → store select |
| 5 | `/admin/orders` | Move orders through fulfillment | mgr/logi/owner/dev | order rows, status filter, search | status transitions | Keep. **Fix**: raw `store_id` for developer → store select |
| 6 | `/admin/messages` | Answer customer contact form | dev only | inbox, reply | read/reply | Keep dev-only (platform inbox), but the dashboard *must not* offer it to roles that 403 — it doesn't (tested) |
| 7 | `/admin/products` | Catalog CRUD | dev | product form (incl. `sale_price`!) | CRUD | Keep. Note: the old per-product `sale_price` field is superseded by sale scoping — flag, don't break |
| 8 | `/admin/categories` | Catalog taxonomy | dev | CRUD | CRUD | Keep |
| 9 | `/admin/specials` | **Run sales** | dev only today | title/slug/dates only | CRUD | **Rework (core)**: no product management exists in the UI ("where do sale products come from?"); developer-only though owners/managers must manage their store's sales; UI optional-dates vs new API required-dates mismatch; no banner linkage; no status |
| 10 | `/admin/stores` | Chain locations | dev | CRUD | CRUD | Keep |
| 11 | `/admin/users` | Platform accounts | dev | role/active, delete | edit/delete | Keep (dev = platform admin) |
| 12 | `/admin/riders` | Rider fleet | dev | store/vehicle/radius | edit | Keep dev-only (logistics officer *views* riders via operations, per CONTEXT.md) |
| 13 | `/admin/recipes` | Public recipes content | dev | CRUD | CRUD | Keep, group as "Content" |
| 14 | `/admin/community` | Public community posts | dev | CRUD | CRUD (native `confirm()`) | Keep; replace `confirm()` with shared ConfirmDialog |
| 15 | `/admin/careers` | Public job listings | dev | CRUD | CRUD (native `confirm()`) | Keep; same fix |
| 16 | `/admin/health` | Platform diagnostics | dev | service status | — | Keep as detail page; dashboard widget stays the glance. Not a real duplicate |

Adjacent operational surfaces (outside `/admin`, role-gated): `/operations` (live ops),
`/operations/analytics`, `/operations/audit-logs`, `/account/dispatch` (dispatch console).
These are the fulfillment cockpit; they overlap with `/admin/orders` only in that both show
order status. Division of labor is defensible (admin = store context, dispatch = rider
assignment) but the dashboard must present them as one "Operations" area, not loose links.

### Consensus duplicates / weak screens
- **No page is cut.** Every screen maps to a real job. The real IA problem is *navigation and
  grouping*, not page count. Recipes/Community/Careers belong in one "Content" group (public-site
  marketing content), not sprinkled into "Catalog Management".
- **`/admin/health` vs dashboard widget** — glance vs detail; both keep.
- **Real consolidation win**: Sales + Banners are one workflow (a sale *is* what the banner
  fronts). Admin treats them as strangers. The rework links them (sale page can create/link its
  banner; banner list shows what it fronts).

### Missing workflows (P1)
1. **Create a sale with its products in one flow** — the explicit gap. Product picker with
   optional per-product special price (default = current price, per locked decision).
2. **Sale landing page `/specials/[slug]`** — public route missing; banner CTAs have nowhere
   canonical to point.
3. **Sales on the staff dashboard** — owner/mgr manage sales but their dashboard has no tile.
4. **Developer store pickers** — raw numeric `store_id` inputs in Orders + Inventory.
5. **Staff dashboard "needs attention"** — pending orders, low stock: today the dashboard is a
   static list, not a cockpit.

## 3. Findings register (P0–P5)

**P0 — broken**
- P0-1 ✅ (fixed) 15 frontend test failures (mock/label regressions).
- P0-2 `/admin/specials` UI is incompatible with the new sales API (required dates, store
  scoping) and has no product management → **rework**.
- P0-3 Public `/specials/[slug]` missing → **build**.

**P1 — workflow**
- P1-1 Sale manager: create/edit sale + product sync (optional special prices) + optional linked
  banner (CTA auto-normalised to `/specials/{slug}` by backend); roles dev/owner/mgr; owner/mgr
  store-scoped (backend-enforced, UI shows context); status (live/scheduled/expired/paused).
- P1-2 Dashboard recent orders → link to `/admin/orders` (staff), not customer order detail.
- P1-3 Sales tile on staff dashboard (owner/mgr); Specials tile role-list updated.
- P1-4 Developer store **selects** in Store Orders + Inventory (replace raw id inputs).

**P2 — information architecture**
- P2-1 Persistent admin nav: sidebar (desktop) / menu (mobile) in the `(admin)` layout,
  role-filtered, grouped by job: **Store** (Orders, Inventory, Staff, Sales, Banners) ·
  **Fulfillment** (Live Ops, Dispatch) · **Catalog** (Products, Categories, Stores) ·
  **People** (Users, Riders) · **Content** (Recipes, Community, Careers) · **System**
  (Messages, Health, Analytics, Audit). Active-state highlighting. Dashboard stays the
  overview; nav is how you get around.
- P2-2 Staff dashboard "Needs attention" strip: pending orders + low stock counts for the
  logged-in store (owner/mgr/logistics), linking to the two screens.

**P3 — design system**
- P3-1 No shared admin primitives exist (`components/ui` has 4 decorative items only). Every
  screen hand-rolls headers, search inputs, modals, empty/error states — 3–4 subtly different
  ways. New: `components/admin/{PageHeader, SearchInput, Modal, ConfirmDialog, EmptyState,
  ErrorState, StatusBadge}` — one pattern each. Migrate the screens this session touches
  (Specials, Banners, Dashboard, Community, Careers); remaining CRUD pages migrate in a follow-up
  (avoid a massive rewrite over taste).
- P3-2 Replace native `confirm()` (Community, Careers) with the shared ConfirmDialog.
- P3-3 Header typography drift: recipes/community/careers use `text-2xl font-bold` while all
  other screens use `font-display text-3xl` → standardise via PageHeader.

**P4 — interaction & polish**
- P4-1 Modals: no focus trap, no Esc, no `aria-modal`, no focus return (all hand-rolled) →
  handled by the new Modal primitive on migrated screens.
- P4-2 ConfirmDialog destructive-action wording (Community/Careers delete, sale delete).

**P5 — performance & accessibility**
- P5-1 Admin list pages fetch everything client-side (fine at current scale; no pagination
  needed yet — catalog is small, stores are few).
- P5-2 Touch targets / focus visibility on admin icon buttons (p-2 icon buttons ≈ 24–32px) —
  address in migrated screens (min 40px hit area where cheap).
- P5-3 Mobile SaleScreen + banner-tap→sale (mobile app) — **deferred**, requires Expo + device;
  tracked in POLISH_PLAN.

## 4. Implementation plan (this session, in order)

1. **Types + API layer** (`types`, `lib/api.ts`, `lib/query.ts`): `Special.store_id/is_active/
   banner/in_window`; `syncSaleProducts`, `getSaleBySlug`, `useSaleDetail`; banner `special_id`.
2. **Admin primitives** (`src/components/admin/*`) + tests (Modal focus/Esc/aria, StatusBadge).
3. **SpecialsAdminClient rework** (P0-2, P1-1) + tests (roles, store scoping, validation,
   product picker, optional special price, banner link, status).
4. **Public `/specials/[slug]`** landing (P0-3) + tests (live/ended states, add-to-cart, dirty
   data).
5. **Dashboard** (P1-2, P1-3, P2-2): staff cockpit "needs attention", Sales tile, recent-orders
   link fix; update `manager-surfaces.test.tsx` expectations.
6. **Banners**: linked-sale badge + link (P1-1 surface), Modal/EmptyState/ErrorState migration.
7. **Admin nav sidebar** (P2-1) + tests (role filtering, active state, mobile menu).
8. **Store selects** in Orders + Inventory for developer (P1-4) + test updates.
9. **Community/Careers**: ConfirmDialog + PageHeader standardisation (P3-2, P3-3).
10. Verify: tsc, eslint, full vitest, `next build`, dev-server route probe; final ruthless pass.

## 5. Status (2026-09-24 — plan §4 executed in full)

| Step | Item | Status |
|---|---|---|
| 1 | Types + API + query hooks (`useSaleDetail`, `syncSaleProducts`, banner `special_id`) | ✅ done, typed |
| 2 | Admin primitives: Modal (trap/Esc/aria/focus-restore/scroll-lock), ConfirmDialog, PageHeader, SearchInput, EmptyState, ErrorState, StatusBadge | ✅ done + Modal 4/4, AdminNav 5/5 tests |
| 3 | SpecialsAdminClient rework (sale manager: list + editor + banner link) | ✅ done, 11/11 integration tests (payload-level assertions) |
| 4 | Public `/specials/[slug]` landing | ✅ done, 5/5 tests (live/ended/upcoming/404/no-products) |
| 5 | Dashboard: staff cockpit (resolveUserStore), needs-attention strip, Sales tile, recent-orders link | ✅ done, manager-surfaces 20/20 |
| 6 | Banners: linked-sale badge + link, Modal/EmptyState/ErrorState/ConfirmDialog migration | ✅ done |
| 7 | AdminNav (grouped, role-filtered, fixed sidebar / mobile drawer) wired into `(admin)/layout.tsx` | ✅ done, 5/5 tests |
| 8 | Developer store **selects** in Store Orders + Inventory (raw id input removed) | ✅ done |
| 9 | Community/Careers: ConfirmDialog + PageHeader + Modal + enabled-aware queries | ✅ done |
| 10 | Verify: tsc clean, eslint clean, **vitest 274/274** (was 246; +28 new tests), `next build` ✅ (incl. `/specials/[slug]` ƒ), dev-server route probes 200 | ✅ done |

Deferred (documented, not forgotten): mobile P5 (SaleScreen, banner-tap), full design-system
migration of the 10 untouched CRUD screens, backend execution in a PHP-capable environment.
