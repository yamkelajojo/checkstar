# Mockup Analysis & Implementation Plan

**Date:** 2026-08-29
**Status:** Analysis complete — pending user decision on implementation scope

---

## Part 1: Documentation Cleanup

### Files to DELETE (10 files)

| # | File | Reason |
|---|------|--------|
| 1 | `docs/PHASE1_REPORT.md` | Completed implementation audit — retrospective tracking, decisions already captured in ADRs |
| 2 | `docs/AUDIT_REPORT.md` | Completed integration review — "Final Status" report, gaps captured in route-explorer.md |
| 3 | `docs/grilling/mobile-ui-overhaul.md` | Grilling session record — decisions already in ADR 0002 and MOBILE_APP_UX.md |
| 4 | `docs/SMART_TRACKING_ANALYSIS.md` | Future feature analysis — "Leave for future sprint", no current system knowledge |
| 5 | `graphify-out/GRAPH_REPORT.md` | Auto-generated knowledge graph output — can be regenerated |
| 6 | `graphify-out/graph.html` | Auto-generated visualization |
| 7 | `graphify-out/graph.json` | Auto-generated graph data |
| 8 | `graphify-out/manifest.json` | Auto-generated manifest |
| 9 | `graphify-out/cost.json` | Auto-generated cost tracking |
| 10 | `graphify-out/cache/` (entire directory) | 48 auto-generated cache files |

**Also consider removing** (auto-generated, not documentation):
- `graphify-out/.graphify_cached.json` and `.graphify_python` (hidden config files)
- `.scratch/` directory (68 ticket files across 4 phases — completed work tracking)
- `__pycache__/` (Python bytecode cache)
- `osrm-server-output.log` (runtime log)
- `mobile/coverage/` (test coverage output — regenerate with `npm test -- --coverage`)

### Files to KEEP (18 files)

| # | File | Reason |
|---|------|--------|
| 1 | `CONTEXT.md` | Ubiquitous language / glossary — foundational domain document |
| 2 | `README.md` | Root project README — quick start, doc index |
| 3 | `cs.md` | Website Intelligence Report — original checkstar.co.za audit, brand identity, colours, typography |
| 4 | `MOBILE_APP_UX.md` | Mobile UX page map — living doc for Customer/Rider screen flow |
| 5 | `checkstar_recipes.md` | Original Checkstar recipes content — product asset to migrate |
| 6 | `docs/adr/0001-mobile-react-native-expo.md` | ADR — Mobile framework decision |
| 7 | `docs/adr/0002-tamagui-design-system-adoption.md` | ADR — Design system decision |
| 8 | `docs/route-explorer.md` | Route Explorer feature spec — active reference |
| 9 | `frontend/ARCHITECTURE.md` | Frontend navigation & motion architecture |
| 10 | `mobile/README.md` | Mobile build instructions + SDK pin changelog |
| 11 | `mobile/AGENTS.md` | SDK pin guard doc — critical warning |
| 12 | `mobile/CLAUDE.md` | Claude agent instructions |
| 13 | `backend/README.md` | Laravel framework README |
| 14 | `checkstar-logo-icon-star.html` | Logo icon SVG asset |
| 15 | `checkstar-logo-text.html` | Logo text SVG asset |
| 16 | `osrm-durban/*/README.txt` (2 files) | GeoPackage data attribution — required for data provenance |
| 17 | `backend/public/robots.txt` | Search engine crawler config |

---

## Part 2: Mockup Project Analysis

### Project Overview

All three projects are rider order management simulators — operations dashboards for monitoring riders, orders, and deliveries in Durban. They are NOT rider-facing apps; they are **command center** surfaces.

| # | Project | Status | Map Library | Lines of Code | Key Strength |
|---|---------|--------|-------------|---------------|--------------|
| Copy (1) | Crashes on start | MapLibre GL + Canvas 2D | ~2,964 | Best UI buttons/controls, Zustand state, boot sequence |
| Copy (2) | Runs, map visible | Leaflet + Canvas overlay | ~3,500+ | Dark map theme, sounds, A* routing, route animation |
| Copy (3) | Map not rendering (CDN) | MapLibre GL raster | ~1,309 | Full command center layout, simulation engine, glass UI |

---

### Copy (3) — Command Center Dashboard (User's Preferred Layout)

**Why the map doesn't render:** Carto dark raster tiles (`dark_all`) require network access to `basemaps.cartocdn.com`. If CDN is blocked or slow, tiles fail silently. The map code itself is correct — standard MapLibre raster tile setup.

**What to take from this project:**

#### Layout Architecture (the full command center pattern)
```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] CHECKSTAR OPS    [Weather][SLA]  [Speed]  [Avatar]  │ ← Top Bar
├────────┬─────────────────────────────────────┬───────────────┤
│        │                                     │  LIVE FEED    │
│ FLEET  │          FULL-SCREEN MAP            │  events...    │
│ O/HR   │     (MapLibre/Leaflet dark tiles)   │───────────────│
│ ETA    │                                     │ DISPATCH      │
│ SLA    │   ••• rider dots moving •••         │ INTEL (AI)    │
│        │   ~~~ route lines ~~~               │───────────────│
│[Legend]│   🟠 demand heat blobs              │ LAYERS        │
│        │                                     │  Traffic/Routes│
├────────┴─────────────────────────────────────┴───────────────┤
│     [Map Info] [Hubs] [SIMULATION progress]                  │
│        [Compass] [Scale]              [Mobile Speed]         │
└──────────────────────────────────────────────────────────────┘
```

#### UI Components to Recreate
1. **Top Bar** — Logo with orange glow, brand name, live status indicator, weather pill, SLA pill, speed controls (1x/2x/5x/10x + pause), total deliveries counter, operator avatar
2. **Left Metrics HUD** — Four floating glass cards: Active Fleet (with sparkline), Orders/Hr, Avg ETA (amber if >14m), SLA Health (green if >96%), Demand Legend toggle
3. **Right Event Feed** — Three stacked panels: Live Feed (scrollable events with severity icons), Dispatch Intel (AI suggestion card with APPLY/DISMISS), Layers (toggle pills for Traffic/Routes)
4. **Bottom HUD** — Map info pill, hub avatars (stacked circles), simulation progress bar
5. **Selected Rider HUD** — Floating card: avatar, status badge, order ID, 3-column stats (ETA/SPEED/PERF), route progress bar, action buttons (FOLLOW/REROUTE/CONTACT), connector line + glowing dot
6. **Compass & Scale** — Bottom-left compass "N" + 1km scale bar

#### Color Palette (exact values from Copy (3))
| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#070709` | Near-black base |
| Panel BG | `#0A0A0B` | Top bar, panels |
| Card BG | `#101012` | Metric cards |
| Accent | `#F58220` | **Checkstar orange** — buttons, highlights, glows |
| Text | `#ffffff` at 4-15% opacity | Borders, muted text |
| Glass | `backdrop-filter: blur(18px) saturate(1.2)` | All panels |

#### Typography
- **Inter** (weights 300-500) — all UI text
- **JetBrains Mono** — monospace for data values, IDs, timestamps

#### Glass Effect CSS
```css
.glass {
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
}
```

#### Animations
- `shimmer` — horizontal light sweep on hover cards
- `pulse-ring` — expanding ring for selected riders
- `float` — gentle vertical float for weather overlay

#### State Management Pattern
- **Refs** for high-frequency data (60fps simulation — skip renders)
- **React State** throttled at 150ms intervals for UI updates
- This is the correct pattern for real-time dashboards

---

### Copy (2) — Dark Map + Sounds + Routing (User's Preferred Map Style)

**Why the user likes this:** The CARTO `dark_all` tiles create the dark greyish look that matches Checkstar branding. The route animation, sounds, and A* pathfinding are production-quality.

**What to take from this project:**

#### Map Tile Configuration (the dark look)
```typescript
// Default dark style
'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'

// Cyber variant (no labels)
'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png'

// Satellite fallback
'server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
```

**Map settings:** Center `[-29.825, 31.00]` (Durban), Zoom 12.5, Min 10, Max 18

**Leaflet container background override:**
```css
.leaflet-container { background: #090B10 !important; }
```

#### Route Visualization (60fps Canvas overlay)
- Routes drawn on HTML5 Canvas (not SVG/Leaflet polylines) for performance
- **Unselected routes:** `rgba(245, 130, 32, 0.35)`, 2.5px width, 4px orange shadow
- **Selected route:** `rgba(245, 130, 32, 0.95)`, 4.5px width, 16px shadow + white core highlight
- **Animated flow dashes:** `[6, 12]` dash pattern at 24px/sec — "marching ants" showing direction

#### A* Graph Pathfinding
- ~50 real Durban road nodes (N2, N3, M4, M13, M19, Anton Lembede, Florida Rd, Umhlanga Rocks Dr, etc.)
- Haversine heuristic for A*
- OSRM fallback with 2-second timeout and in-memory cache
- Polyline interpolation at 35m density for smooth animation

#### Sound Effects (Web Audio API — procedural synthesis)
| Sound | Trigger | Waveform | Frequency |
|-------|---------|----------|-----------|
| **Blip** | Button clicks, toggles | sine | 880Hz → 1.5x ramp |
| **Dispatch Chime** | Order assigned, batch dispatch | sine | C5→E5→G5→C6 arpeggio |
| **Alert** | Severe weather, rush hour | triangle | 440Hz → 330Hz drop |
| **Sonar Ping** | Rider/hub selection, event click | sine | 1200Hz → 300Hz sweep |

**AudioContext** lazy-initialized on first user interaction. Supports mute toggle.

#### Full Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| `--checkstar-orange` | `#F58220` | Primary brand — buttons, badges, routes, glows |
| `--checkstar-orange-glow` | `rgba(245, 130, 32, 0.4)` | Orange glow shadows |
| `--checkstar-dark` | `#090B10` | Body background — near-black with blue undertone |
| `--checkstar-surface` | `#121620` | Panel/card background — dark navy-grey |
| `--checkstar-surface-trans` | `rgba(18, 22, 32, 0.85)` | Translucent glassmorphism |
| `--checkstar-border` | `rgba(255, 255, 255, 0.08)` | Subtle white border |
| Text primary | `#E2E8F0` | Body text — light slate |
| Orange hover | `#E06700` | Button hover states |
| Orange light | `#FED7AA` | Route core highlight |
| Emerald | `#34D399` | SLA compliance, success |
| Sky blue | `#38BDF8` | Cold chain, weather |
| Rose/red | `#F43F5E` | VIP, severe traffic, SLA breach |
| Amber | `#FBBF24` | Warning, clear weather |
| Teal | `#2DD4BF` | Cold storage |

#### Glassmorphism CSS
```css
.tactical-glass {
  background: rgba(13, 17, 26, 0.82);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
}
.tactical-glass-highlight {
  background: rgba(22, 28, 42, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(245, 130, 32, 0.15);
}
```

#### Custom Scrollbar
```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(245, 130, 32, 0.3);
  border-radius: 2px;
}
```

#### Keyboard Hotkeys
| Key | Action |
|-----|--------|
| Space | Pause/Play |
| 1-5 | Speed 1x/2x/5x/10x/20x |
| W | Weather modal |
| F | Fleet drawer |
| O | Auto-optimize |
| Esc | Close all |

#### Components to Recreate
1. **MapEngine** — Leaflet + Canvas overlay, 3 tile styles (dark/satellite/cyber)
2. **TopTelemetryBar** — Logo, simulation clock (SAST), speed controls, weather, KPIs, audio toggle
3. **DispatchRecommendHUD** — AI dispatch recommendations with execute button
4. **DriverHUD** — Rider telemetry, order manifest, grocery basket, actions
5. **HubHUD** — Hub stats, cold chain temps, outload velocity
6. **ZoneHUD** — Demand zone stats, SLA risk, surge deploy
7. **EventFeed** — Collapsible event log with category filters
8. **TacticalLayerControls** — Layer toggles, map theme switch, scenario injection
9. **FleetDrawer** — Full-height side drawer: searchable/filterable fleet roster
10. **WeatherModal** — Durban microclimate simulator (5 weather states)
11. **QuickHelpModal** — Hotkey guide + feature overview

#### Visual Effects
- **Demand heatmap pulses** — Radial gradient circles pulsing with `sin(timePulse * 2)`
- **Customer beacons** — Expanding ripple rings on active order destinations
- **Hub pulse rings** — Concentric rings with star icons
- **Rider directional markers** — Rotated triangular arrows with heading, glow, callsign badges
- **Weather particles** — 180 rain particles with wind-slanted movement
- **Lightning flash** — Random 0.5% chance per frame during storms
- **Vignette + film grain** — Radial gradient + SVG fractalNoise at 1.5% opacity

---

### Copy (1) — Best UI Controls (Crashes on Start)

**Why it crashes:** Likely `maplibre-gl` WebGL failure in headless/test environment + potential `vite-plugin-singlefile` + Vite 7.3 compatibility issues.

**What to take from this project:**

#### UI Control Patterns
1. **TopBar** — Glass-morphism pill with version badge "v2.6", green online dot, animated tab switcher with `layoutId` spring animation (Live/Demand/Flow/Analytics), five `MiniStat` widgets
2. **ControlPanel** — Bottom-center docked panel with:
   - Reset (RotateCcw), Halve speed, **Play/Pause** (big white, `whileTap={{ scale: 0.92 }}`), Double speed
   - Speed buttons: 1x/2x/5x/10x/60x
   - Layer toggles (6) with colored dots + glow shadows when active
3. **Sidebar** — Four tabs (Fleet/Orders/Events/Analytics) with `layoutId` animated background
   - **FleetTab:** Search input, filter (all/active/idle), scrollable rider cards
   - **OrdersTab:** 3-stat grid (Pending/Active/Delivered), order list
   - **EventsTab:** Timeline feed with staggered entry animations
   - **AnalyticsTab:** KPI rows with sparkline SVGs, financials, demand/supply chart
4. **DriverInspector** — Slide-in panel from right with spring animation (`stiffness: 300, damping: 30`), gradient header, 2x2 stat grid, active order details
5. **BootSequence** — Cinematic boot animation (2.8s) with staged text reveals and progress bar

#### State Management
- **Single Zustand store** with slices: Entities, Time, Weather, Metrics, UI
- 16 actions including `tick(dtMs)` for simulation, `selectDriver`, `selectOrder`, `toggleLayer`
- **Deterministic RNG** (seed=1337) for reproducible simulations
- **Metrics history** (last 120 snapshots) for sparkline charts

#### Unique UX Patterns
1. **`pointer-events-none` containers** with `pointer-events-auto` children — allows map clicks through UI panels
2. **Framer Motion `layoutId`** for tab background indicators that slide between tabs
3. **Spring-based panel entry** — `stiffness: 300, damping: 30`
4. **Live FPS counter** — Real-time frame rate with color thresholds
5. **Sparkline SVG charts** — Hand-built inline SVG with gradient fills (no D3)
6. **Layer toggle with glow** — Active layers show colored dots with CSS `box-shadow`

---

## Part 3: Implementation Recommendations

### What to Build (Prioritized)

#### Priority 1: Dark Map Theme for Frontend Web App
Replace the current Leaflet map tiles with CARTO `dark_all` tiles. This is a 5-minute change that immediately matches the brand.

**Files to modify:**
- `frontend/src/app/(public)/stores/StoresClient.tsx` — Change tile URL
- `frontend/src/app/(public)/stores/[slug]/StoreDetailClient.tsx` — Change tile URL
- Add dark-themed CSS overrides for Leaflet controls

#### Priority 2: Rider Operations Dashboard (Web)
Build a new web page for Store Owners / Logistics Officers to monitor riders and deliveries. Take the layout from Copy (3), the map style from Copy (2), and the controls from Copy (1).

**Tech stack:**
- Next.js (existing frontend)
- Leaflet + react-leaflet (already installed)
- Zustand (already installed)
- Framer Motion (already installed)
- Tailwind CSS (already installed)
- Web Audio API for sounds (no library needed)

**Components to build:**
1. `RiderDashboard` — Main page with full-screen map + overlay panels
2. `DashboardTopBar` — Logo, clock, speed controls, weather, KPIs
3. `MetricsPanel` — Left floating glass cards (Fleet, Orders/Hr, ETA, SLA)
4. `EventFeed` — Right panel with live events, dispatch intel
5. `RiderInspector` — Click-to-select rider detail panel
6. `LayerControls` — Toggle traffic/routes/demand overlays
7. `SoundManager` — Web Audio API procedural sounds

#### Priority 3: Route Animation on Mobile
Take the animated flow dashes from Copy (2) and implement them on the mobile RouteMap. The current mobile map has static polylines — add the "marching ants" effect.

**Files to modify:**
- `mobile/src/components/shared/RouteMap.tsx` — Add animated polyline
- Use `react-native-maps` Polyline with `strokeColor` animation or `react-native-svg` for dashed lines

#### Priority 4: Map Fullscreen Toggle
Add a button to toggle the map between fullscreen and compact views, as requested.

**Files to create/modify:**
- `frontend/src/components/MapContainer.tsx` — Wrapper with fullscreen toggle
- Button overlay on the map (subtle, glass-morphism style)

### What NOT to Build
- **Simulation engine** — The mockups have 32-48 simulated riders. The real system has actual riders with GPS. Don't simulate what you can track.
- **Canvas overlay rendering** — The mockups use Canvas for 60fps performance. The real dashboard won't have 48 riders moving simultaneously. Leaflet layers are fine.
- **A* graph pathfinding** — The backend already has OSRM. Don't reimplement routing in the frontend.
- **Weather system** — Fun in the mockup, not needed for v1 of the real system.
- **Boot sequence** — Cool UX, low priority.

### Map Fullscreen Toggle Design
```
┌─────────────────────────────────────┐
│                     [⤢] ← subtle button │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      MAP (compact)          │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│  [Metrics] [Events] [Controls]      │
└─────────────────────────────────────┘

         ↓ click [⤢] ↓

┌─────────────────────────────────────┐
│ MAP (fullscreen)        [⤢] ← same button │
│                                     │
│  [Metrics overlay] [Events overlay] │
│  [Controls overlay]                 │
└─────────────────────────────────────┘
```

The button should be a glass-morphism pill floating on the map edge, with a fullscreen/exit icon. The transition should use Framer Motion `layoutId` for smooth animation.

---

## Part 4: Summary of Reusable Assets

| Asset | Source | Where to Use |
|-------|--------|-------------|
| CARTO `dark_all` tiles | Copy (2) | Frontend web app, Rider dashboard |
| Glass-morphism CSS | Copy (2) + (3) | All dashboard panels |
| Orange glow accents | Copy (3) | Buttons, badges, highlights |
| Inter + JetBrains Mono fonts | Copy (3) | Dashboard typography |
| Animated flow dashes | Copy (2) | Mobile RouteMap, web dashboard |
| Procedural sound effects | Copy (2) | Rider dashboard (optional) |
| A* routing with Durban nodes | Copy (2) | Already have OSRM — keep as fallback reference |
| Zustand + throttled state | Copy (1) | Rider dashboard state management |
| LayoutId tab animations | Copy (1) | Dashboard tab switching |
| Sparkline SVG charts | Copy (1) | Analytics panel |
| Pointer-events passthrough | Copy (1) | All map + overlay panels |
| Boot sequence | Copy (1) | Optional — low priority |
| Speed controls | Copy (3) | Simulation/playback if needed |
| Dispatch Intel AI card | Copy (3) | Rider assignment suggestions |
| Layer toggles with glow | Copy (1) + (2) | Map overlay controls |
| Keyboard hotkeys | Copy (2) | Desktop dashboard power users |
| Canvas 60fps rendering | Copy (2) | Only if >20 concurrent riders need tracking |
| Demand heatmap | Copy (2) + (3) | Store-level demand visualization |
| Hub pulse rings | Copy (2) | Store markers on dashboard |
| Rider direction markers | Copy (2) | Rider position indicators |
