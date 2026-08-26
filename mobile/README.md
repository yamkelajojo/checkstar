# Checkstar Mobile — Expo SDK 54.0.2 (Pinned)

> **⚠️ PINNED TO 54.0.2 — DO NOT UPGRADE**
> Production/test device has **Expo Go 54.0.2** (iPhone 17 — latest in App Store as of 2026-08-23). Any other SDK causes `SDK version mismatch` → app shows blank screen / won't load in Expo Go. See `AGENTS.md` and `app.json:sdkVersion`.

## Stack (SDK 54.0.2)

- `expo ~54.0.13` · `react 19.1.0` · `react-native 0.81.5` · `react-native-reanimated ~4.1.1` + `react-native-worklets`
- Docs: **https://docs.expo.dev/versions/v54.0.0/** (per `AGENTS.md`).
- `npx expo-doctor` passes 17/18 (the `sdkVersion` in `app.json` is intentionally pinned — expected).

## Running

```bash
cd mobile
npm ci            # use npm ci, not npm install, to respect pinned lockfile
npx expo start --clear --tunnel  # scan QR with Expo Go 54.0.2
```

If `expo-doctor` suggests SDK 54.0.x patches (e.g. `expo-blur ~15.0.8`), accept them — those are patch-compatible. The 1 failed check (`expo.sdkVersion` in `app.json`) is intentional and safe.

## How to intentionally upgrade (requires Go fleet update)

1. Update Expo Go on **every** test device to new major (check App Store direct link `https://apps.apple.com/app/expo-go/id982107779`, not search).
2. Bump together: `package.json:expo`, all `expo-*` deps (`npx expo install --fix`), `app.json:expo.sdkVersion`, `AGENTS.md` doc link, and this file's header.
3. Run `npx expo-doctor` and `npm run typecheck`, fix breakages (note: 17/18 expected due to pinned `sdkVersion`), document reason in git commit + this changelog.

## Changelog

- **2026-08-24** — Pinned to SDK 54.0.2 to match Expo Go 54.0.2 on device fleet. `app.json:sdkVersion` is `54.0.2`.
- **2026-08-23** — Initial pin to SDK 54.0 to match Expo Go on device fleet. Added `sdkVersion` to `app.json`, guard in `package.json`, and this README.

## Guard

`package.json` has `check:sdk-pin` (`node ./scripts/check-expo-sdk.js`). CI and `postinstall` fail if `expo` major != 54. See `scripts/check-expo-sdk.js`.
