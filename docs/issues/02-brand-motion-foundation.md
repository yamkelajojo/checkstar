## What to build

Build the Checkstar brand and motion foundation on top of the scaffold: the Logo component, the shared motion primitive set, the splash hero, Reduce Motion support, and accessibility basics. This slice is a **HITL (human-in-the-loop) design checkpoint** — the look-and-feel must be signed off on the user's iPhone before feature work continues.

## Acceptance criteria

- [ ] `Logo` component with `stacked` (splash/onboarding) and `lockup` (header/cart/account) variants: icon star via `react-native-svg` (white wing + `#EB6522` check, from `checkstar-logo-icon-star.html`) and real `<Text>` wordmark ("Check" orange + "star" + "cares enough" in Caveat); theme-aware.
- [ ] Hero-once logo animation (~650ms reassembly) on first mount, then quick 250ms fade on subsequent visits, tracked in-module.
- [ ] Motion primitives ported from GreenBidder: `FadeSlideIn`, `TactilePressable` (default/compact/card/assertive variants + opt-in haptic), `usePressAnimation`, haptics util (`tap`/`commit`/`success`/`warning`/`selection`), `AnimatedError` + `useErrorShake`, `EmptyState` (glyph → title → one caption; ~200ms delayed rise+scale), `SkeletonCard` (grid + horizontal Specials-carousel variants).
- [ ] One spring language: entrance `20/180`, press-in `18/450`, press-out `22/400`, exit ~60–70% faster; animate opacity + transform only.
- [ ] Splash → Home quick-fade on boot/init-complete (no hard-coded sleep).
- [ ] Reduce Motion: `AccessibilityInfo.isReduceMotionEnabled()` read at boot with change listener into a `motionPreferences` zustand store; every primitive snaps to end state when enabled.
- [ ] ≥44pt hit targets on all tappables (`TactilePressable` floor; compact visuals via padding + `hitSlop`); `accessibilityRole`/`label`/`state` on interactive controls.
- [ ] **HITL gate:** user reviews the branded shell (logo, motion, light/dark) on the iPhone and signs off.

## Blocked by

- Blocked by Slice 1 (scaffold + shell + theme)
