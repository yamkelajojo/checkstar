# 01 — Fix Logo Crash (Account Tab)

**What to build:** The Account tab (and all screens using `Logo`) no longer crashes on mount. The `InvalidNumber` error from `RNSVGPathParser` is resolved.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Root cause confirmed: `STAR_PATH` (SVG path with `M L Z` commands) passed to `<Polygon points={...}>` instead of `<Path d={...}>` in `src/components/shared/Logo.tsx:23`
- [ ] Fix applied: Change `<Polygon points={STAR_PATH}>` → `<Path d={STAR_PATH}>` (already done in conversation)
- [ ] Typecheck passes (`npm run typecheck`)
- [ ] All 142 tests pass (`npm test`)
- [ ] Verified on iPhone fleet via Expo Go 54.0.2: app boots, navigate to Account tab, no red error screen

**Notes:** This was the critical crash blocking all Logo usage (Splash, Onboarding, Auth, Account). Fix is minimal (1 line). Reference: `docs/grilling/mobile-ui-overhaul.md` Known Issues table.