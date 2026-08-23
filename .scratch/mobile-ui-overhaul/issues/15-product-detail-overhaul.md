# 15 — Product Detail Screen Overhaul

**What to build:** `ProductDetailScreen.tsx` with zoomable image gallery, price/unit, key points, sticky bottom CTA (Add to cart / Stepper). Real key-points from data, not hardcoded.

**Blocked by:** 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 08-port-greenbidder-utils, 09-replace-lucide-icons

**Status:** ready-for-agent

- [ ] Image gallery: horizontal scroll, zoomable (pinch), page indicators, `expo-image` for caching
- [ ] Price block: sale price (large, `text.h2`, primary), struck-through regular (if special), % off badge
- [ ] Key points: computed from product data (unit, tags, category), `Text` with `text.body`
- [ ] Sticky bottom: `Stepper` + "Add to cart" `Button` (primary, full-width, `springs.press`)
- [ ] Add to cart → updates Cart store, shows `Toast` confirmation
- [ ] All tokens from Tamagui config; proper safe-area handling
- [ ] TalkBack: gallery announces image index, price announced, stepper announces quantity

**Notes:** Reference `mobile/src/features/product/ProductDetailScreen.tsx`. GreenBidder `src/screens/buyer/ListingDetailScreen.jsx`. MOBILE_APP_UX.md: Flutter Product detail → Product detail (zoomable gallery, sticky CTA, inline stepper).