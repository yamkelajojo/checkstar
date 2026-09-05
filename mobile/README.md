# Checkstar Mobile — Expo SDK 57 (~57.0.0, Expo Go 57.0.0)

> **PINNED TO SDK 57 (`~57.0.0`) — matches Expo Go 57.0.0 on the device fleet.**
> Upgraded from SDK 54 on 2026-09-05 (device Expo Go is 57.0.0). All dependency ranges come from
> `node_modules/expo/bundledNativeModules.json` (the exact source `expo install --fix` uses):
> `react 19.2.3` · `react-native 0.86.3` · `react-native-reanimated ~4.5.1` + `react-native-worklets 0.10.1`.
> The pin guard (`scripts/check-expo-sdk.js`, runs on postinstall + CI) fails on any other major.
> See `AGENTS.md` and `app.json:sdkVersion`.

## Stack (SDK 57)

- `expo ~57.0.0` · `react 19.2.3` · `react-native 0.86.3` · `react-native-reanimated ~4.5.1` + `react-native-worklets 0.10.1` · `expo-modules-core ~57.0.16` (explicit dep so jest-expo resolves it)
- Docs: **https://docs.expo.dev/versions/v57.0.0/** (per `AGENTS.md`).
- `npx expo-doctor` passes 17/18 (the `sdkVersion` in `app.json` is intentionally pinned — expected).

## Running

```bash
cd mobile
npm ci            # use npm ci, not npm install, to respect pinned lockfile
npx expo start --clear --tunnel  # scan QR with Expo Go 57.0.0
```

If `expo-doctor` flags version drift, prefer `npx expo install --fix` (reads the SDK's bundledNativeModules manifest) over hand-bumping. `expo-modules-core` is declared explicitly so jest-expo resolves it from the top level of node_modules.

## How to intentionally upgrade (requires Go fleet update)

1. Update Expo Go on **every** test device to new major (check App Store direct link `https://apps.apple.com/app/expo-go/id982107779`, not search).
2. Bump together: `package.json:expo`, all `expo-*` deps (`npx expo install --fix`), `app.json:expo.sdkVersion`, `AGENTS.md` doc link, and this file's header.
3. Run `npx expo-doctor` and `npm run typecheck`, fix breakages (note: 17/18 expected due to pinned `sdkVersion`), document reason in git commit + this changelog.

## Changelog

- **2026-09-05** — **Upgraded to SDK 57** (`expo ~57.0.0`, `react-native 0.86.3`, `react 19.2.3`) to match Expo Go 57.0.0 on the device fleet. RN 0.86 removed `StyleSheet.absoluteFillObject` (inlined in `ProgressBar`); `react-native-maps@1.27` resolves its TurboModule eagerly at import — added a jest manual mock; `expo-modules-core ~57.0.16` declared explicitly so jest-expo's preset can resolve it. All 63 jest suites + typecheck + pin guard green.
- **2026-08-26** — Pinned to SDK 54.0.0 (Go 54.0.2 compatible) — `54.0.2`/`54.0.13` have empty native module list on `api.expo.dev` (verified `curl` `54.0.0=119` vs `54.0.2=0`), fixing `CommandError: The bundled native module list...empty` and `--offline` LAN breakage. Phone stays on Go `54.0.2`.
- **2026-08-24** — Pinned to SDK 54.0.2 to match Expo Go 54.0.2 on device fleet. `app.json:sdkVersion` is `54.0.2`.
- **2026-08-23** — Initial pin to SDK 54.0 to match Expo Go on device fleet. Added `sdkVersion` to `app.json`, guard in `package.json`, and this README.

## Guard

`package.json` has `check:sdk-pin` (`node ./scripts/check-expo-sdk.js`). CI and `postinstall` fail if `expo` major != 54. See `scripts/check-expo-sdk.js`.
