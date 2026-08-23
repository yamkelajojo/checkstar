# S05 — Search Screen System Test

**What to build:** Search screen (`SearchScreen.tsx`) end-to-end: debounced search input, recent searches persistence, results grid with `ProductCard`, empty/error states.

**Blocked by:** 06a, 06h, 07a, 09b, I04

**Status:** ready-for-agent

- [ ] Search input: `TextInput` with debounce (400ms), auto-focus, clear action
- [ ] Recent searches: loads from `storage` (STORAGE_KEYS.recentSearches), tap to re-search, max 5
- [ ] Results: `FlatList` of `ProductCard` (2-col on wide, 1-col on narrow), `useProducts` with `search` param
- [ ] Loading: `SkeletonCard` grid while searching
- [ ] Empty: `EmptyState` "No products found for '...'"
- [ ] Error: `Toast` on API failure, retry action
- [ ] Categories pills: `CollectionPill` for quick category filter (uses `useCategories`)
- [ ] Navigation: Cancel → goBack(), ProductCard press → ProductDetail
- [ ] All tokens from Tamagui config; `TextInput` uses `text.body`, `radius.md`, focus ring `primary`
- [ ] TalkBack: input labeled "Search for products", recent search buttons announce term

**Notes:** Reference `mobile/src/features/search/SearchScreen.tsx`, `mobile/src/features/catalog/hooks.ts:21-33` (useProducts search param). Critical path — customers must find products.