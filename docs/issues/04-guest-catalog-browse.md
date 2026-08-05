## What to build

The Guest catalog browse tracer bullet: Home dashboard + 2-pane Browse, pulling real products from the public API via TanStack Query, unauthenticated. This is the first fully end-to-end vertical slice (API → query layer → UI → loading states).

## Acceptance criteria

- [ ] `@tanstack/react-query` v5 wired as the server-state layer; public endpoints fetched unauthenticated.
- [ ] Home dashboard: header, categories grid, Specials strip placeholder (full carousel is Slice 5/Home polish), and a search entry (Search screen is Slice 6; entry may link to a placeholder).
- [ ] Browse: 2-pane layout — category rail → product list for the selected category; plain list preferred over nested expansion.
- [ ] 2-col product grid with `SkeletonCard` skeletons while loading; product cards show angled image (`rotate(-12…-30°)` on a backdrop circle), name, unit, price via `formatZar`, % off ribbon when a Special applies.
- [ ] Product-card inline stepper renders (actual cart wiring lands in Slice 7).
- [ ] Product card tap → Product detail route (Slice 5 fills it; a placeholder screen is acceptable here).
- [ ] Load/error states: skeleton grid on fetch, retry on failure; no hard-coded commerce data anywhere.

## Blocked by

- Blocked by Slice 1 (scaffold + shell + theme)
