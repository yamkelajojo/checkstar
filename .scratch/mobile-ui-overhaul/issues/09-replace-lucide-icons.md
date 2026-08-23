# 09 — Replace lucide-react-native with @tamagui/lucide-icons-2

**What to build:** All icon imports switched from `lucide-react-native` to `@tamagui/lucide-icons-2` (GreenBidder's exact package). No visual change — same icon set, Tamagui-optimized.

**Blocked by:** 03-install-tamagui-v2, 05-wrap-tamagui-provider

**Status:** ready-for-agent

- [ ] Audit all `lucide-react-native` imports across `mobile/src/` (grep for `from 'lucide-react-native'`)
- [ ] Replace each import: `import { Home, User, ShoppingCart, ... } from 'lucide-react-native'` → `import { Home, User, ShoppingCart, ... } from '@tamagui/lucide-icons-2'`
- [ ] Verify icon props compatibility (Tamagui icons accept `size`, `color`, `strokeWidth` same as lucide-react-native)
- [ ] Key files to update: `mobile/src/navigation/CustomerTabs.tsx`, `mobile/src/features/account/AccountScreen.tsx`, `mobile/src/features/auth/AuthScreen.tsx`, `mobile/src/features/cart/CartScreen.tsx`, `mobile/src/features/catalog/BrowseScreen.tsx`, `mobile/src/features/home/HomeScreen.tsx`, `mobile/src/features/onboarding/OnboardingScreen.tsx`, `mobile/src/features/orders/OrderDetailScreen.tsx`, `mobile/src/features/product/ProductDetailScreen.tsx`, `mobile/src/features/rider/*.tsx`, `mobile/src/features/search/SearchScreen.tsx`, `mobile/src/features/store/StorePicker.tsx`
- [ ] Remove `lucide-react-native` from `mobile/package.json` dependencies
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm test` passes
- [ ] Visual check: all tabs, buttons, headers show correct icons

**Notes:** GreenBidder uses `@tamagui/lucide-icons-2` per its package-lock.json. This satisfies the user's rule "no lucide unless GreenBidder has them" — GreenBidder has them via this package. Reference: `mobile/src/navigation/CustomerTabs.tsx:2`, `mobile/src/features/account/AccountScreen.tsx:2`.