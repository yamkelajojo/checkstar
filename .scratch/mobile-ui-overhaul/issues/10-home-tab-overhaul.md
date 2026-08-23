# 10 — Home Tab UI Overhaul

**What to build:** Home screen (`HomeScreen.tsx`) polished to production quality: proper spacing, typography, card elevations, sticky header with store context + delivery ETA, promo carousel, categories grid, "Best Deals" section with Specials. Matches GreenBidder's buyer dashboard patterns.

**Blocked by:** 06-migrate-shared-components-batch1, 07-migrate-feedback-components, 08-port-greenbidder-utils, 09-replace-lucide-icons

**Status:** ready-for-agent

- [ ] Header: store name + delivery area + free-delivery threshold + ETA (GreenBidder `HomeScreen` pattern)
- [ ] Promo carousel: horizontal scroll, page indicators, Tamagui `Stack` + spring animations
- [ ] Categories grid: 2-col, `ProductCard` components, consistent gaps (`spacing.md`)
- [ ] Specials section: "Best Deals 🔥" — product cards with sale price, struck-through regular, % off badge, corner OFF ribbon
- [ ] Inline stepper on product cards (GreenBidder pattern: `Stepper` component)
- [ ] All text uses Tamagui `text.*` styles (h2 for section headers, body for descriptions)
- [ ] AA contrast on all text; TalkBack labels on all interactive elements
- [ ] 60fps scroll on FlatLists (use `scrollPhysics` util)
- [ ] Verify on emulator + iPhone fleet

**Notes:** Reference `mobile/src/features/home/HomeScreen.tsx` (current) and GreenBidder `src/screens/buyer/HomeScreen.jsx` for layout patterns. MOBILE_APP_UX.md maps Flutter Dashboard → Home (delivery-aware). Quality bar from `docs/grilling/mobile-ui-overhaul.md` Acceptance Criteria.