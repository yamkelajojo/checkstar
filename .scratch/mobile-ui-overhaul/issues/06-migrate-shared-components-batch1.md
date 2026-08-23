# 06 — Migrate Shared Components to Tamagui (Batch 1: Core Primitives)

**What to build:** Core layout primitives (`Stack`, `YStack`, `XStack`, `Text`, `Button`, `Card`) rewritten as Tamagui components using tokens from config. Existing call sites in `src/components/shared/` and feature screens work unchanged (same props/API).

**Blocked by:** 05-wrap-tamagui-provider

**Status:** ready-for-agent

- [ ] Replace `src/components/shared/TactilePressable.tsx` → Tamagui `Button` / `Pressable` with `springs.press` haptics
- [ ] Create `src/components/shared/Card.tsx` using Tamagui `Card` / `Stack` with `radius.md`, `shadows.raised`
- [ ] Create `src/components/shared/Stack.tsx` / `YStack.tsx` / `XStack.tsx` as thin wrappers over Tamagui `Stack` with token-based spacing props
- [ ] Create `src/components/shared/Text.tsx` using Tamagui `Text` with pre-composed text styles (`text.h1`, `text.body`, etc. from config)
- [ ] Migrate `src/components/shared/SkeletonCard.tsx` → Tamagui `Skeleton` / `Stack`
- [ ] Migrate `src/components/shared/EmptyState.tsx` → Tamagui `Stack` + `Text`
- [ ] All migrated components export same public API (props, defaultProps) so feature screens don't break
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm test` passes (tests may need updates for new component internals)

**Notes:** This is ADR 0002 Migration Sequence step 5 (first batch). Reference GreenBidder `src/components/shared/` — `Surface.jsx`, `TactilePressable.jsx`, `ScrollAwareCard.jsx`, `FarmerTrustCard.jsx`, `SkeletonCard.jsx` for patterns. Current Checkstar components in `mobile/src/components/shared/` that need migration: `TactilePressable.tsx`, `SkeletonCard.tsx`, `EmptyState.tsx`, `PriceLabel.tsx`, `PriceGauge.tsx`, `ProductCard.tsx`, `CollectionPill.tsx`, `Stepper.tsx`, `AnimatedError.tsx`, `FadeSlideIn.tsx`, `GlassToast.tsx`, `Logo.tsx`, `AnimatedLogo.tsx`.