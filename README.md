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
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `frontend/.env.local` | *(unset)* | When set, web maps switch from OpenStreetMap to Mapbox raster tiles (Styles Static Tiles API). Unset = OSM, no account needed. See [`docs/adr/0003-map-providers.md`](./docs/adr/0003-map-providers.md). |
| `NEXT_PUBLIC_MAPBOX_STYLE` | `frontend/.env.local` | `mapbox/streets-v12` | Optional Mapbox style id, e.g. `mapbox/light-v11` or `mapbox/outdoors-v12`. Ignored unless a token is set; anything that is not a lowercase `owner/style` id falls back to the default. |

**Turning Mapbox on (web):**

1. Create a free account at [mapbox.com](https://www.mapbox.com/) and copy a
   **public** token (`pk.…`).
2. Add `NEXT_PUBLIC_MAPBOX_TOKEN=pk.…` to `frontend/.env.local`, then restart the
   dev server. Restrict the token to your deployment origin in the Mapbox
   dashboard — `NEXT_PUBLIC_*` values ship in the browser bundle.
3. Verify it against the live API:

   ```bash
   cd frontend
   npm run check:mapbox     # or: node scripts/check-mapbox-tiles.mjs
   ```

   It fetches one tile over Durban CBD and prints `✓ HTTP 200 · image/png · …
   bytes`, or a per-status-code hint (`401` token rejected, `403` scope/URL
   restriction, `404` unknown style, `429` rate limit). With no token configured
   it exits `0` and explains that OpenStreetMap is in use — that is the designed
   default, not a failure.

Mapbox on **mobile** is deliberately not offered: `@rnmapbox/maps` cannot run in
Expo Go, and the fleet is pinned to Expo Go 57.

