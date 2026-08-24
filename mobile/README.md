# Checkstar Mobile — Expo SDK 54 (Pinned)

> **⚠️ DO NOT UPGRADE EXPO SDK BEYOND 54**
> Production/test device has **Expo Go 54.0.2** (iPhone 17 — latest in App Store as of 2026-08-23). Upgrading `expo` to 55/56/57 causes `SDK version mismatch` → app shows blank screen / won't load in Expo Go. Downgraded from 57.0.10 → 54.0.13 on 2026-08-23 for this reason. See `AGENTS.md` and `app.json:sdkVersion`.

## Stack (SDK 54)

- `expo ~54.0.13` · `react 19.1.0` · `react-native 0.81.5` · `react-native-reanimated ~4.1.1` + `react-native-worklets`
- Docs: **https://docs.expo.dev/versions/v54.0.0/** (per `AGENTS.md`). Do not use v57 docs.
- `npx expo-doctor` must be 18/18 before commit.

## Running

```bash
cd mobile
npm ci            # use npm ci, not npm install, to respect pinned lockfile
npx expo start --clear --tunnel  # scan QR with Expo Go 54.0.2
```

If `expo-doctor` suggests SDK 54.0.x patches (e.g. `expo-blur ~15.0.8`), accept them — those are patch-compatible. Reject any suggestion to jump to 55+.

## How to intentionally upgrade (requires Go fleet update)

1. Update Expo Go on **every** test device to new major (check App Store direct link `https://apps.apple.com/app/expo-go/id982107779`, not search).
2. Bump together: `package.json:expo`, all `expo-*` deps (`npx expo install --fix`), `app.json:expo.sdkVersion`, `AGENTS.md` doc link, and this file's header.
3. Run `npx expo-doctor` and `npm run typecheck`, fix breakages, document reason in git commit + this changelog.

## Changelog

- **2026-08-23** — Pinned to SDK 54.0 (downgrade from 57.0.10) to match Expo Go 54.0.2 on device fleet. Added `sdkVersion` to `app.json`, guard in `package.json`, and this README. — `AGENTS.md` now carries banner warning.

## Guard

`package.json` has `check:sdk-pin` (`node ./scripts/check-expo-sdk.js`). CI and `postinstall` fail if `expo` major != 54. See `scripts/check-expo-sdk.js`.
