# ADR 0001: Mobile App — React Native + Expo SDK 54

**Date:** 2026-08-23  
**Status:** Accepted (reconstructed — was referenced by MOBILE_APP_UX.md but missing)

## Context

Checkstar needs a customer-facing mobile app for grocery delivery in Durban (3 stores, motorbike couriers). The team has an existing Flutter grocery app (`Flutter-GroceryApp-main`) as a UX reference only. The decision was to build in **React Native (Expo)** rather than Flutter, Kotlin/Swift, or React Native CLI.

## Decision

- **Framework:** React Native via **Expo SDK 54** (managed workflow)
- **Language:** TypeScript (strict)
- **State:** Zustand for client state; TanStack Query (React Query) for server state
- **Navigation:** React Navigation v7 (native stack + bottom tabs)
- **Styling (initial):** Custom theme system (`src/theme/`) — colors, spacing, typography tokens; plain RN components
- **Icons:** `lucide-react-native`
- **Animations:** `react-native-reanimated` v4
- **Forms/Validation:** Native + custom hooks (no heavy form lib)
- **Device fleet:** iPhone 17 running **Expo Go 54.0.2** — **SDK pinned to 54** (see AGENTS.md). Upgrading Expo SDK requires updating Expo Go on all test devices simultaneously.
- **Backend:** Laravel 11 API at `http://192.168.1.100:8000/api` (local LAN during dev)

## Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Flutter | Single codebase, good performance | Team expertise in RN/TS; existing GreenBidder RN codebase; web reuse harder | Rejected |
| React Native CLI | Full native control | More config burden; Expo managed workflow fits team size & speed | Rejected |
| Expo SDK 55+ | Newer features | **Breaks Expo Go 54 on device fleet** — cannot upgrade without fleet update | Deferred |
| Native iOS/Android | Best performance | 2x dev effort; no code sharing with web/admin | Rejected |

## Consequences

**Positive:**
- Single TypeScript codebase for mobile + future web admin
- Expo managed workflow = fast iteration, OTA updates, easy device testing
- GreenBidder (existing RN/Tamagui app) becomes a direct component/pattern donor
- React Navigation + Reanimated + Query = mature, well-supported stack

**Negative / Risks:**
- SDK pin means missing newer Expo/React Native features (RN 0.81, React 19 are current)
- Expo Go limitations: no push notifications (SDK 53+), no custom native modules — requires **development build** for production push
- Android emulator needs `10.0.2.2` for localhost backend access (not `192.168.x`)

## Follow-up

ADR 0002 adopts Tamagui v2 as the styling system, replacing the custom theme.