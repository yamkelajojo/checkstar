# ⚠️ EXPO SDK PINNED — DO NOT UPGRADE

> **SDK 57 ONLY (matches Expo Go 57.0.0). Do NOT bump without updating Expo Go on all devices.**
> Aligned to **Expo Go 57.0.0** on 2026-09-05 using the SDK 57 bundledNativeModules manifest (`react 19.2.3`, `react-native 0.86.3`). The pin guard (`scripts/check-expo-sdk.js`, postinstall + CI) enforces major 57. See `mobile/README.md#sdk-pin` and `app.json:sdkVersion`.

# Expo HAS CHANGED

Read the exact versioned docs at **https://docs.expo.dev/versions/v57.0.0/** before writing any code.

- `npx expo-doctor` passes 17/18 (the `sdkVersion` in `app.json` is intentionally pinned — this is expected, not a bug).
- `npx expo install --fix` will suggest SDK 54-compatible versions — accept them. Never run `expo upgrade` without updating Go fleet.
- To intentionally unpin: update Expo Go on **all** test devices to matching major, then bump `mobile/package.json:expo`, `app.json:sdkVersion`, and this file together. Document in `mobile/README.md` changelog.
