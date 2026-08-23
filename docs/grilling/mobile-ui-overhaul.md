# Mobile UI Overhaul — Grilling Session Record

**Date:** 2026-08-23  
**Participants:** User + Agent  
**Skill:** `/grilling` + `/domain-modeling`

---

## Decisions Recorded

### 1. Styling System — Adopt Tamagui v2
**Choice:** Add Tamagui v2 as a real dependency to `mobile/package.json` with babel plugin.  
**Rationale:** Enables direct reuse of GreenBidder's component library and design tokens. SDK 54 pin respected.  
**Risk:** Babel coexistence with Reanimated 4.1; react-native-svg version compatibility. Verify in Phase 1.

### 2. Icon Library — @tamagui/lucide-icons-2
**Choice:** Replace `lucide-react-native` (direct dep) with GreenBidder's exact package `@tamagui/lucide-icons-2`.  
**Rationale:** Satisfies user rule "no lucide unless GreenBidder has them" — GreenBidder uses this package.

### 3. Design Reference — GreenBidder Style System, Checkstar Palette
**Choice:** Port GreenBidder's **entire style system** (token scales, spacing rhythm, radii, elevation, layout patterns, component shapes, motion feel) but **reject its green identity**.  
**Checkstar palette stays:** `#EB6522` primary (orange), `#fbbf24` star accent, black/white neutrals — matching logo assets.

### 4. Scope — Customer Flows Only This Pass
**Choice:** Full overhaul for 4 tabs + auth/onboarding/checkout/orders/product/search/store picker.  
**Rider screens:** Crash fixes + free consistency wins only. Store Owner/Manager dashboards out of scope.

### 5. Verification — Android Emulator Primary, iPhone Fleet Final
**Choice:** Autonomous verification on local `Pixel_3a_API_34` emulator via Expo Go + `tsc` + `jest` after each change set. User does final acceptance on iPhone 17 + Expo Go 54.0.2 fleet.

### 6. Logo Integration — Upgrade Existing Component In-Place
**Choice:** Replace internals of existing `Logo` component (same API: `stacked | lockup`, `size`, `tone`), same 4 call sites (Splash, Onboarding, Auth, Account).  
- Star mark = exact vectors from `checkstar-logo-icon-star.html` (white wing + #EB6522 check)
- Wordmark = two-tone "Check"/"star" matching asset proportions
- "cares enough" tagline included, italic system-font approximation (no new font bundled)
- Launcher-icon regeneration (`app.json` assets) deferred

### 7. Documentation Structure
- Grilling record: `docs/grilling/mobile-ui-overhaul.md`
- ADR 0001: `docs/adr/0001-mobile-react-native-expo.md` (reconstructed — was referenced but missing)
- ADR 0002: `docs/adr/0002-tamagui-design-system-adoption.md`
- `CONTEXT.md` untouched (no domain vocabulary changes)

### 8. Execution Priority (from brief)
1. Account-tab crash root cause → fix → verify
2. Navigation problems
3. Broken layouts / rendering issues
4. Shared design system inconsistencies
5. Major screen-level UI problems
6. Component polish
7. Edge cases, loading states, smaller visual issues
8. Logo integration (last)

---

## Known Issues at Session Start

| Issue | Location | Root Cause | Severity |
|-------|----------|------------|----------|
| App crashes on boot / tab switch | `Logo.tsx:23` | `STAR_PATH` (SVG path commands `M L Z`) passed to `<Polygon points={...}>` — expects coordinate pairs only. `react-native-svg` parser throws `InvalidNumber`. | **Critical** — blocks all screens using Logo |
| API base URL for emulator | `apiClient.ts:8` | `192.168.1.100:8000` unreachable from Android emulator (needs `10.0.2.2:8000`) | High — fix via `.env.local` |
| expo-notifications warning | Expo Go SDK 54 | Push notifications removed from Expo Go SDK 53+ | Low — dev build needed for real push; UI work unaffected |

---

## GreenBidder Donation Inventory (to port wholesale)

| GreenBidder Path | Checkstar Target | Notes |
|------------------|------------------|-------|
| `src/config/theme.js` | `src/theme/` (adapt tokens to orange) | Design tokens single source |
| `src/config/tamagui.config.js` | `tamagui.config.ts` (new) | Tamagui config with Checkstar palette |
| `src/components/shared/` | `src/components/shared/` | Replace/extend existing primitives |
| `src/components/feedback/` (Toast, Sheet) | `src/components/shared/` | GlassToast exists; add Sheet |
| `src/components/onboarding/` (ProgressBar) | `src/components/shared/` | OnboardingScreen uses it |
| `src/utils/` (formatters, haptics, scrollPhysics, usePressAnimation) | `src/lib/` | Adapt to TS + current stack |
| `screens/onboarding/`, `screens/auth/`, `screens/buyer/` | `src/features/` | Layout templates, swap data/types |

---

## Acceptance Criteria (Quality Bar)

- ✅ Zero unhandled exceptions (crash-free sessions)
- ✅ 60fps scroll on all lists/grids (no jank)
- ✅ AA contrast on all text/interactive elements
- ✅ TalkBack / VoiceOver labels on all buttons, tabs, form fields
- ✅ <300ms tab switch latency
- ✅ <1s splash → first interaction
- ✅ Cached last-known data + toast on network failure (offline resilience)
- ✅ Dynamic type support (respect system font scale)

---

## Next Actions (Phase 1)

1. **Fix Logo crash** — change `<Polygon points={STAR_PATH}>` to `<Path d={STAR_PATH}>` in `Logo.tsx`
2. **Verify Account tab** on Android emulator (launch, navigate to Account, scroll orders)
3. **Add `.env.local`** with `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api` for emulator
4. **Install Tamagui v2** + babel plugin + `@tamagui/config` + `@tamagui/lucide-icons-2`
5. **Migrate theme** — create `tamagui.config.ts` from GreenBidder config + Checkstar palette
6. **Port shared components** — feedback, onboarding, utils
7. **Screen-by-screen UI overhaul** per priority order
8. **Logo asset swap** — replace Logo internals with true brand SVG
9. **Final verification** on iPhone fleet