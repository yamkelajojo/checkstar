# S06 — Store Picker System Test

**What to build:** Store picker modal (`StorePickerScreen.tsx`) — list of stores with distance/radius, auto-select nearest with available rider, persists selection in `deliveryStore`.

**Blocked by:** 06a, 06b, 06c, 08a, 09b, I02

**Status:** ready-for-agent

- [ ] Store list: `FlatList` from `useDeliveryStore` (hydrated via `useStores`), each row `TactilePressable`
- [ ] Active store: highlighted border `primary`, check icon, `accessibilityState={{ selected }}`
- [ ] Row shows: store name, address, delivery radius km, icon
- [ ] Press → `chooseStore(item, 'pick')` + `navigation.goBack()`
- [ ] Empty state: `EmptyState` "No stores yet" if `stores.length === 0`
- [ ] Auto-select logic: on app boot, if no store selected → pick nearest with available rider (delivery algorithm)
- [ ] Selection persists across app restarts (`deliveryStore` + storage)
- [ ] All tokens from Tamagui config; `radius.lg`, `shadows.raised`, `spacing.md`
- [ ] TalkBack: store rows announce name + radius + "selected" state

**Notes:** Reference `mobile/src/features/store/StorePickerScreen.tsx`, `mobile/src/stores/deliveryStore.ts`. Critical path — delivery radius determines fulfillment. Separate from onboarding (can be triggered from Home header too).