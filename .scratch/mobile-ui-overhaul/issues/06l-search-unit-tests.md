# 06l — Search Hook + Component Unit Tests

**What to build:** Unit tests for `SearchScreen` component logic: debounce, recent searches persistence, category filter, results rendering.

**Seam Under Test:** `SearchScreen` component + `useProducts` hook search param

**Blocked by:** 06a, 06h, 09b

**Status:** ready-for-agent

- [ ] Debounce: term changes → `debounced` updates after 400ms, not before
- [ ] Recent searches: saves to storage, loads on mount, max 5, dedupes
- [ ] Category pill press → `useProducts` called with `category` param
- [ ] Search term ≥2 chars → `useProducts` called with `search` param
- [ ] Results render: `ProductCard` per item, `SkeletonCard` while loading
- [ ] Empty state: "No products found for 'term'" when data empty
- [ ] Error state: `Toast` shows on `useProducts` error
- [ ] Cancel button → `navigation.goBack()`

**Notes:** Reference `mobile/src/features/search/SearchScreen.tsx`, `mobile/src/features/catalog/hooks.ts:21-33`. Complements system test S05.