# 03 — Install Tamagui v2 + Babel Plugin + Dependencies

**What to build:** Tamagui v2 (stable 2.7.x) installed as a real dependency with all required peer deps and babel plugin configured. The app compiles with `npx expo start` without errors.

**Blocked by:** 01-fix-logo-crash, 02-env-local-for-emulator

**Status:** ready-for-agent

- [ ] Add to `mobile/package.json` dependencies:
  - `tamagui@^2.7.7`
  - `@tamagui/config@^2.7.7`
  - `@tamagui/babel-plugin@^2.7.7`
  - `@tamagui/lucide-icons-2@^2.7.7`
  - `@tamagui/animations-react-native@^2.7.7`
  - `@tamagui/animations-moti@^2.7.7` (or use existing `react-native-reanimated@~4.1.1`)
- [ ] Run `npm install` in `mobile/`
- [ ] Update `mobile/babel.config.js` to include `@tamagui/babel-plugin` **before** Reanimated plugin:
  ```js
  plugins: [
    '@tamagui/babel-plugin',
    ['react-native-reanimated/plugin', { ... }],
    ...
  ]
  ```
- [ ] Verify `npx expo start` compiles without babel/transform errors
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm test` passes (142/142)

**Notes:** Per ADR 0002, babel plugin order is critical — Tamagui must run before Reanimated. Existing `react-native-svg@15.12.1` must satisfy `@tamagui/lucide-icons-2` peer dep. Reference: `mobile/babel.config.js`, `docs/adr/0002-tamagui-design-system-adoption.md` Migration Sequence steps 1-2.