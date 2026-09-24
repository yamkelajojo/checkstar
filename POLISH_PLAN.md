# Checkstar — Polish & Sales Architecture Plan

> Status: **in progress** — P1 + P2 (mobile) ✅ done & verified · P3 (backend) ✅ written,
> pending execution in a PHP-capable environment · **P4 (web) ✅ done 2026-09-24** (see
> `ADMIN_AUDIT.md` §5) · P5 (mobile sale screen) + P6 (regression) pending
> Branch: `arena/01a0d214-checkstar` · Last verified commit: `8a6ef88`
> Scope: mobile polish (stability + consistency), and the Sales ↔ Banner end-to-end flow (backend → web → mobile).

---

## 0. What I found (system map)

**Architecture**
- `backend/` — Laravel 11 + Sanctum. Public API (`/api/…`), store-ops API (`/store/…`, `/operations/…`), developer-admin API (`/admin/…`).
- `frontend/` — Next.js (App Router). Public storefront, `/admin/*` (mixed: developer pages + store-owner/manager pages, each page self-gates), `/account/*`, `/rider/*`.
- `mobile/` — Expo SDK 57 (pinned, enforced by `scripts/check-expo-sdk.js`), React Navigation (native stack + a 5-tab PagerView), TanStack Query, Zustand, jest-expo tests (64 suites / 611 tests), design tokens in `src/theme/` (single source of truth).

**Key data model (as-is)**

| Entity | Table | What it is today |
|---|---|---|
| `Special` | `specials` + `product_special` pivot (with `special_price`, added 2026-08-25) | **This is the "sale"**: title, slug, description, `banner_image`, start/end, `is_active`, products. Public `GET /specials` returns active specials with products + computed `effective_price`. |
| `BannerCreative` | `banner_creatives` | Purely **visual** slides JSON (title/subtitle/CTA/`url`/bgType/colors/pattern), `store_id`-scoped, `status` draft/published, date window. **No link to any sale or product.** |
| `Promotion` | `promotions` | Checkout discount **codes** (percentage/fixed). Unrelated to banners. |

**Why "I don't know where the sale products come from" (answering directly)**
- Sale products exist **only because `SpecialSeeder` attaches them** (`product_special` rows). There is **no admin endpoint and no UI** to attach/detach products or set `special_price` — `Admin\SpecialController` is CRUD on the sale header only, and it is **developer-only** (`role:developer` route group), with **no store scoping**.
- Banners are created in `/admin/banners` by owner/manager/developer, with a **free-text CTA URL** (seeded banners point at `/specials` generically or `/products`). Tapping a banner on mobile does **nothing** (`onSlidePress` is never passed by HomeScreen); on web only the CTA button links.

**Mobile "Apple polish pass" (commits `d8c7ff3`→`8a6ef88`) introduced:**
`TabScreenWrapper` (directional slide + motion blur + ghost trail), `FadeSlideIn` / `CrashCascadeIn` (tab-coordinated re-animation, scale/rotate), `PhysicsCarousel` (`Animated.createAnimatedComponent(FlatList)` + per-card worklet scale/translate/opacity + JS→UI-thread spring on momentum end), `ScrollAwareCard`, `AnimatedTabBar` (per-tab spring scale + JS-thread reads of shared values for color), new `EmptyState` (72px circular chip, −4° rotation spring, tab-coordinated). The pre-polish `EmptyState` (see git `ae29419`) was a **plain 44px glyph → title → caption** with a gentle fade/rise — this is the style the user wants back.

---

## 1. Doc cleanup (✅ done)

Deleted (19 files, all tracked):

| File | Why it's gone |
|---|---|
| `HANDOFF_CRASH_DEBUG.md` | Crash is fixed (app runs); doc was for the next debugger. |
| `LOCAL_AGENT_HANDOFF.md` | Session-specific Windows handoff; branch/commit info now stale. |
| `mobile/DEBUG_FIX_SUMMARY.md` | Superseded by the crash fix + tests. |
| `test_output2.txt`, `mobile/test_output.txt` | Garbled console dumps. |
| `backend/artisan*.log` (4), `mobile/metro*.log` (6) | Runtime logs. |
| `backend/seed_banners.php` | Superseded by `database/seeders/BannerSeeder.php`. |
| `backend/seed_store_products.php`, `seed_store_products_test.php` | Scratch; `SouthAfricanPantrySeeder` already seeds `StoreProduct` rows. |
| `frontend/pin-check.png` | Screenshot artifact. |

Also fixed `README.md`: it carried **two contradictory SDK-pin warnings** (57 and 54). Kept 57 (matches `package.json` `~57.0.24`, `app.json` `sdkVersion 57.0.0`, and the `check-expo-sdk.js` guard).

**Kept (important):** `CONTEXT.md` (ubiquitous language), `docs/adr/0002-tamagui-design-system-adoption.md` + ADR 0001 (design-system decisions), `docs/route-explorer.md` (feature spec), `frontend/ARCHITECTURE.md`, `mobile/AGENTS.md` / `mobile/CLAUDE.md` / `mobile/README.md` (SDK pin banner, run instructions), `checkstar.md` (brand/site research = context), `checkstar_recipes.md` + `products_dataset/` + `new_images_for_content/` (seeder content — referenced by `ProductSeeder`/`RecipeSeeder`), `original_site_assets/` (brand reference), logo HTML + `cs.png`.

---

## 2. Mobile app polish

### B1. Crash safety + simplify scroll motion (highest priority)

Principle: **no Reanimated worklets on scroll paths, no JS-thread reads of shared values for styling, no entrance re-triggering on tab changes.** Keep the native `PagerView` (tab swipe is fine) and **keep the slight edge fades** (the "slight blur on the edges" you liked — those are `FadeEdgeScroll`'s gradient overlays, not a real blur; we keep them, made simpler).

| File | Change |
|---|---|
| `PhysicsCarousel.tsx` | Replace `Animated.createAnimatedComponent(FlatList)` + `useAnimatedScrollHandler` + `onMomentumScrollEnd` spring + `ScrollAwareCard` wrapping with a **plain `FlatList`**: `horizontal`, native `snapToInterval`, `decelerationRate="normal"`, no per-card transforms. This removes the top crash suspect (worklet transforms per card + JS→UI-thread `withSpring` during momentum). `ScrollAwareCard.tsx` deleted. |
| `FadeEdgeScroll.tsx` | Keep the two LinearGradient edge overlays (the "slight blur on edges") but make them **static** (always-on, `pointerEvents="none"`) — remove `Animated.ScrollView` + `useAnimatedScrollHandler` entirely. Zero animation, zero crash surface, identical look while scrolling. |
| `TabScreenWrapper.tsx` | Remove motion blur (`getMotionBlurStyle/Intensity`), ghost trail layer, directional parallax, mount scale. Becomes a plain `View` passthrough (kept as a context provider wrapper for `TabTransitionContext` so child APIs don't churn). |
| `FadeSlideIn.tsx` / `CrashCascadeIn.tsx` | Strip tab-coordination re-triggering, X-translation, scale, rotate. One subtle entrance **on mount only**: opacity 0→1 + 8px rise, 240–300ms ease-out, small capped stagger (≤30ms/item, cap 400ms total). `useReducedMotion` → instant. |
| `AnimatedTabBar.tsx` | See B2. |
| `RootNavigator.tsx` | Remove the custom `Easing.bezier(0.16,1,0.3,1)` screen easing (crash-handoff hypothesis #5; use RN default iOS push/pop). |
| `HomeScreen.tsx` hero | After B1 the hero no longer contains transformed animated views (FadeSlideIn becomes fade-only). If any residual iOS LinearGradient+transform instability appears on device, move the logo/store row outside the `LinearGradient` (noted as fallback, not primary). |

**Crash images note:** the attached crash screenshots did **not** land in my workspace (I can't see them). My code-level analysis + the crash handoff doc points at exactly the components B1 removes. If you re-send the images I'll cross-check before/after.

### B2. Bottom tab bar — active state

Bug: icon/label color is computed in **JS render** from `progress.value > 0.5` where `progress` is a UI-thread `useDerivedValue`. JS reads of shared values during render are stale/prone to desync — this is how "on Home, the Account icon renders active" happens (stale scroll position after tab jumps, deep-link restores, or fast swipes). Per-tab spring scale/translateY adds nothing useful.

Fix (`AnimatedTabBar.tsx`):
- Color + weight come from the **React `activeIndex` prop** (single source of truth): active = `brand.orange`, strokeWidth 2.2, label 600; inactive = `text.disabled`, strokeWidth 1.8, label 500. No shared-value reads in render.
- Keep the top **sliding indicator** (it's the part that felt right) — still driven by `scrollPosition/scrollOffset` shared values from `PagerView`, which is a legitimate UI-thread-only usage.
- Remove per-tab `progress` derived value, spring scale, translateY.
- `CustomerTabs.tsx`: keep PagerView + shared values (now only fed to the indicator).
- **Test:** render CustomerTabs; press each tab; assert exactly one icon has the active color and `accessibilityState.selected`; assert indicator translateX ≈ index × tabWidth.

### B3. Card widths & grid consistency

Findings:
- `ProductCard` is used at **two widths**: ~174.5px in 2-col grids (`(393 − 2×16 − 8)/2`) and 200px in carousels (hardcoded `snapInterval=200`), while its internals are fixed (132px image frame, 94px circle, `minHeight: 238`) → same card looks different everywhere; carousels on other screen widths are misaligned with their snap.
- Grid layout uses `columnWrapperStyle={{ gap, paddingHorizontal }}` + `contentContainerStyle={{ gap }}` — works, but each screen hand-rolls it (Home New Arrivals, Browse, Favorites), and carousel cards don't share the column width.

Fix:
- New `components/shared/ProductGrid.tsx`: owns the 2-col layout math from `useWindowDimensions` (`columnWidth = (width − 2×screenPadding − inlineGap) / 2`) and renders `ProductCard` per column with equal widths/heights.
- `ProductCard` becomes **width-agnostic**: fills its parent (`flex: 1`), image area sized by aspect (keep 132px height at grid width; same inside carousel because carousel item width = `columnWidth` → cards are pixel-identical in grid and carousel).
- New `components/shared/ProductCarousel.tsx` (replaces `PhysicsCarousel`): plain horizontal `FlatList`, item width = `columnWidth`, native snap, consistent start/end padding = `screenPadding`. Used by Home (Best Deals / Trending / Popular) and any other carousel.
- Home New Arrivals + Browse + Favorites all consume `ProductGrid` → one grid spec everywhere.
- **Tests:** at 393pt the column width is 174.5 (deterministic); carousel item width equals grid column width; no hardcoded `snapInterval` left in feature code (arch test).

### B4. Empty states & icon style (back to the old look)

- `EmptyState.tsx` → restore the pre-polish design from `ae29419`: **bare glyph (44px, `text.tertiary`, strokeWidth 1.75) → title → caption**, no circular chip, no border/shadow, gentle fade + 8px rise, no rotation, no tab re-trigger. Keep `action` slot (Retry button etc.).
- Sweep **every** screen to the same spec (icons from lucide, same sizes): Home (store), Browse, Favorites, Cart, Search, Account (orders), Rider (history/orders). Error states get the same layout + `action` (Retry) — currently some are ad-hoc.
- Icon system: single source of sizes (nav 22 / header 16 / section 16 / empty 44 / inline 12), default strokeWidth 2 (2.2 active only), no emoji glyphs in section headers (Account uses a "📍" emoji chip today — replace with lucide `MapPin`).
- **Tests:** EmptyState renders glyph+title+caption with no rotate transform; every screen's empty/error state uses `EmptyState` (arch test).

### B5. Account screen (cut-off Developer button, ugly layout)

Root cause of the cut-off: the screen is a **plain `View` (flex:1), not scrollable**. With a few orders the nested `FlatList` + the `__DEV__` Developer Settings block overflow the page bottom and there is **nothing to scroll** — hence "cut and I can't scroll to see it".

Fix:
- Wrap the whole screen in a `ScrollView` (`keyboardShouldPersistTaps="handled"`, `contentContainerStyle` bottom padding 32 + inset).
- Orders: render as a `map` of order rows inside the ScrollView (no nested `FlatList`); keep Reorder action; cap list with "View all" if > 10 (link to Orders list) — keeps the page short on purpose.
- **Developer Settings**: a normal full-width row at the very bottom (Settings icon + label + chevron), expanding **inside** the scroll flow with its API-URL panel beneath, so it is always fully reachable and never clipped. (It stays `__DEV__`-only.)
- Layout consistency: one `SectionHeader` component (16px icon in a 28px chip + h3 title + optional count pill) used by Appearance/Addresses/Orders/Developer; 16px screen padding everywhere; consistent 12px element gaps; avatar block compacted (logo → 72px avatar → name/email); Appearance toggle row inside a standard card; order rows use the shared card surface spec (same as B6).
- **Tests:** render with 30 seeded orders → Developer Settings row exists in scroll content and its expanded panel is below it (not clipped by a fixed-height parent); sign-in/out buttons; theme toggle persists.

### B6. General consistency sweep (spacing, surfaces, headers)

- One **card surface recipe** (tokens only): `surface.primary`, radius `card` (16), `border.subtle` 1px, shadow `0/1 0.03/4` (rows) or `0/2 0.06/8` (elevated cards) — applied to ProductCard, order rows, settings rows, section chips.
- Replace hardcoded paddings/gaps in screens with `semanticSpacing` (16/12/8/4); section vertical gap standardized at 24 (`sectionGap`); remove one-off values (`marginBottom: 6`, `gap: 10`, `paddingVertical: 2`…).
- Header pattern: keep `ScreenHeader` for pushed/tab screens; Home's hero header keeps its compact layout but uses the same row heights (44px tap targets).
- Existing token/consistency tests (`design-token-audit`, `token-consistency`, `accessibility-*`) extended to new components; run the full suite after each phase.

### B7. Mobile test plan (new + updated)

1. **Tab bar active state** (B2) — press/simulated swipe matrix.
2. **Horizontal scroll regression** (B1) — render Home + Browse with mocked 20-product feeds; fire `onScroll`/`onMomentumScrollEnd` events through the carousel; assert no throw. Arch test: no `Animated.createAnimatedComponent` / `useAnimatedScrollHandler` / `'worklet'` in carousel/edge-fade/tab-wrapper files.
3. **Grid geometry** (B3) — column width, carousel==grid width, 2-col wrap at 320pt and 430pt widths.
4. **EmptyState regression** (B4) — snapshot-style: no rotation, glyph present, action renders.
5. **Account screen** (B5) — scrollable structure, dev settings reachable, order row actions.
6. **Banner→sale navigation** (Part C) — slide press navigates to `SaleDetail` with the sale's slug; standalone slides map internal URLs only.
7. Keep the existing 64 suites green; update tests that asserted the removed animations (`tabTransitions.test.ts`, entrance-related expectations).

---

## 3. Sales ↔ Banners end-to-end (the big one)

### C1. Design decision

**`Special` IS the sale.** We do not introduce a new entity. A banner becomes the **visual face** of a sale:

```
Special (sale) 1 ──── < 1 BannerCreative (optional, linked via special_id)
Special N ──── M Product  (pivot: product_special.special_price — already exists)
```

- Manager/Store Owner (and Developer) **creates the sale**: name, dates, store, products + optional per-product special price, and a banner design in the same flow. The system creates/keeps a linked `BannerCreative` so the home page shows it.
- **Standalone banners stay** (e.g. "Download the app", branding) — the existing slide editor continues to work for those.
- Roles (matches your "consider access roles" note):

| Action | developer | store_owner | store_manager | logistics_officer | customer/rider |
|---|---|---|---|---|---|
| Create/edit/delete **sales** (own store) | ✅ (global + any store) | ✅ own store | ✅ own store | ❌ | ❌ |
| Create/edit/delete **banners** (own store, incl. sale-linked) | ✅ | ✅ | ✅ | ❌ (unchanged) | ❌ |
| View public specials/banners | ✅ | ✅ | ✅ | ✅ | ✅ (public) |

### C2. Backend

**Migrations**
1. `add_special_id_to_banner_creatives_table` — `foreignId('special_id')->nullable()->constrained()->nullOnDelete()`.
2. `add_store_id_to_specials_table` — `foreignId('store_id')->nullable()->constrained()->nullOnDelete()` + index (null = chain-wide, developer-only).
3. One-off **data migration**: banners whose slides link `/specials` (the seeded "Winter Warmers Sale") → link to the `winter-warmers` special.

**Models**
- `BannerCreative`: + `special()` relation, `special_id` in fillable.
- `Special`: + `store()` relation, `banner()` hasOne relation; scope `activeWindow()`.
- `ProductSpecial` unchanged (pivot `special_price` already there).

**API changes**
| Endpoint | Change |
|---|---|
| `GET /specials` (public) | Unchanged shape; add `store_id`, `store` (id/name/slug) per special. |
| `GET /specials/{slug}` (public, **new**) | Single sale: special + products (same enrichment as index: images absolutized, `stores` availability, `effective_price`). 404 if unknown. |
| `PUT /admin/specials` etc. | Move out of `role:developer` group into `role:developer,store_owner,store_manager` group; controller resolves store via `StoreContext` (developer: `store_id` optional → null = chain-wide; owner/manager: forced to their store); validate `special_price` values exist. |
| `PUT /admin/specials/{id}/products` (**new**) | Idempotent full sync: `{ products: [{ product_id, special_price? }] }` — detach missing, attach/update rest; 422 on unknown product or non-numeric price; store-scoped. |
| `POST/PUT /admin/banners` | Accept `special_id` (nullable exists); when set, server sets each slide's `url` to `/specials/{slug}` so old clients still land correctly; cannot set `special_id` on a banner belonging to another store. |
| `GET /banners` (public) | Each banner + `special: {id, slug, title} | null` (summary only) so clients can deep-link. |
| `DELETE /admin/specials/{id}` | Cascade: linked banner deleted (`nullOnDelete` + explicit cleanup), pivot rows cascade. |

**Pricing** — no changes: `PricingService` already cascades product `sale_price` → special pivot price → base price. Per-product `special_price` left empty = product's own sale/base price applies (sale membership alone is the grouping).

### C3. Web — admin

`/admin/specials` becomes the **Sales** surface (list: title, slug, store, dates, product count, status, linked-banner chip) for owner/manager/developer (was developer-only; gate updated, developers see all stores):
- **Create/Edit Sale** (full page, not a cramped modal):
  1. Sale details: name (slug auto from name, editable), description, start/end, active toggle, store (locked for non-developers).
  2. **Products**: search box (add `search` param to `GET /admin/products` if missing), checkbox list with name + current price, optional **special price** input (R, decimal) per row, remove; summary "N products, M with special price".
  3. **Banner**: toggle "Show on home page banner" → preset gradient swatches (brand orange, dark, green, blue) + pattern pick; auto title/subtitle from sale (editable); CTA fixed to "View sale" → `/specials/{slug}`; preview thumbnail.
  4. Save = one transaction: upsert special, sync products, upsert linked banner (status/dates mirror the sale).
- `/admin/banners` keeps standalone banners; sale-linked banners show a "Linked to **Winter Warmers**" chip and their slide CTA is read-only (derived from the sale). Deleting a sale deletes its banner (confirmation says so).
- Dashboard grid: "Sales" tile now visible to owner/manager/developer (currently `roles: ['developer']`); Banners unchanged.

### C4. Web — public

- **New `/specials/[slug]`** (sale landing): hero (sale `banner_image` if set, else brand gradient) with title/description/dates + Active/Ended badge; product grid (existing `ProductCard`, 2/4/5 cols); "All specials" link; 404 page for unknown slugs.
- `/specials` index: each sale gets a "View sale →" link to its landing (today it's one long list).
- **`BannerCarousel`**: slide with linked special → the **whole slide is a `Link` to `/specials/{slug}`** (click anywhere), CTA button says "View sale". Standalone slides keep current CTA-URL behavior. Whole-slide click + visible affordance (cursor/CTA) is the best-practice pattern for promo banners here.

### C5. Mobile

- **New `SaleDetailScreen`** (`/specials/{slug}` data): sale header (title, dates, Active/Ended chip, hero image if present) + **`ProductGrid`** of sale products (add-to-cart, % OFF badges) + unified empty/error states. Added to `RootStackParamList` + `linking.ts` so deep links work.
- **Home banner tap**: `HomeScreen` passes `onSlidePress` to `BannerCarousel` → slide with `special` → `navigate('SaleDetail', { slug })`; standalone slide with internal `url` → small whitelist map (`/products` → Browse tab, others no-op). No more dead tap.
- **Best Deals** section: keep (flattened sale products) — it now stays in sync automatically because sales are real sales.
- Slide type gains optional `special: {id, slug, title}` (from the enriched public banners endpoint) + optional `image` on slides for future banner art.

### C6. Seeders & data

- `SpecialSeeder`: assign `store_id` (store 1) to demo sales; keep product attach (with prices).
- `BannerSeeder`: link the "Winter Warmers Sale" slide's banner to the `winter-warmers` special (replaces the free-text `/specials` url), keep the standalone "Download the App" banner unlinked.
- Fresh-DB flow stays: `php artisan migrate --seed`.

### C7. Tests (backend → web → mobile, in that order per phase)

- **Backend feature tests**: owner/manager create+edit sale in own store; 403 cross-store; developer global + explicit store; product sync (attach/detach/price validation/unknown product 422); public `/specials/{slug}` (found/404); banner with `special_id` (public payload includes special summary; old client still gets `slides[].url=/specials/{slug}`); sale delete cascades linked banner; existing 439 backend tests stay green.
- **Frontend**: sale landing page (mock API → products render, link back to /specials, 404); `BannerCarousel` whole-slide href includes `/specials/{slug}`; admin sale form (product picker add/remove, special price input, banner toggle, role gate for owner vs logistics-officer); specials index per-sale links.
- **Mobile**: `SaleDetailScreen` render + add-to-cart; banner slide press → navigation params; carousel/banner edge-fade no-throw scroll simulation (B1); ProductGrid geometry (B3).

---

## 4. Implementation order (phased, each phase ends with the relevant suites green)

| Phase | Contents | Why first |
|---|---|---|
| **P1** | B1 crash/motion simplification + B2 tab bar + B4 empty states | Stability + the things you disliked most; lowest risk; unblocks everything else on mobile. |
| **P2** | B3 grid/cards + B5 account + B6 consistency sweep + B7 tests | The "not 100% polished" layer, built on P1's primitives. |
| **P3** | Backend sales model + API + roles/scoping + tests | Foundation for the web/mobile sale UI; fully testable in isolation. |
| **P4** | Web admin Sales UI + banner linking + public sale landing + banner clicks | Store owners can actually create sales end-to-end. |
| **P5** | Mobile `SaleDetailScreen` + banner tap + seeders/data migration | Closes the loop on the app. |
| **P6** | Full regression (backend 439 / frontend / mobile 64 suites), device smoke list, doc refresh (README, CONTEXT.md gets the clarified "Sale = Special + linked banner" language) | "Everything must function. No crashes." |

Device smoke list (per phase, Expo Go 57.0.0): launch → swipe all 5 tabs fast ×10 → scroll each Home carousel to the end (forward + flick) → pull-to-refresh on Home → open sale banner → SaleDetail → add items → cart → checkout → sign in/out on Account → expand Developer Settings.

### Phase status (2026-09-24)

| Phase | Status |
|---|---|
| P1 mobile crash/motion + tab bar + empty states | ✅ done & verified (jest 68/68, tsc clean) |
| P2 mobile polish + consistency + tests | ✅ done & verified (637 pass / 3 skip) |
| P3 backend sales model + API + roles | ✅ written (migrations/controllers/routes/tests, sqlite :memory:); **execute in a PHP-capable env** |
| P4 web: admin sale manager, banner linking, public `/specials/[slug]`, staff dashboard, admin nav, design-system primitives | ✅ done — tsc + eslint clean, vitest **274/274** (28 new tests), `next build` green, route probes 200 |
| P5 mobile `SaleDetailScreen` + banner tap + seeders | ⏳ pending |
| P6 full regression + doc refresh | ⏳ pending |

---

## 5. Open questions (defaults I'll use if you don't answer)

1. **Crash screenshots** didn't reach my workspace — please re-attach; I'll cross-check P1 against them (my analysis already targets the exact suspect components).
2. **Sale scope**: per-store (owner/manager creates for their own store; developer can make chain-wide) — confirm.
3. **Per-product special price**: optional field, default = product's current price (sale = grouping + banner). Confirm.
4. **Logistics officers**: no sale/banner management (same as banners today). Confirm.
5. **Standalone (non-sale) banners**: kept. Confirm.
