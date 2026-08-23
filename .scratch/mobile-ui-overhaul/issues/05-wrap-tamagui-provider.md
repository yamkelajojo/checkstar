# 05 — Wrap App Root with TamaguiProvider

**What to build:** The entire app renders inside `<TamaguiProvider config={config}>` so all Tamagui tokens and components work. No "Provider not found" errors.

**Blocked by:** 04-create-tamagui-config

**Status:** ready-for-agent

- [ ] Import config from `./tamagui.config` and `TamaguiProvider` from `tamagui` in `mobile/App.tsx`
- [ ] Wrap root component:
  ```tsx
  import { TamaguiProvider } from 'tamagui';
  import config from './tamagui.config';

  export default function App() {
    return (
      <TamaguiProvider config={config}>
        {/* existing root navigator / providers */}
      </TamaguiProvider>
    );
  }
  ```
- [ ] Verify `npx expo start` launches without Provider errors
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm test` passes

**Notes:** Reference `mobile/App.tsx` (current entry point). This is ADR 0002 Migration Sequence step 4. Must complete before any component can use Tamagui primitives.