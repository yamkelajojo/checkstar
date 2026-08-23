# 06m — Store Picker Unit Tests

**What to build:** Unit tests for `StorePickerScreen` component: store list rendering, selection, auto-select logic.

**Seam Under Test:** `StorePickerScreen` component + `useDeliveryStore` actions

**Blocked by:** 06a, 06b, 06c, 08a, 09b

**Status:** ready-for-agent

- [ ] Store list: renders `TactilePressable` per store from `useDeliveryStore`
- [ ] Active store: border `primary`, check icon, `accessibilityState={{ selected: true }}`
- [ ] Press store → `chooseStore(store, 'pick')` + `navigation.goBack()`
- [ ] Empty state: `EmptyState` when `stores.length === 0`
- [ ] Auto-select: on mount if no store selected → `chooseStore(nearestWithRider, 'auto')`

**Notes:** Reference `mobile/src/features/store/StorePickerScreen.tsx`, `mobile/src/stores/deliveryStore.ts`. Complements system test S06.