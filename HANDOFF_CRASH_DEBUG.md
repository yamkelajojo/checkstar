# Handoff: Silent Native Crash in Expo Go 57.0.9 (iPhone)

## Environment
- **App**: Checkstar mobile (Expo SDK 57.0.0, Expo Go 57.0.9)
- **Device**: Physical iPhone 17, iOS 18+
- **Metro**: `exp://192.168.0.108:8082` (LAN)
- **Backend**: Laravel on `http://192.168.0.108:8000/api` (0.0.0.0:8000)
- **OS**: Windows (dev machine), iOS (device)

## Symptom
- App loads, shows home screen for ~0.5s, then **Expo Go closes completely** (no red screen, no JS error in Metro logs).
- Metro logs show: `iOS Bundled ... index.ts (1 module)` — bundle compiles fine.
- No error in `metro.log` or `metro.err.log`.
- This is a **native crash** (SIGABRT / EXC_BAD_ACCESS / Reanimated worklet crash).

## Key Code Changes (Recent — Apple Polish Pass)
Commits `d8c7ff3` → `27651e8` introduced heavy Reanimated 4.5.1 usage:
- `TabScreenWrapper.tsx` — directional entrance + motion blur (worklets)
- `AnimatedTabBar.tsx` — sliding indicator + tab items (worklets)
- `CustomerTabs.tsx` — PagerView + shared values for scroll sync
- `FadeSlideIn.tsx` — tab-coordinated entrance animations (worklets)
- `PhysicsCarousel.tsx` — FlatList with `onMomentumScrollEnd` worklet (FIXED: removed `'worklet'`)
- `BannerCarousel.tsx` — FlatList paging + AnimatedDot (worklets)
- `RootNavigator.tsx` — native-stack with Apple easing (`Easing.bezier(0.16,1,0.3,1)`)

## Config (Verified)
- `babel.config.js`: Only `@tamagui/babel-plugin` (babel-preset-expo auto-injects `react-native-worklets/plugin` — confirmed via source)
- `app.json`: `sdkVersion: "57.0.0"`, plugins: `["expo-font"]` only
- `package.json`: `react-native-reanimated: "4.5.1"`, `react-native-worklets: "0.10.1"`, `expo: "~57.0.24"`
- `npx expo-doctor`: 20/21 pass (only `expo-modules-core` direct dep warning — known/intentional)
- `npm run typecheck`: clean
- `npx expo install --check`: clean

## Crash Hypotheses (Ranked)

### 1. Reanimated Worklet Crash on UI Thread (Most Likely)
- Reanimated 4 worklets run on the UI thread; any throw crashes the native process silently.
- Components using `useAnimatedStyle`, `useDerivedValue`, `useSharedValue` with complex math:
  - `TabScreenWrapper.tsx`: `blurIntensity`, `animatedStyle`, `ghostStyle` — all `useDerivedValue`/`useAnimatedStyle`
  - `FadeSlideIn.tsx`: `animatedStyle` with `interpolate` + `tabTransition.direction`
  - `AnimatedTabBar.tsx`: `indicatorStyle` with `scrollPosition` + `scrollOffset`
  - `PhysicsCarousel.tsx`: `onScroll` handler, `onMomentumScrollEnd` (was `'worklet'`, now fixed)
  - `BannerCarousel.tsx`: `AnimatedDot` with `useSharedValue` + `withSpring`

### 2. `react-native-pager-view` + Reanimated Interop
- `CustomerTabs.tsx` uses `PagerView` with `onPageScroll`/`onPageSelected` feeding Reanimated shared values.
- `scrollPosition` and `scrollOffset` are shared values updated from native scroll events — timing issues can cause UI thread crashes.

### 3. `expo-linear-gradient` + Reanimated
- `HomeScreen.tsx` and `BannerCarousel.tsx` use `LinearGradient` inside Reanimated-animated views.
- Known issue: LinearGradient native view + Reanimated transform can crash on iOS.

### 4. `expo-image` in Reanimated Context
- `ProductCard.tsx` uses `expo-image` (`Image` from `expo-image`) inside `TabScreenWrapper` / `FadeSlideIn`.
- Image loading + animated transform may trigger native crash.

### 5. Native Stack Navigator Easing
- `RootNavigator.tsx` line 76: `easing: EASE_APPLE` (`Easing.bezier(0.16,1,0.3,1)` as `any`).
- `@react-navigation/native-stack` may not accept custom easing on iOS 18.

## Files to Inspect First
| File | Risk | Reason |
|------|------|--------|
| `TabScreenWrapper.tsx` | HIGH | Complex `useDerivedValue` + `useAnimatedStyle` with motion blur math |
| `FadeSlideIn.tsx` | HIGH | Tab-coordinated re-animation, `interpolate` with direction |
| `AnimatedTabBar.tsx` | HIGH | `indicatorStyle` follows `scrollPosition` + `scrollOffset` directly |
| `CustomerTabs.tsx` | HIGH | PagerView → shared value bridge |
| `PhysicsCarousel.tsx` | MEDIUM | Fixed `'worklet'` but `onScroll` handler still runs on UI thread |
| `BannerCarousel.tsx` | MEDIUM | `AnimatedDot` worklets + `FlatList` paging |
| `RootNavigator.tsx` | LOW | Custom easing on native stack |

## Debugging Steps for Next Agent

### 1. Get iOS Crash Log (Critical)
On iPhone: Settings → Privacy & Security → Analytics & Improvements → Analytics Data → Find "Checkstar" or "ExpoGo" or "JetsamEvent" from today → Paste full text.

### 2. Binary Search: Disable Animation Modules
In `CustomerTabs.tsx`, temporarily replace `PagerView` with fallback `View` (line 75-126 already has fallback). Test if crash stops.

### 3. Disable Motion Blur
In `TabScreenWrapper.tsx`: set `reduceMotion` to always return `true` (edit `useReducedMotion.ts` to return `true`).

### 4. Disable FadeSlideIn Tab Coordination
In `FadeSlideIn.tsx`: set `disableTabCoordination={true}` on all usages in `HomeScreen.tsx`.

### 5. Remove Custom Easing
In `RootNavigator.tsx`: remove `easing: EASE_APPLE` from `screenOptions`.

### 6. Check `expo-image` Usage
In `ProductCard.tsx`: replace `expo-image` `Image` with `react-native` `Image` temporarily.

## Commands to Run
```bash
# In mobile/
npm run typecheck
npx expo-doctor@latest
npx expo install --check
npx expo start -c --lan   # Start Metro on LAN
```

## Backend Note
- API URL auto-detected from Metro host (`192.168.0.108`).
- If user previously set wrong IP in Developer Settings (AccountScreen), it's cached in AsyncStorage. But this causes API 404, not native crash.

## What I've Already Fixed
1. Removed duplicate `react-native-reanimated/plugin` from babel.config.js (babel-preset-expo auto-injects worklets plugin).
2. Removed `expo-notifications` from App.tsx (Expo Go limited support).
3. Fixed `TabScreenWrapper.tsx` ghost layer double-render (`{children}` → `{null}`).
4. Removed `'worklet'` directive from `PhysicsCarousel.tsx` `onMomentumScrollEnd`.
5. Fixed `AccountScreen.tsx` `getLocalIp()` to auto-detect Metro host.
6. Restarted backend on `0.0.0.0:8000` for LAN access.

## Next Step
**Paste the iOS crash log.** That will pinpoint the exact module/thread. Without it, we're guessing among 5+ Reanimated-heavy components.

---

**For the next agent**: Start by getting the crash log. Then disable animation modules one by one (binary search) until the crash stops. The crash is 95% likely a Reanimated worklet throwing on the UI thread.