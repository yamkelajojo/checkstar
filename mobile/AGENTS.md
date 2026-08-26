# ⚠️ EXPO SDK PINNED — DO NOT UPGRADE

> **SDK 54.0.2 ONLY. Do NOT bump.**
> Device fleet runs **Expo Go 54.0.2** (iPhone 17, latest available in App Store). Any other SDK = `SDK version mismatch` → blank screen, app won't load. See `mobile/README.md#sdk-pin` and `app.json:sdkVersion`.

# Expo HAS CHANGED

Read the exact versioned docs at **https://docs.expo.dev/versions/v54.0.0/** before writing any code.

- `npx expo-doctor` passes 17/18 (the `sdkVersion` in `app.json` is intentionally pinned — this is expected, not a bug).
- `npx expo install --fix` will suggest SDK 54-compatible versions — accept them. Never run `expo upgrade` without updating Go fleet.
- To intentionally unpin: update Expo Go on **all** test devices to matching major, then bump `mobile/package.json:expo`, `app.json:sdkVersion`, and this file together. Document in `mobile/README.md` changelog.
