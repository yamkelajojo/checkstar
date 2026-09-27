# ADR 0003: Map providers — Leaflet + OpenStreetMap by default, Mapbox as a token-gated enhancement

**Date:** 2026-09-27  
**Status:** Accepted  
**Related:** `docs/manager-qa-refactor-plan.md` (fix the current map providers first; no paid credentials unless proven necessary), ADR 0001 (mobile = Expo managed workflow, pinned to Expo Go 57)

## Context

Checkstar has maps on both clients and they are load-bearing:

- **Web (Next.js 15 + Leaflet):** store locator, order tracking, admin route preview, rider dispatch board (`frontend/src/components/MapContainer.tsx`, `OrderTrackingMap.tsx`).
- **Mobile (Expo SDK 57 + `react-native-maps`):** `RouteMap`, `LiveDeliveryMap`, `RouteExplorerScreen`, `RiderOrderDetailScreen`, store picker.

The prototype's primary promise is that it **runs on a fresh clone with zero credentials**: `npm run setup && npm run dev` on a Windows laptop, and the mobile app inside **Expo Go 57.0.0** on the test fleet. Any map decision that requires a paid account, a native rebuild, or a secret in CI breaks that promise.

The question put to the team: *would Mapbox work better for all our features? If it would, implement it.*

## Research (evidence, not opinion)

| Finding | Source |
| --- | --- |
| `@rnmapbox/maps` "cannot be used in the Expo Go app because it requires custom native code" — an Expo **dev client / production build** is mandatory. | rnmapbox install docs (`rnmapbox.github.io/docs/install`, repo `plugin/install.md`) |
| The Expo-Go-compatible map library is `react-native-maps`; anything else needs a custom dev client. | r/reactnative developer threads on Expo Go map constraints |
| `react-native-maps` **dropped its Mapbox provider**; Mapbox tiles are not selectable through it. | `react-native-maps` provider documentation / issue history |
| Mapbox charges **per map load**, even when you serve your own tiles/styles. | Mapbox pricing documentation; community write-ups |
| Mapbox **transferred the React Native SDK to community maintenance**. | Mapbox blog / rnmapbox repository governance notes |

Conclusion: on mobile, Mapbox is not an option while the fleet runs Expo Go — it would break the prototype's runtime, not improve it.

On the web the situation is different: Leaflet can consume Mapbox **raster tiles** with a URL template and a token, requiring **no new dependency and no build changes**.

## Decision

1. **Web keeps Leaflet as the map engine.** One engine, one branded pin (`checkstarPinIcon`), one degradation path (the `tileerror` → "Map unavailable right now" notice).
2. **Tile source becomes a provider abstraction, not a constant.** `frontend/src/lib/mapTiles.ts` exposes `getTileProvider(env)` and `tileLayerOptions(provider)`:
   - **No token → OpenStreetMap raster** (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, maxZoom 18) — exactly today's behaviour, zero credentials.
   - **`NEXT_PUBLIC_MAPBOX_TOKEN` set → Mapbox raster** from the **Styles Static Tiles API** (`https://api.mapbox.com/styles/v1/{style}/tiles/256/{z}/{x}/{y}@2x?access_token=…`) with `tileSize: 512` and `zoomOffset: -1`, which 512px tiles require, `maxZoom: 19`, and attribution `© Mapbox © OpenStreetMap contributors`. `{style}` defaults to `mapbox/streets-v12` and is overridable with `NEXT_PUBLIC_MAPBOX_STYLE`, validated as a lowercase `owner/style` id so it can never escape the URL path.
     - *Endpoint correction (2026-09-27):* the first implementation used the legacy v4 raster endpoint (`api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}@2x.png`). Mapbox deprecated those `mapbox.*` v4 tilesets in favour of Styles Static Tiles; the old path answers `410 Gone`, so a paying operator would have seen an empty map. `mapTiles.test.ts` and `MapContainer.test.tsx` now assert the exact URL — including `not.toContain("/v4/")` — so the mistake cannot recur silently. Source: docs.mapbox.com, *Use a Mapbox style in Leaflet*.
   - Whitespace-only or empty tokens fall back to OSM (a pasted blank `.env` line must not produce a 401-ing map).
   - The provider is resolved **per map init**, not at module scope, so the environment the app boots in is what it gets.
   - The token is never written into attribution or logs.
3. **Mobile stays on `react-native-maps`** with its Apple/Google providers. No Mapbox dependency is added; the SDK pin (Expo Go 57) remains the binding constraint.
4. **Cross-client cohesion is enforced where it can be:** the same pin geometry and brand colours (`PIN_BADGE_NAVY = #262D3A`, brand orange `#EB6522`) on web and mobile, and coordinate parsing that tolerates the API's decimal **strings** (`toFiniteNumber` in `frontend/src/lib/polyline.ts`, `mobile/src/lib/numbers.ts`).

## Consequences

**Positive**

- Fresh clones, CI and Windows laptops keep working with **no keys and no cost** — the default path is unchanged and is now regression-tested.
- An operator who buys a Mapbox token gets better raster tiles, Mapbox's CDN and consistent styling on the web by setting **one environment variable** — no code change, no redeploy of the mobile app.
- The tile decision is now a **tested contract** (`mapTiles.test.ts`, `MapContainer.test.tsx`) instead of a string literal buried in a component, so the next provider swap is a one-file change.

**Negative / risks**

- Web and mobile basemaps can differ when a token is set (Mapbox raster on web, Apple/Google on mobile). Accepted: the branded pins and interaction model stay identical, and mobile cannot host Mapbox in Expo Go at all.
- Mapbox Static Tiles are **raster**, not vector styles: no client-side restyling, no Mapbox GL features (3D, custom layers). If those are ever needed on the web, that is a separate ADR (MapLibre GL JS / Mapbox GL JS).
- Public tokens are visible in the client bundle by definition (`NEXT_PUBLIC_*`). Mapbox tokens must be **URL-restricted** to the deployment origin in the Mapbox dashboard; this is documented in `README.md`.

## Alternatives considered

| Option | Verdict | Why |
| --- | --- | --- |
| Mapbox everywhere (`@rnmapbox/maps` on mobile) | **Rejected** | Impossible in Expo Go (custom native code); would require dev clients on the whole fleet, contradicting ADR 0001 and the SDK pin. Also per-map-load billing and a community-maintained RN SDK. |
| Mapbox GL JS on the web (replace Leaflet) | **Rejected (for now)** | New dependency (~200KB), WebGL requirement, licensing questions, and it would rewrite every map surface + all map tests for a prototype. Raster tiles deliver most of the visual gain with zero of that risk. |
| Hardcoded OSM URL (status quo) | **Superseded** | Worked, but a deployment concern lived inside a UI component and could not be changed without editing code. |
| Provider chosen at runtime by a user-facing toggle | **Rejected** | Adds a control nobody asked for; violates "saying no to 1,000 things". Environment configuration is the right altitude. |

## Upgrade path (mobile)

If the fleet ever leaves Expo Go for dev clients / production builds, the mobile Mapbox question reopens:

1. Add `@rnmapbox/maps` + its config plugin, build a dev client (`npx expo run:android` / EAS).
2. Keep `react-native-maps` behind the same `RouteMap` props so screens do not change; swap the implementation, not the interface.
3. Re-run the SDK pin check (`mobile/scripts/check-expo-sdk.js`) and update this ADR.

Until then, **Expo Go is the constraint that decides the map stack on mobile.**

## Verification

- `frontend/src/lib/__tests__/mapTiles.test.ts` — provider selection, exact Styles Static Tiles URL (and an explicit `not.toContain("/v4/")`), style override + style-id validation, token trimming, whitespace rejection, 512px hints, maxZoom 19, no token leakage into attribution.
- `frontend/scripts/check-mapbox-tiles.mjs` (`npm run check:mapbox`) — **live** verification with a real token: fetches one Durban tile, asserts `200` + `image/*`, redacts the token in output, exits 1 with a per-status-code hint on failure, and fails if its URL shape drifts from `mapTiles.ts`. Unit tests pin the contract; only this proves a given token works, and it must run on a machine that can reach `api.mapbox.com`.
- `frontend/src/components/__tests__/MapContainer.test.tsx` — OSM by default, Mapbox when the env token is stubbed, tile-outage messaging and recovery, branded pin, late-arriving markers, marker replacement.
