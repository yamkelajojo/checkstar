## What to build

Stand up the Checkstar mobile app foundation: a standalone Expo SDK 54 (TypeScript) project in `mobile/` that runs in Expo Go on an iPhone, with the Customer bottom-nav shell, theme tokens, core libs, and the API client seam.

## Acceptance criteria

- [ ] `create-expo-app --template blank-typescript` (Expo SDK 54) in `mobile/` at repo root; app boots in Expo Go on an iPhone.
- [ ] `@react-navigation` bottom-tabs + native-stack wired; 4-tab Customer shell (Home, Browse, Cart, Account) with placeholder screens; native push/pop + default tab cross-fade, no `animation` prop overrides.
- [ ] Theme: plain `src/theme/` TypeScript token objects (no Tamagui), seeded from accent `#eb7a43` (reconciling to canonical `#EB6522`), light + dark palettes driven by `useColorScheme()`; two-font system (platform system sans + Caveat via `expo-font`, OFL attribution carried).
- [ ] All hard-coded copy lives in `lib/strings.ts` (no scattered inline strings).
- [ ] `lib/currency.ts` exports `formatZar(cents)` via `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`; jest-expo unit tests pass (2-dp `R 12,34`, rounding, zero, large amounts).
- [ ] `lib/api` client base: mobile base URL, Bearer header injection seam, and 401 interception hook (clear session + "Session expired" toast + navigate to Auth) stubbed for later wiring.
- [ ] Dependency set lean: `zustand` 5.0.14, `react` 19.2.8 from `.opensrc`; `@tanstack/react-query` v5 is the only new dep; all native modules are Expo-Go-bundled (async-storage, secure-store, reanimated 4, gesture-handler, pager-view, svg, location, haptics, blur, linear-gradient, image, notifications, font).
- [ ] jest-expo configured; `formatZar` + strings-integrity unit tests green.

## Blocked by

None — can start immediately.
