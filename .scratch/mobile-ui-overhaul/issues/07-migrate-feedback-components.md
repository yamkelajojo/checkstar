# 07 — Migrate Feedback Components (Batch 2: Toast, Sheet, ProgressBar)

**What to build:** `Toast`, `Sheet`, `ProgressBar` as Tamagui components ported from GreenBidder. Replaces current `GlassToast.tsx` and adds missing `Sheet` and `ProgressBar` primitives.

**Blocked by:** 06-migrate-shared-components-batch1

**Status:** ready-for-agent

- [ ] Migrate `src/components/shared/GlassToast.tsx` → Tamagui `Toast` (port GreenBidder `Toast.jsx` + `FeedbackProvider.jsx` pattern)
- [ ] Create `src/components/shared/Sheet.tsx` (port GreenBidder `Sheet.jsx` — bottom sheet with grabber, backdrop, spring animations)
- [ ] Create `src/components/shared/ProgressBar.tsx` (port GreenBidder `ProgressBar.jsx` — onboarding progress indicator)
- [ ] All use Tamagui tokens (`colors`, `radius`, `shadows`, `springs`, `spacing`)
- [ ] `Toast` integrates with existing `useToast` hook pattern (or replace with Tamagui's built-in toast system)
- [ ] `Sheet` supports `snapPoints`, `dismissible`, `keyboardAware` props
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm test` passes

**Notes:** Reference GreenBidder `src/components/feedback/Toast.jsx`, `Sheet.jsx`, `FeedbackProvider.jsx` and `src/components/onboarding/ProgressBar.jsx`. Checkstar currently has `GlassToast.tsx` only — `Sheet` and `ProgressBar` are missing and needed for onboarding/checkout flows. `OnboardingScreen.tsx` uses progress indicator; checkout needs bottom sheets.