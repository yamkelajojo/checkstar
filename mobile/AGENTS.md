# ⚠️ EXPO SDK PINNED — DO NOT UPGRADE

> **SDK 54 ONLY. Do NOT bump to 55/56/57.**
> Device fleet runs **Expo Go 54.0.2** (iPhone 17, latest available in App Store). SDK 55+ = `SDK version mismatch` → blank screen, app won't load. See `mobile/README.md#sdk-pin` and `app.json:sdkVersion`.

# Expo HAS CHANGED

Read the exact versioned docs at **https://docs.expo.dev/versions/v54.0.0/** before writing any code.

- `npx expo-doctor` must pass (18/18) before pushing.
- `npx expo install --fix` will suggest SDK 54-compatible versions — accept them. Never run `expo upgrade` without updating Go fleet.
- To intentionally unpin: update Expo Go on **all** test devices to matching major, then bump `mobile/package.json:expo`, `app.json:sdkVersion`, and this file together. Document in `mobile/README.md` changelog.
