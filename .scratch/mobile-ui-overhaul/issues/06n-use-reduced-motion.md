# 06n — useReducedMotion Hook Unit Test

**What to build:** Unit test for `useReducedMotion` hook + `motionPreferences` store — respects device accessibility "Reduce Motion" setting.

**Seam Under Test:** `useReducedMotion()` returns boolean; `useMotionPreferences.init()` reads `AccessibilityInfo.isReduceMotionEnabled()`; listener updates on change.

**Blocked by:** 05b, 08b

**Status:** ready-for-agent

- [ ] Default: `useReducedMotion()` returns `false` before `init()`
- [ ] After `init()`: returns `AccessibilityInfo.isReduceMotionEnabled()` mock value
- [ ] Listener: `reduceMotionChanged` event → store updates, hook returns new value
- [ ] `dispose()`: removes listener, no memory leak
- [ ] Used by `AnimatedError`, `FadeSlideIn`, `AnimatedLogo` — animations disable when `true`

**Notes:** Reference `mobile/src/components/shared/useReducedMotion.ts`, `mobile/src/stores/motionPreferences.ts`. Quality bar: "Dynamic type support (respect system font scale)" + "TalkBack/VoiceOver" implies reduced motion support.