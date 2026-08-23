# ADR 0002: Adopt Tamagui v2 as Mobile Design System

**Date:** 2026-08-23  
**Status:** Accepted

## Context

The mobile app currently uses a custom theme system (`src/theme/colors.ts`, `spacing.ts`, `typography.ts`) with plain React Native components. GreenBidder (existing RN app in the org) uses **Tamagui v2** with a mature design token system, shared component library, and optimizing compiler. The team wants to replicate GreenBidder's **style system** (tokens, layouts, components, motion) while keeping **Checkstar's brand palette** (orange `#EB6522`, not GreenBidder's green).

## Decision

Adopt **Tamagui v2 (stable, 2.7.x)** as the styling system for the Checkstar mobile app:

1. **Add dependencies:** `tamagui`, `@tamagui/config`, `@tamagui/babel-plugin`, `@tamagui/lucide-icons-2`, `@tamagui/animations-react-native`, `@tamagui/animations-moti` (or `react-native-reanimated` integration)
2. **Babel config:** Add `@tamagui/babel-plugin` alongside `babel-preset-expo` (preserves Reanimated plugin)
3. **Create `tamagui.config.ts`** — fork of GreenBidder's `tamagui.config.js` with Checkstar palette tokens
4. **Wrap app root** in `<TamaguiProvider config={config}>` 
5. **Migrate `src/components/shared/`** to Tamagui primitives (`Stack`, `YStack`, `XStack`, `Text`, `Button`, `Card`, `Sheet`, `Toast`, etc.)
6. **Replace `lucide-react-native`** with `@tamagui/lucide-icons-2` (GreenBidder's exact icon package)
6. **Port GreenBidder's utils** (haptics, scrollPhysics, usePressAnimation, formatters) adapted to TS

**Brand palette (Checkstar, not GreenBidder):**
- Primary: `#EB6522` (orange)
- PrimaryDark: `#CC4400`
- PrimaryLight: `#FFE0CC`
- Star/Accent: `#fbbf24`
- Success: `#2D6A4F`
- Warning: `#E9C46A`
- Neutrals: existing light/dark palettes from `colors.ts`

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Keep custom theme | Zero deps, no migration risk | No GreenBidder component reuse; duplicate effort; no optimizing compiler | Rejected |
| Adopt Tamagui v1 | Stable | Dead branch; v2 is the future; GreenBidder uses v2 | Rejected |
| Adopt NativeWind/Tailwind | Familiar syntax | No GreenBidder reuse; no compiler optimizations; runtime overhead | Rejected |
| Adopt Tamagui v2 (this decision) | Direct GreenBidder component reuse; compiler optimizations; unified token system; SSR-ready | New dep on SDK 54; babel plugin coexistence with Reanimated; migration effort | **Accepted** |

## Consequences

**Positive:**
- **Wholesale component reuse** from GreenBidder — cards, sheets, toasts, steppers, buttons, inputs, modals, progress bars
- **Single token source** — change a color/spacing/radius in `tamagui.config.ts`, whole app updates
- **Compiler optimizations** — dead code elimination, atomic CSS extraction, faster renders
- **Unified animation system** — `motions` in config replace ad-hoc Reanimated calls
- **Type-safe tokens** — `$color.primary`, `$space.md`, `$radius.lg` with TS autocomplete

**Negative / Risks:**
- **Babel plugin order** critical: `@tamagui/babel-plugin` must run before Reanimated; test early
- **react-native-svg version** must satisfy `@tamagui/lucide-icons-2` peer dep (currently `15.12.1` in repo — verify)
- **SDK 54 + RN 0.81 + Reanimated 4.1 + Tamagui v2** — untested combination in the wild; verify on emulator
- **Migration surface:** ~15 shared components + all feature screens touch styling
- **Learning curve** for team members new to Tamagui

## Migration Sequence (to minimize blast radius)

1. Fix Logo crash first (current stack) → verify Account tab works
2. Install Tamagui deps + babel plugin → `npx expo start` compiles
3. Create `tamagui.config.ts` with Checkstar tokens
4. Wrap `App.tsx` root in `TamaguiProvider`
5. Migrate `src/components/shared/` one by one (Button → Card → Toast → Sheet → Stepper → etc.)
6. Update feature screens to use Tamagui primitives
7. Remove custom `src/theme/` once fully migrated
8. Verify all tests + typecheck + emulator run

## Follow-up

Grilling record: `docs/grilling/mobile-ui-overhaul.md` — contains full decision log, quality bar, and execution priority.