# S08 — Product Summary Modal System Test

**What to build:** `ProductSummaryModal.tsx` — quick-view modal from Browse/Search/ProductCard press, shows image, name, price, key points, inline stepper + add to cart.

**Blocked by:** 06a, 06b, 06c, 06g, 06h, 07a, 09b, I05

**Status:** ready-for-agent

- [ ] Modal: `Sheet` (from 07b) with `snapPoints: [0.6, 1]`, grabber, backdrop dismiss
- [ ] Content: product image (`expo-image`), name, price block (sale/strike-through/% badge), unit
- [ ] Key points: mapped from product `tags` + `keyPoints` (real data, not hardcoded)
- [ ] Stepper: `Stepper` component, qty 1–99, `springs.press` haptics
- [ ] Add to cart: `Button` primary full-width → `useCart.addItem()` → `Toast` confirmation → modal stays open for multi-add
- [ ] Close: grabber drag, backdrop press, `Sheet.close()`
- [ ] All tokens from Tamagui config; image `aspectRatio: 1`, `radius.md` top corners
- [ ] TalkBack: modal announces product name + price, stepper labeled "Quantity"

**Notes:** Reference `mobile/src/features/catalog/ProductSummaryModal.tsx`, `mobile/src/features/catalog/hooks.ts` (useProduct). Used from Browse grid and Search results for quick add without full detail navigation.