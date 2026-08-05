## What to build

Product detail screen with the real pricing cascade, the unit-aware Special price gauge, and the no-AI Product Summary popup.

## Acceptance criteria

- [ ] Product detail: zoomable gallery, price/unit, key points computed from real Product data (never hardcoded), sticky bottom CTA.
- [ ] App-side pricing cascade mirrors the backend: product `sale_price` → Collection Special → base price; unit-tested (priority + fallback). See `PricingService::effectivePrice` in the backend as the source of truth.
- [ ] Unit-aware price gauge comparing `sale_price` vs `regular_price` with a spring marker + plain-English feedback ("This Special = Competitive (28% off)"); normalises comparisons across units (each/kg/2L) so a 2L vs 330ml item compares fairly.
- [ ] Product Summary Popup: small tappable badge on product cards → modal that morphs from the tapped badge's source rect; content is real data only (name/unit, price gauge, savings %, per-unit price, storage/handling tip, store/delivery hint). No AI score, no AI text.
- [ ] Prices formatted via `formatZar`; Sale prices emphasise with Caveat script on the discount/sale amount.
- [ ] Haptics: `tap` on CTA, `commit` on add-to-cart (add-to-cart lands with Slice 7).

## Blocked by

- Blocked by Slice 4 (guest catalog browse)
