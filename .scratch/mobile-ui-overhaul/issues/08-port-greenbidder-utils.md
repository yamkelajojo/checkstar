# 08 — Port GreenBidder Utils (Batch 3: Haptics, ScrollPhysics, PressAnimation, Formatters)

**What to build:** Utility hooks and helpers ported from GreenBidder, adapted to TypeScript and current stack. These become the shared interaction primitives.

**Blocked by:** 06-migrate-shared-components-batch1

**Status:** ready-for-agent

- [ ] Port `usePressAnimation` → `src/lib/usePressAnimation.ts` (GreenBidder `usePressAnimation.js` — spring-based press scale/opacity)
- [ ] Port `scrollPhysics` → `src/lib/scrollPhysics.ts` (GreenBidder `scrollPhysics.js` — `decelerationRate: 'fast'`, `snapToIntervals`)
- [ ] Port `haptics` → `src/lib/haptics.ts` (GreenBidder `haptics.js` — `impactLight`, `impactMedium`, `selection`, `notification` wrappers over `expo-haptics`)
- [ ] Port `formatters` → `src/lib/formatters.ts` (GreenBidder `formatters.js` — currency, date, number formatting; Checkstar already has `currency.ts`, extend it)
- [ ] Port `dateUtils` → `src/lib/dateUtils.ts` (GreenBidder `dateUtils.js`)
- [ ] All utilities use Tamagui tokens where applicable (springs, durations)
- [ ] Update existing imports in feature screens to use new locations
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm test` passes

**Notes:** Reference GreenBidder `src/utils/haptics.js`, `scrollPhysics.js`, `usePressAnimation.js`, `formatters.js`, `dateUtils.js`. Checkstar already has `mobile/src/lib/haptics.ts`, `currency.ts` — consolidate/extend rather than duplicate. These utils are used by shared components (Button press, ScrollView physics, Toast animations).