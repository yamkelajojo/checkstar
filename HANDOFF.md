# Checkstar — Session Checkpoint

**Date:** 2026-07-29
**Branch:** `phase_two` (pushed to origin)
**Previous branch:** `phase_one` (committed and pushed with planning docs + CONTEXT.md)

---

## What's Been Done

### Phase One (committed to `phase_one`)
- Domain glossary (`CONTEXT.md`) sharpened via grill-with-docs session
  - Store failover threshold, dispatch contention (`FOR UPDATE SKIP LOCKED`), Rider availability toggle
  - Order Activity Log (append-only audit trail)
  - Product-level `sale_price` priority over Collection Specials
  - Stock decremented at Rider purchase, not order placement
  - Single role per User (reverted from multi-role)
  - Product: single category + JSON `tags` for secondary groupings
- `PHASE_ONE_SPEC.md` — original Vue 3 + Laravel spec
- `EGAD_Methodologies/` — strategy docs (borrow concepts only, not SDLC)
- `graphify-out/` — knowledge graph
- `.gitignore` updated to exclude graphify cache artifacts

### This Session (Decisions Made)

| Area | Decision |
|---|---|
| **Frontend** | Next.js (App Router) + React 19 |
| **Backend** | Laravel 11 (API-only) |
| **Auth** | Laravel Sanctum (cookie-based SPA auth; Next.js proxies `/api/*` to Laravel) |
| **UI Kit** | motion.dev/ui (strictly, all custom components use it) |
| **CSS** | Tailwind v3 + Josh Comeau CSS reset (`modern-css-reset.md`) |
| **State** | Zustand v5 |
| **Database** | SQLite (dev) → PostgreSQL (prod) |
| **Maps** | Leaflet + OpenStreetMap |
| **Pricing** | Same price across all 3 stores |
| **Cart** | Guest: localStorage (Zustand persist) → synced to DB on login |
| **Rider dispatch** | Polling (MVP), WebSockets later |
| **Rider banking** | Mock fields (prototype only, not functional) |
| **Testing** | Vitest (unit/integration) + Playwright (e2e/regression) + CI (GitHub Actions) |
| **Mobile future** | React Native (shares types, Zustand patterns) |
| **EGAD** | Borrow concepts only, not as SDLC |

### Source of Truth Location
- `C:\Users\Acer\.opensrc\sources.json` — cached packages index
  - React 19.2.8, motion (main), shadcn/ui 4.10.0, Zustand 5.0.14, Playwright 1.62.0, base-ui, MUI 9.2.0 cached locally
- `C:\Users\Acer\.opensrc\repos\github.com\motiondivision\motion\main\` — motion.dev source
- Reference repos: GreenBidder, Runnar v2 (for patterns only)
- `C:\Users\Acer\Documents\Software\2026\checkstar\original_site_issues.md` — user flow decisions
- `C:\Users\Acer\Documents\Software\2026\checkstar\PHASE_ONE_SPEC.md` — original spec (overridden by CONTEXT.md where they conflict)

---

## What's Next (Implementation Gaps)

These are the remaining gaps that need to be built:

1. **Scaffold repos** — Next.js project + Laravel API project (two directories or monorepo)
2. **DB schema** — Full migrations with column types, FKs, indexes
3. **Auth flow** — Register with role selection, login, protected routes, role-based redirects
4. **Seeders** — Demo data (3 stores, 13 categories, products, Riders)
5. **Zustand stores** — Auth store, cart store (persist middleware), order tracking store
6. **Page components** — All public pages built with motion.dev/ui:
   - Home (hero carousel, category grid, best deals)
   - About (brand story, stakeholders)
   - Products (13 categories → product listing → product detail)
   - Specials (DB-driven, not static images)
   - Consumer Services (section on relevant page, not a tab)
   - Community (Gallery + CSR merged)
   - Recipes (no submission form, fix broken links)
   - Store Finder (dedicated tab, Leaflet map + 3 store cards)
   - Contact (store locations as small cards)
   - Careers (simplified)
   - *Removed:* Tips 4 You, Competitions
7. **Admin dashboard** — CRUD for products, orders, specials, posts
8. **Delivery system** — Order lifecycle, dispatch polling, Rider claim flow
9. **Testing** — Write tests alongside code (TDD): Vitest for stores + components, Playwright for e2e flows

---

## Next Session Prompt

Copy and paste this into your next agent session:

```
Continue the Checkstar project in C:\Users\Acer\Documents\Software\2026\checkstar on branch phase_two.

Read HANDOFF.md first for full context, then read CONTEXT.md for the domain glossary.

Tech stack decisions (already settled):
- Next.js (App Router) + React 19 (not Vue)
- Laravel 11 API backend (not full-stack Laravel)
- Laravel Sanctum for auth (cookie-based, Next.js proxies /api/* to Laravel)
- motion.dev/ui for ALL custom components (strict, no exceptions)
- Tailwind v3 + Josh Comeau CSS reset
- Zustand v5 for state (with persist middleware for cart)
- SQLite (dev) → PostgreSQL (prod)
- Leaflet + OpenStreetMap for maps
- Same pricing across all 3 stores
- Vitest (unit/integration) + Playwright (e2e/regression) + GitHub Actions CI
- Polling for Rider dispatch (MVP)
- Mock Rider banking fields (prototype only)
- EGAD: borrow concepts only, not as SDLC

Source of truth: C:\Users\Acer\.opensrc\sources.json (React 19.2.8, motion, shadcn/ui 4.10.0, Zustand 5.0.14, Playwright 1.62.0 cached)

Reference repos: GreenBidder, Runnar v2.

Original site issues: orginal_site_issues.md (informs user flow decisions about tabs, pages, layouts).

The remaining gaps to implement (in order):
1. Scaffold Next.js + Laravel projects
2. DB migrations (Prisma or Drizzle)
3. Auth flow (register with role, login, protected routes)
4. Seeders (demo data)
5. Zustand stores (auth, cart, orders)
6. Page components (all 10 pages, 2 removed)
7. Admin dashboard (CRUD)
8. Delivery system (order lifecycle, dispatch)
9. Tests (TDD approach)

Using the motion.dev/ui kit is STRICTLY required for every custom component — do not hand-roll animations or component styling that motion.dev/ui provides. Check .opensrc/repos/github.com/motiondivision/motion/main/packages/ for the source.
```
