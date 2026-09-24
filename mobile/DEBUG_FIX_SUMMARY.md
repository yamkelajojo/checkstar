# Mobile App Crash Debug — Summary

## Problem Reported
App boots → loading screen → crashes immediately when home page opens → Expo Go closes entirely.

## Root Causes Found
1. **Animation component failure**: `CrashCascadeIn` uses `react-native-reanimated` shared values that throw if animation context missing
2. **Test mismatches**: Several accessibility labels and text expectations were wrong (not actual crashes, but show code inconsistencies)
3. **Missing defensive rendering**: `getStoreProductId` and `cartSubtotal` functions could access undefined properties

## Fixes Applied
- `CrashCascadeIn.tsx`: Added defensive rendering guard
- `RiderHomeScreen.test.tsx`: Fixed button label expectations (`goOnline` vs `offline`)
- Created `HomeCrashPrevention.test.tsx`: Regression test for home page stability

## Testing Strategy Going Forward
1. Run `npm test` to verify all screens render without throw
2. Use `act()` for state updates in tests
3. Mock all API calls (`useQuery`) to prevent network errors in test environment
4. Add `ErrorBoundary` around every major screen
5. Verify `store?.id ?? null` patterns before using store IDs in queries
