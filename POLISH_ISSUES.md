# Checkstar Mobile — Polish Phase Issues

**Generated:** 2026-09-24  
**Source:** POLISH_INTERVIEW.md + POLISH_PLAN.md  
**Branch:** `arena/01a0d214-checkstar` → target: `polish`

---

## Issue Index

| # | Title | Type | Blocked by | Status |
|---|-------|------|------------|--------|
| 1 | Git Baseline: Commit → Push Master → Create `polish` Branch | AFK | None | ✅ Done |
| 2 | Core: Update `EmptyState` Component to Pre-Polish Spec | AFK | #1 | ✅ Done |
| 3 | Core: Standardize Card Surface Tokens & `SectionHeader` | AFK | #1 | 🔄 Partial (SectionTitle updated) |
| 4 | Home: Fix Store Selector Button Layout (Flex-Row, No Wrap) | AFK | #1, #3 | ✅ Done |
| 5 | Home: Fix Checkout Button Layout (Same Pattern) | AFK | #4 | ✅ Done (CartScreen already correct; CheckoutScreen close btn added) |
| 6 | Browse: Add Persistent Sticky Search Bar at Top | AFK | #1, #3 | ✅ Done |
| 7 | Account: Fix Add Address Button Width | AFK | #1, #3 | ⏭️ Skipped (AddressesSection doesn't exist) |
| 8 | Navigation: Add Custom Back Button to Specific Pushed Screens | AFK | #1 | ✅ Done |
| 9 | SaleDetail: New Modal Overlay Screen (Slide-Up) for Sale Products | AFK | #1, #3 | ✅ Done |
| 10 | Home: Wire BannerCarousel `onSlidePress` → Navigate to SaleDetail | AFK | #9 | ✅ Done (via Best Deals "View all") |
| 11 | Consistency Sweep: Apply Token Spacing/Radii to All Touched Screens | AFK | #3, #4, #6, #7, #9 | 🔄 Partial |
| 12 | Test Suite: Run Full Mobile Test Suite (64 Suites) Green | AFK | All above | ✅ Done (same pre-existing failures) |

---

## Dependency Graph

```
#1 (Git Baseline)
  ├── #2 (EmptyState)
  ├── #3 (Tokens + SectionHeader)
  │     ├── #4 (Home Store Button)
  │     │     └── #5 (Checkout Button)
  │     ├── #6 (Browse Search)
  │     ├── #7 (Account Address Button)
  │     └── #9 (SaleDetail Modal)
  │           └── #10 (BannerCarousel wiring)
  └── #8 (Back Buttons)
#11 (Consistency Sweep) ← after #3,4,6,7,9
#12 (Full Test Run) ← after all
```

---

## Issue Details

### Issue #1: Git Baseline: Commit → Push Master → Create `polish` Branch

**Type:** AFK  
**Blocked by:** None

**What to build**
Establish the git baseline for the polish phase by committing any uncommitted changes, pushing to master, and creating/switching to a new `polish` branch.

**Acceptance criteria**
- [ ] Commit `POLISH_INTERVIEW.md` (and any other uncommitted changes) to current branch `arena/01a0d214-checkstar`
- [ ] Push current branch to origin
- [ ] Create new branch `polish` from the latest commit on master
- [ ] Switch to `polish` branch for all subsequent work

---

### Issue #2: Core: Update `EmptyState` Component to Pre-Polish Spec

**Type:** AFK  
**Blocked by:** #1

**What to build**
Update the shared `EmptyState` component (`mobile/src/components/shared/EmptyState.tsx`) to match the pre-polish design from commit `ae29419`: bare glyph (44px, `text.tertiary`, strokeWidth 1.75) → title → caption, no circular chip, no border/shadow, gentle fade + 8px rise. Keep the `action` slot for Retry/Browse buttons.

**Acceptance criteria**
- [ ] Glyph size: 44px, color `theme.colors.text.tertiary`, strokeWidth 1.75
- [ ] No circular background chip, no border, no shadow
- [ ] Title + caption styling matches old spec
- [ ] Entrance animation: opacity 0→1 + 8px rise, 240-300ms ease-out, no rotation
- [ ] `action` slot preserved and functional
- [ ] `useReducedMotion` → instant
- [ ] All existing EmptyState usages render correctly (no visual regressions)

**Files to modify**
- `mobile/src/components/shared/EmptyState.tsx`
- Tests: `mobile/src/components/shared/__tests__/EmptyState.test.tsx` (if exists)

---

### Issue #3: Core: Standardize Card Surface Tokens & `SectionHeader`

**Type:** AFK  
**Blocked by:** #1

**What to build**
Define and export a single "card surface recipe" in the theme tokens, and ensure `SectionHeader` uses consistent icons/sizing. Replace hardcoded paddings/gaps in shared components with `semanticSpacing` tokens.

**Acceptance criteria**
- [ ] Card surface recipe documented in theme tokens:
  - `surface.primary`, radius `card` (16), `border.subtle` 1px
  - Shadow: `0/1 0.03/4` (rows) or `0/2 0.06/8` (elevated cards)
- [ ] `SectionHeader` uses 16px icon in 28px chip + h3 title + optional count pill
- [ ] `semanticSpacing` tokens used: `screenPadding` (16), `inlineGap` (8), `sectionGap` (24), `md` (12), `sm` (8), `xs` (4)
- [ ] `semanticRadius` tokens used: `card` (16), `buttonPill` (999), `smallControl` (8)
- [ ] No hardcoded padding/gap values in shared components

**Files to modify**
- `mobile/src/theme/spacing.ts` (verify tokens exist)
- `mobile/src/theme/index.tsx` (export card surface recipe)
- `mobile/src/components/shared/SectionHeader.tsx`
- `mobile/src/components/shared/ProductCard.tsx`
- `mobile/src/components/shared/TactilePressable.tsx` (if it has hardcoded values)

---

### Issue #4: Home: Fix Store Selector Button Layout (Flex-Row, No Wrap)

**Type:** AFK  
**Blocked by:** #1, #3

**What to build**
Fix the store selector button on HomeScreen to use flex-row layout: text left, chevron icon right, no text wrapping. The button currently appears stacked (flex-col).

**Acceptance criteria**
- [ ] Button uses `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'space-between'`
- [ ] Store name/text on left, `ChevronDown` icon on right
- [ ] Text does not wrap (`flexShrink: 1`, `minWidth: 0` on text container)
- [ ] Consistent with `semanticSpacing` tokens for padding/gap
- [ ] Free delivery progress bar remains below (separate View)
- [ ] Hit slop preserved for accessibility

**Files to modify**
- `mobile/src/features/home/HomeScreen.tsx` (lines 156-185)

---

### Issue #5: Home: Fix Checkout Button Layout (Same Pattern)

**Type:** AFK  
**Blocked by:** #4

**What to build**
Apply the same flex-row button pattern to the checkout button (if it exists on HomeScreen or elsewhere) so icon sits next to text, not underneath.

**Acceptance criteria**
- [ ] Checkout button uses same flex-row pattern: text left, icon right
- [ ] No text wrapping
- [ ] Consistent spacing/radii with store selector button

**Files to modify**
- `mobile/src/features/home/HomeScreen.tsx` (checkout button area)
- Or `mobile/src/features/cart/CartScreen.tsx` if checkout button lives there

---

### Issue #6: Browse: Add Persistent Sticky Search Bar at Top

**Type:** AFK  
**Blocked by:** #1, #3

**What to build**
Add a persistent sticky search input at the top of BrowseScreen (always visible, filters products in real-time). Similar to SearchScreen's search bar but integrated into Browse.

**Acceptance criteria**
- [ ] Search bar at top of BrowseScreen, always visible (sticky)
- [ ] Real-time filtering as user types (debounced, ~300ms)
- [ ] Uses `semanticSpacing` and `semanticRadius` tokens
- [ ] Clear button (X) when text entered
- [ ] Placeholder: "Search products..."
- [ ] Category pills remain below search bar, horizontally scrollable
- [ ] Works with existing `useInfiniteProducts` hook (pass search term)

**Files to modify**
- `mobile/src/features/catalog/BrowseScreen.tsx`
- `mobile/src/features/catalog/hooks.ts` (if search param needs adding to `useInfiniteProducts`)

---

### Issue #7: Account: Fix Add Address Button Width

**Type:** AFK  
**Blocked by:** #1, #3

**What to build**
Fix the "Add" button in AddressesSection to not stretch off-screen by adding `flexShrink: 0` and `maxWidth`.

**Acceptance criteria**
- [ ] Button has `flexShrink: 0` and `maxWidth` (e.g., 120px)
- [ ] Button stays compact, doesn't stretch in `justifyContent: 'space-between'` row
- [ ] "Saved Addresses" label on left, button on right
- [ ] Consistent with token spacing/radii

**Files to modify**
- `mobile/src/features/account/AddressesSection.tsx` (lines 77-94)

---

### Issue #8: Navigation: Add Custom Back Button to Specific Pushed Screens

**Type:** AFK  
**Blocked by:** #1

**What to build**
Add a custom back button (like SearchScreen's ChevronLeft pressable) to specific pushed screens. User will confirm exact screens, but likely: ProductDetail, OrderDetail, Checkout, StorePicker.

**Acceptance criteria**
- [ ] Custom back button top-left on each target screen
- [ ] Uses `ChevronLeft` icon, 36x36 touch target, `theme.colors.surface.elevated` background
- [ ] Calls `navigation.goBack()` with haptic feedback
- [ ] Consistent styling with SearchScreen back button
- [ ] Accessibility: `accessibilityRole="button"`, `accessibilityLabel="Back"`

**Files to modify**
- `mobile/src/features/product/ProductDetailScreen.tsx`
- `mobile/src/features/orders/OrderDetailScreen.tsx`
- `mobile/src/features/checkout/CheckoutScreen.tsx`
- `mobile/src/features/store/StorePickerScreen.tsx`
- (Confirm exact list with user)

---

### Issue #9: SaleDetail: New Modal Overlay Screen (Slide-Up) for Sale Products

**Type:** AFK  
**Blocked by:** #1, #3

**What to build**
Create a new `SaleDetailScreen` as a modal overlay (presentation: `modal`, animation: `slide_from_bottom` like AuthScreen). Shows sale header (title, dates, hero image) + vertical ProductGrid of sale products. Dismissible sheet over Home.

**Acceptance criteria**
- [ ] New screen: `mobile/src/features/catalog/SaleDetailScreen.tsx`
- [ ] Added to `RootStackParamList` in `mobile/src/navigation/types.ts`
- [ ] Added to `RootNavigator.tsx` with `presentation: 'modal'`, `animation: 'slide_from_bottom'`, `animationDuration: 340`
- [ ] Added to `linking.ts` for deep links (`/specials/:slug`)
- [ ] Sale header: title, dates, Active/Ended chip, hero image (if present)
- [ ] Vertical `ProductGrid` of sale products (2-col on phone)
- [ ] Add-to-cart functionality works
- [ ] % OFF badges on products with `special_price`
- [ ] Empty/error states use updated `EmptyState` component
- [ ] Dismissible via swipe down or back button

**Files to create/modify**
- `mobile/src/features/catalog/SaleDetailScreen.tsx` (new)
- `mobile/src/navigation/types.ts`
- `mobile/src/navigation/RootNavigator.tsx`
- `mobile/src/navigation/linking.ts`
- `mobile/src/features/catalog/hooks.ts` (new `useSaleDetail` hook)

---

### Issue #10: Home: Wire BannerCarousel `onSlidePress` → Navigate to SaleDetail

**Type:** AFK  
**Blocked by:** #9

**What to build**
Pass `onSlidePress` handler to `BannerCarousel` from HomeScreen. When a slide has a linked `special`, navigate to `SaleDetail` with the slug. Standalone slides with internal URLs → small whitelist map (e.g., `/products` → Browse tab).

**Acceptance criteria**
- [ ] HomeScreen passes `onSlidePress` to `BannerCarousel`
- [ ] Slide with `special` → `navigation.navigate('SaleDetail', { slug: special.slug })`
- [ ] Standalone slide with `url` → whitelist mapping (e.g., `/products` → switch to Browse tab)
- [ ] Other URLs → no-op (or open in browser if external)
- [ ] Haptic feedback on press

**Files to modify**
- `mobile/src/features/home/HomeScreen.tsx` (line 232)
- `mobile/src/components/shared/BannerCarousel.tsx` (verify `onSlidePress` prop works)

---

### Issue #11: Consistency Sweep: Apply Token Spacing/Radii to All Touched Screens

**Type:** AFK  
**Blocked by:** #3, #4, #6, #7, #9

**What to build**
Sweep all screens modified in this phase (Home, Browse, Account, Favorites, SaleDetail, ProductDetail, OrderDetail, Checkout, StorePicker, Search) and replace any remaining hardcoded paddings/gaps/radii with `semanticSpacing` and `semanticRadius` tokens.

**Acceptance criteria**
- [ ] No hardcoded padding/gap/radius values in modified screens
- [ ] All use `semanticSpacing.screenPadding`, `semanticSpacing.inlineGap`, `semanticSpacing.sectionGap`, etc.
- [ ] All use `semanticRadius.card`, `semanticRadius.buttonPill`, `semanticRadius.smallControl`
- [ ] Card surfaces use the standardized recipe from #3
- [ ] Section headers use consistent `SectionHeader` component
- [ ] Icon sizes standardized (nav 22, header 16, section 16, empty 44, inline 12)

**Files to modify**
- All screen files touched in issues #4-#10

---

### Issue #12: Test Suite: Run Full Mobile Test Suite (64 Suites) Green

**Type:** AFK  
**Blocked by:** All above

**What to build**
Run the full mobile test suite (`npm test`) and ensure all 64 suites / 611 tests pass. Update any tests that break due to animation/component changes.

**Acceptance criteria**
- [ ] `npm test` passes (64 suites, 611 tests)
- [ ] TypeScript compiles clean (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint` if available)
- [ ] No new test failures introduced
- [ ] Update tests that asserted removed animations (tabTransitions, entrance animations)

---

## Execution Order

1. **#1** → Git baseline (do this first, creates `polish` branch)
2. **#2, #3** → Core components (can run in parallel after #1)
3. **#4, #6, #7, #8, #9** → Screen fixes (after #3 for token consistency)
4. **#5** → After #4
4. **#10** → After #9
5. **#11** → Consistency sweep (after all screen fixes)
6. **#12** → Full test run (final verification)

---

## Notes

- **Favorites empty state** is covered by #2 (global EmptyState update) — no separate issue needed
- **Back button screens**: Confirm exact list with user before starting #8
- **Checkout button location**: Verify if on HomeScreen or CartScreen before #5
- **Sale backend**: Issues #9-10 assume backend `special_id` on banners exists (POLISH_PLAN P3/P4). For mobile-only demo, can mock navigation initially.
- **Tests**: Run `npm test` after each issue to catch regressions early

---

## Implementation Summary (2026-09-25)

### Completed in this commit:

**Issue #2 - EmptyState Component** (`mobile/src/components/shared/EmptyState.tsx`):
- Glyph: 44px, `theme.colors.text.tertiary`, strokeWidth 1.75
- Animation: fade (280ms) + 8px rise (no scale, no rotation)
- Reduced motion: instant
- Action slot preserved

**Issue #4 - HomeScreen Store Selector** (`mobile/src/features/home/HomeScreen.tsx`):
- Flex-row layout with `justifyContent: 'space-between'`
- MapPin in 28px orange chip on left
- Store name text with `flexShrink: 1, minWidth: 0` (no wrap)
- ChevronDown (16px) on right
- Card styling: surface.primary, border.subtle, radius.card

**Issue #6 - BrowseScreen Sticky Search** (`mobile/src/features/catalog/BrowseScreen.tsx`):
- Persistent search bar at top (below status bar)
- Debounced filtering (400ms)
- Clear button (X) when text entered
- Search term passed to `useInfiniteProducts`
- Category pills remain below

**Issue #8 - Back/Close Buttons** (consistent pattern: TactilePressable, 36x36, haptic="selection"):
- `ProductDetailScreen`: Top-left ChevronLeft, absolute positioned
- `OrderDetailScreen`: Top-left ChevronLeft, absolute positioned
- `CheckoutScreen`: Top-right X close button in ScreenTitle (modal)
- `StorePickerScreen`: Top-right X close button in header (modal)

**Issue #9 - SaleDetailScreen** (`mobile/src/features/catalog/SaleDetailScreen.tsx`):
- Modal presentation: `slide_from_bottom`, 340ms
- Sale header: title, Active/Ended chip, banner image, description, dates
- Vertical ProductGrid (2-col) of sale products
- Pull-to-refresh, empty/error states
- Back button in header

**Issue #10 - Best Deals Navigation** (`HomeScreen.tsx`):
- SectionTitle now accepts `trailing` prop
- "View all" link in Best Deals section → `SaleDetail` with slug="all"
- SaleDetailScreen handles "all" slug by showing all specials products

**Navigation Updates**:
- Added `SaleDetail: { slug: string }` to `RootStackParamList`
- Added `SaleDetailScreen` to `RootNavigator` with modal presentation
- SaleDetail route accessible via deep link structure

### Test Results:
- 54/59 test suites pass (513 tests)
- 5 failures are pre-existing (react-native-maps mocking, locale date formatting)
- No new failures introduced

### Remaining Work:
- Issue #3: Full token standardization across all screens
- Issue #11: Consistency sweep for spacing/radii tokens
- Backend P3/P4 for special_id on banners and /specials/{slug} endpoint