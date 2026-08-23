# 17 — Logo Asset Swap (Exact Brand SVG from HTML Files)

**What to build:** `Logo.tsx` internals replaced with exact vectors from `checkstar-logo-icon-star.html` (star mark) and `checkstar-logo-text.html` (wordmark + tagline). Same component API (`stacked | lockup`, `size`, `tone`), same 4 call sites (Splash, Onboarding, Auth, Account).

**Blocked by:** 06-migrate-shared-components-batch1

**Status:** ready-for-agent

- [ ] Star mark: exact SVG paths from `checkstar-logo-icon-star.html`:
  - White wing/star path (`fill="#FFFFFF"`) — the horizontal wing shape
  - Orange check overlay (`fill="#EB6522"`) — the asymmetrical checkmark/V
  - Combined in `<Svg viewBox="0 0 300 400">` with proper layering
- [ ] Wordmark: two-tone "Check"/"star" matching `checkstar-logo-text.html` proportions:
  - "Check" in `#EB6522`, tight tracking (`letter-spacing: -1.2` relative)
  - "star" in white, tight tracking (`letter-spacing: -0.8` relative)
  - Positioned to match asset spacing (x=6 → x=175 gap)
- [ ] Tagline: "cares enough" in italic system font approximation (`fontStyle: 'italic'`, `fontWeight: '400'`, size ~0.3× wordmark) beneath "star"
- [ ] Variants:
  - `stacked`: star above wordmark (Splash, `AnimatedLogo`)
  - `lockup`: star left of wordmark (Onboarding, Auth, Account headers)
- [ ] `tone` prop: `light` → white star/check on dark bg; `dark` → dark star/check on light bg (invert logic)
- [ ] `size` prop: scales all elements proportionally (star `size * 1.7` stacked, `size` lockup)
- [ ] Verify all 4 call sites render correctly:
  - `SplashScreen.tsx:20` — `AnimatedLogo variant="stacked"`
  - `OnboardingScreen.tsx:58` — `Logo variant="lockup" size={24}`
  - `AuthScreen.tsx:137` — `Logo variant="lockup" size={26}`
  - `AccountScreen.tsx:48` — `Logo variant="lockup" size={26}`
- [ ] No new font bundled (italic approximation only)
- [ ] Launcher icon regeneration (`app.json` assets) deferred

**Notes:** This is the final visual polish ticket before verification. Reference the two HTML files in repo root for exact paths/proportions/colors. Current `Logo.tsx` uses placeholder star polygon + RN Text wordmark — replace entirely with SVG `<Path>` elements.