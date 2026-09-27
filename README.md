# Checkstar

Durban supermarket chain — web (Next.js) + delivery (Laravel) + mobile (Expo).

## ⚠️ Mobile SDK Pin — Read First

**Mobile is pinned to Expo SDK 57** (`mobile/package.json:expo ~57.0.0`, `mobile/app.json:sdkVersion 57.0.0`) to match **Expo Go 57.0.0** on the device fleet. Running a different Expo Go version causes `SDK version mismatch` → **app won't load** — update Expo Go from the store before running. The pin is enforced by `mobile/scripts/check-expo-sdk.js` (runs on `npm install` and in CI).

- Source of truth: `mobile/AGENTS.md` (banner), `mobile/README.md#sdk-pin`
- Guard: `mobile/scripts/check-expo-sdk.js` runs on `postinstall` and as `npm run check:sdk-pin` — fails CI if major ≠ 57
- To upgrade: update Expo Go on **all** devices, then bump `mobile/package.json`, `mobile/app.json`, `mobile/AGENTS.md`, and `mobile/README.md` together

## Docs

- `CONTEXT.md` — ubiquitous language (Customer, Rider, Store, Dispatch, etc.)
- `mobile/README.md` — run instructions, UX map + SDK pin changelog
- `mobile/AGENTS.md` — versioned Expo docs link
- `docs/adr/` — architecture decision records (Expo SDK, Tamagui, map providers)
- `docs/design-critique-2026-09-27.md` — whole-system cohesion critique + fix log
- `docs/test-traceability.md` — requirement → test traceability matrix (V-model)

## Quick start

Everything below works on Windows (PowerShell or cmd) and on macOS/Linux. Node 18+
and PHP 8.2+ must be on PATH; Composer is needed once for the backend.

```bash
# 1. install everything and prepare the backend (.env, key, migrated + seeded sqlite)
npm run setup

# 2. start the whole stack: api :8000, web :3000, mobile QR (Expo Go 57.0.0)
npm run dev

#    ...or just the parts you need
npm run dev:web        # api + web
npm run dev:api        # api only
```

`npm run setup` is idempotent: it skips installs and seeding that already exist and
prints the exact command for anything it cannot do (e.g. missing PHP or Composer).

### Manual equivalent (if you prefer separate terminals)

```bash
# backend (Laravel)
cd backend && composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed --force && php artisan serve

# frontend (Next.js)
cd frontend && npm ci && npm run dev

# mobile (Expo Go 57.0.0)
cd mobile && npm ci && npx expo start --clear --tunnel
```

### Tests

```bash
npm test               # backend + frontend + mobile, one summary
npm run typecheck      # tsc --noEmit for frontend + mobile
npm run test:backend   # or any single suite
```

Gate evidence and the exact reproduction commands for each acceptance gate live in
[`GATES.md`](./GATES.md).

### Optional environment (nothing here is required to run the prototype)

| Variable | Where | Default | Effect |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | `http://localhost:8000` | Backend origin the web client calls (also used to rewrite media URLs to same-origin paths). |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `frontend/.env.local` | *(unset)* | When set, web maps switch from OpenStreetMap to Mapbox raster tiles. Unset = OSM, no account needed. See [`docs/adr/0003-map-providers.md`](./docs/adr/0003-map-providers.md). |

Mapbox on **mobile** is deliberately not offered: `@rnmapbox/maps` cannot run in
Expo Go, and the fleet is pinned to Expo Go 57. If you do add a token, restrict it
to your deployment origin in the Mapbox dashboard — `NEXT_PUBLIC_*` values ship in
the browser bundle.

