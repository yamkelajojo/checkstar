# ⚠️ EXPO SDK PINNED — DO NOT UPGRADE

> **SDK 54.0.0 ONLY (Expo Go 54.0.2 compatible). Do NOT bump.**
> Device fleet runs **Expo Go 54.0.2** (iPhone 17, latest available in App Store) but **api.expo.dev only has native modules for 54.0.0** — `54.0.2`/`54.0.13` return `{"data":[]}` → `CommandError: The bundled native module list from the Expo API is empty`. Patch `54.0.0` is fully compatible with Go `54.0.2`. See `mobile/README.md#sdk-pin` and `app.json:sdkVersion`.

# Expo HAS CHANGED

Read the exact versioned docs at **https://docs.expo.dev/versions/v54.0.0/** before writing any code.

- `npx expo-doctor` passes 17/18 (the `sdkVersion` in `app.json` is intentionally pinned — this is expected, not a bug).
- `npx expo install --fix` will suggest SDK 54-compatible versions — accept them. Never run `expo upgrade` without updating Go fleet.
- To intentionally unpin: update Expo Go on **all** test devices to matching major, then bump `mobile/package.json:expo`, `app.json:sdkVersion`, and this file together. Document in `mobile/README.md` changelog.
