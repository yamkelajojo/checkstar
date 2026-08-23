# 04 — Create tamagui.config.ts with Checkstar Palette

**What to build:** `mobile/tamagui.config.ts` forked from GreenBidder's `tamagui.config.js` but with Checkstar's orange palette (`#EB6522`) instead of GreenBidder's green. All design tokens (color, spacing, radius, typography, shadows, motion) defined as Tamagui tokens.

**Blocked by:** 03-install-tamagui-v2

**Status:** ready-for-agent

- [ ] Create `mobile/tamagui.config.ts` using `createTamagui` from `tamagui`
- [ ] Port GreenBidder token structure from `src/config/theme.js` (palette, typeScale, spacing, radius, shadows, springs, durations, stagger, layout)
- [ ] Replace GreenBidder green palette with Checkstar orange palette:
  - `primary: "#EB6522"` (from `mobile/src/theme/colors.ts`)
  - `primaryDark: "#CC4400"`
  - `primaryLight: "#FFE0CC"`
  - `star: "#fbbf24"` (accent)
  - `success: "#2D6A4F"`
  - `warning: "#E9C46A"`
  - Neutrals: keep existing light/dark palettes from `mobile/src/theme/colors.ts`
- [ ] Define semantic color aliases (`background`, `surface`, `textPrimary`, `border`, etc.) mapping to palette
- [ ] Export `type AppConfig = typeof config` and declare module augmentation for Tamagui
- [ ] Verify `npm run typecheck` passes (token types generated correctly)

**Notes:** Reference GreenBidder `src/config/theme.js` (full token system) and `mobile/src/theme/colors.ts` (Checkstar palette). This config becomes the single source of truth for all styling. Per ADR 0002, type-safe tokens (`$color.primary`, `$space.md`, `$radius.lg`) must work with TS autocomplete.