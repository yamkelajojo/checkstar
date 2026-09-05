# Checkstar

Durban supermarket chain — web (Next.js) + delivery (Laravel) + mobile (Expo).

## ⚠️ Mobile SDK Pin — Read First

**Mobile is pinned to Expo SDK 57** (`mobile/package.json:expo ~57.0.0`, `mobile/app.json:sdkVersion 57.0.0`) to match **Expo Go 57.0.0** on the device fleet. Running a different Expo Go version causes `SDK version mismatch` → **app won't load** — update Expo Go from the store before running. The pin is enforced by `mobile/scripts/check-expo-sdk.js` (runs on `npm install` and in CI).

**Mobile is pinned to Expo SDK 54** (`mobile/package.json:expo ~54.0.13`, `mobile/app.json:sdkVersion 54.0.0`) to match **Expo Go 54.0.2** on the device fleet (iPhone 17 — latest in App Store 2026-08-23). Upgrading to SDK 55/56/57 causes `SDK version mismatch` → **app won't load**.

- Source of truth: `mobile/AGENTS.md` (banner), `mobile/README.md#sdk-pin`
- Guard: `mobile/scripts/check-expo-sdk.js` runs on `postinstall` and as `npm run check:sdk-pin` — fails CI if major ≠ 54
- To upgrade: update Expo Go on **all** devices, then bump `mobile/package.json`, `mobile/app.json`, `mobile/AGENTS.md`, and `mobile/README.md` together

## Docs

- `CONTEXT.md` — ubiquitous language (Customer, Rider, Store, Dispatch, etc.)
- `mobile/README.md` — run instructions, UX map + SDK pin changelog
- `mobile/AGENTS.md` — versioned Expo docs link

## Quick start

```bash
# backend (Laravel)
cd backend && composer install && php artisan migrate && php artisan serve

# frontend (Next.js)
cd frontend && npm ci && npm run dev

# mobile (Expo Go 54.0.2)
cd mobile && npm ci && npx expo start --clear --tunnel
```
