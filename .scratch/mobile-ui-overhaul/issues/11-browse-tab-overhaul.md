# 11 — Browse Tab UI Overhaul (Categories → Products)

**What to build:** Browse screen (`BrowseScreen.tsx`) as 2-pane rail + product list. Left rail: categories. Right pane: product grid (2-col) filtered by selected category. Proper empty/loading states. Sticky category rail on tablet/web.

**Blocked by:** 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 08-port-greenbidder-utils, 09-replace-lucide-icons

**Status:** ready-for-agent

- [ ] Left rail: scrollable category list, active highlight with primary color, `Text` using `text.label` style
- [ ] Right pane: 2-col product grid (`ProductCard`), consistent `spacing.md` gaps
- [ ] Category selection updates product list instantly (React Query cache)
- [ ] Loading: `SkeletonCard` grid while fetching
- [ ] Empty state: `EmptyState` with icon + "No products in this category"
- [ ] Search integration: header search bar (real, not stub) → navigates to SearchScreen
- [ ] All spacing/radius/tokens from Tamagui config
- [ ] TalkBack: category rail announces selection, product cards announce name/price
- [ ] 60fps scroll both panes

**Notes:** Reference `mobile/src/features/catalog/BrowseScreen.tsx` and GreenBidder `src/screens/buyer/CategoryScreen.jsx` / `src/screens/buyer/ListingScreen.jsx`. MOBILE_APP_UX.md: Flutter Categories → Browse (2-pane rail + list). Current `BrowseScreen.tsx` uses `hooks.ts` for category/products logic.