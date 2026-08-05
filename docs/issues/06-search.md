## What to build

Real product search: Home search bar pushes a Search screen with debounced live results, recent searches, category chips, and proper idle/searching/empty states.

## Acceptance criteria

- [ ] Home search bar is a tappable field → native-stack push to a Search screen; input auto-focuses on mount.
- [ ] Live results via TanStack Query: 400ms debounce, min 2 chars; requests use `?search=` + `?store_id=` once Slice 9 lands (plain `?search=` until then).
- [ ] IDLE state: recent searches (local async-storage, last 5) + Browse Categories chips from `/categories`.
- [ ] "Searching…" spinner row while in flight; result count shown.
- [ ] Result cards reuse the product-grid card (angled image + inline stepper visual).
- [ ] No-results = shared `EmptyState` ("No matches for —" + category chips recovery CTA). No "trending" section (no backend signal).
- [ ] Search is scoped to the Store once store context exists (Slice 9).

## Blocked by

- Blocked by Slice 4 (guest catalog browse)
