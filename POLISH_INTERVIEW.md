# Checkstar Mobile App — Polish Phase Interview

**Date:** 2026-09-24  
**Branch:** `arena/01a0d214-checkstar` (current) → target: `polish`  
**Goal:** Reach shared understanding on the polish fixes before implementation.

---

## Issues to Resolve

### 1. Navigation Back Button
**Current:** `RootNavigator.tsx` has `headerShown: false` globally. Gesture back (swipe) works because `gestureEnabled: true` + `fullScreenGestureEnabled: true`. Only `SearchScreen` implements a custom back button (lines 94-114).

**Question:** Do you want a consistent back button on **all** pushed screens (ProductDetail, OrderDetail, Checkout, StorePicker, etc.)? Or only on specific screens? Should it be a native-stack back button (requiring `headerShown: true` with custom header) or a custom pressable like SearchScreen?

---

### 2. Browse Screen — Categories + Search Input
**Current:** `BrowseScreen.tsx` shows horizontal category pills (line 73-89) but no search input. The "All" category is just another pill.

**Question:** 
- Should the search input be **always visible at top** (like SearchScreen) when on "All" category?
- Should it collapse/hide when a specific category is selected?
- Or should Browse have a persistent search bar like a sticky header?

---

### 3. Home Screen — Store Selector Button Layout
**Current:** HomeScreen lines 156-185: Store button is `flexDirection: 'row'` with ChevronDown at the end (right side). Free delivery progress bar sits **below** it in a separate View (lines 187-209).

**Question:** The user says "down arrow should be on the side next to pick a store instead of underneath." Looking at the code, the chevron **is** on the right side of the button. Is the issue:
- The progress bar pushing the chevron down visually?
- The button should be `justifyContent: 'space-between'` with the chevron flush right?
- Something else?

---

### 4. Account Screen — Add Address Button Width
**Current:** `AddressesSection.tsx` lines 77-94: The "Add" button is a TactilePressable with `flexDirection: 'row'` but no explicit width constraint. It sits in a `justifyContent: 'space-between'` row with the "Saved Addresses" label.

**Question:** The button stretches because it's in a flex row with `space-between` and no max-width. Fix options:
- Add `maxWidth` or `flexShrink: 0` to the button
- Wrap button in a View with fixed width
- Change the row layout

Which approach do you prefer?

---

### 5. Favorites Screen — Empty State Consistency
**Current:** `FavoritesScreen.tsx` lines 97-123: Uses `EmptyState` with `Heart` icon. POLISH_PLAN.md (B4) notes the pre-polish EmptyState was: **bare glyph (44px, text.tertiary, strokeWidth 1.75) → title → caption**, no circular chip, no border/shadow, gentle fade + 8px rise.

**Question:** The POLISH_PLAN already specifies restoring the old EmptyState design (from commit `ae29419`). Should we:
- Apply this globally to all EmptyState usages (Home, Browse, Cart, Search, Account, Rider)?
- Update the `EmptyState` component itself to match the old spec?
- Keep the action slot (Retry/Browse buttons)?

---

### 6. Sale Banners — Navigation to Sale Overlay
**Current:** `HomeScreen.tsx` line 232: `<BannerCarousel banners={banners} />` — **no `onSlidePress` passed**. `BannerCarousel.tsx` accepts `onSlidePress` but it's never used. POLISH_PLAN.md (C5) specifies: new `SaleDetailScreen` for `/specials/{slug}`, banner tap navigates there.

**User wants:** "an overlay screen (that's just like the login overlay screen in this same mobile app) that I can scroll through vertically of the products on that particular sale I clicked on."

**Questions:**
- **Overlay vs Full Screen:** The login overlay (AuthScreen) uses `presentation: 'modal'` with `animation: 'slide_from_bottom'`. Should SaleDetail be a modal overlay (slide up) or a pushed stack screen?
- **Content:** Sale header (title, dates, hero image) + vertical ProductGrid of sale products?
- **Deep linking:** Should `/specials/{slug}` work from web/links?
- **Banner data:** The backend needs `special_id` on banners (P3/P4 in POLISH_PLAN). For now, should we mock the navigation or wait for backend?

---

### 7. Git Baseline + New Branch
**Current:** Branch `arena/01a0d214-checkstar`, last commit `8a6ef88` (verified in POLISH_PLAN).

**Question:** Confirm flow:
1. Commit any uncommitted changes to current branch
2. Push to `master` (or remote tracking branch)
3. Create new branch `polish` from that commit
4. Switch to `polish` for all subsequent work

---

### 8. Design System Consistency (Impeccable Skill)
**POLISH_PLAN.md B6** specifies a consistency sweep:
- One card surface recipe (tokens only)
- Replace hardcoded paddings/gaps with `semanticSpacing`
- Section vertical gap standardized at 24 (`sectionGap`)
- Header pattern consistency

**Question:** Should we tackle this as a **single sweep** (all screens at once) or **incrementally per screen** as we fix the issues above?

---

## Additional Clarifications Needed

| # | Topic | Question |
|---|-------|----------|
| A | **Sale scope** | Per-store (owner/manager creates for their store; developer = chain-wide)? Confirm POLISH_PLAN C1 default. |
| B | **Per-product special price** | Optional field, default = product's current price (sale = grouping + banner)? Confirm POLISH_PLAN C1 default. |
| C | **Logistics officers** | No sale/banner management (same as banners today)? Confirm POLISH_PLAN C1 default. |
| D | **Standalone banners** | Kept (non-sale banners like "Download the App")? Confirm POLISH_PLAN C1 default. |
| E | **Crash screenshots** | POLISH_PLAN notes they didn't reach workspace. Do you have them to re-attach for cross-checking P1 fixes? |
| F | **Test command** | What's the test command for mobile? `npm test`? `jest`? (Need to run after each change) |

---

## Decisions Logged

*To be filled during interview*

| Decision | Resolution | Notes |
|----------|------------|-------|
| Back button strategy | Only on specific screens (user will specify which) | Custom pressable like SearchScreen |
| Browse search UX | Persistent search bar at top (sticky) | Always visible, filters in real-time |
| Store button layout fix | Currently flex-col (stacked); need flex-row: text left, icon right, no text wrap | Applies to store button AND checkout button |
| Add address button fix | flexShrink: 0 + maxWidth on button | Prevents stretching |
| EmptyState design | Update EmptyState component globally to match old spec (bare glyph, no chip/shadow) | Action slot preserved |
| SaleDetail: overlay vs push | Modal overlay (slide_from_bottom) like AuthScreen | Dismissible sheet over Home |
| Git baseline flow | Commit → push master → branch polish → checkout polish | Standard flow |
| Consistency sweep approach | Hybrid — core tokens/components first, then screens | Update shared components first |
| Sale scope | Confirm all defaults: per-store (owner/manager), developer chain-wide |  |
| Special price default | Confirm: optional, defaults to product's current price |  |
| Logistics officer access | Confirm: no sale/banner management |  |
| Standalone banners | Confirm: kept |  |
| Test command | npm test (jest-expo) | 64 suites, 611 tests |