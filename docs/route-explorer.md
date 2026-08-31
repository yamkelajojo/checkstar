# Route Explorer — Immersive Hybrid 2D+3D Route Screen (P3)

## Objective
A new standalone immersive screen (`RouteExplorerScreen`) navigable from `CheckoutScreen` (post-order confirmation) and `RiderOrderDetailScreen`. It presents the delivery route using a hybrid 2D+3D visual: D3 interactive SVG for the route path, Three.js 3D perspective overlay for depth/context, with auto-animated polyline drawing powered by `animejs` and `motion`.

## Design Philosophy (from PHASE1_REPORT.md & CONTEXT.md)
- **Clarity**: Route path clearly shown with store/delivery markers, distance/duration metrics
- **Tactile respect**: Motion confirms touch; reduced motion respected (`useReducedMotion`)
- **Deep user benefit**: Transparency builds trust in delivery estimates
- **No broken dependencies**: `react-native-maps` remains removed; pure custom components using `.opensrc` libraries

## Libraries (from `.opensrc` sources)
- `d3` (v7.9.0): Interactive SVG route drawing, hover markers, animated polylines
- `three` (v0.135.0): 3D perspective overlay (optional depth layer)
- `motion` (v2.2.1): Spring animations for entrance/exit
- `animejs` (v4.4.1): Keyframe animations for route progress indicator
- `swiper` (v12.2.0): Swipeable multi-stop cards if multi-waypoint routes added later
- `osrm` (v5.26.0): Source/docs for routing integration reference

## Data Source
- Existing older `.osrm`: `south-africa-260523.osrm` (Durban region, preprocessed)
- Python server: `osrm-durban-server.py` (port 5001) — updated with `.osrm` reference and `geometry` response
- Endpoint: `GET /route/v1/driving/{lng},{lat};{lng},{lat}?geometries=polyline`

## Component Architecture

### RouteExplorerScreen
- Receives `routeProps`: `storeName`, `storeLat/storeLng`, `deliveryAddress`, `deliveryLat/deliveryLng`, `distanceKm`, `durationMinutes`, `geometry` (polyline string from OSRM)
- Renders `RouteExplorerHeader` (navigation back, title, source badge)
- Renders `D3RouteLayer` (SVG with interactive markers, animated polyline)
- Renders `ThreeOverlay` (optional 3D perspective — lightweight, no full map dependency)
- Renders `RouteMetricsCard` (distance, duration, source label — `Live OSRM routing` when `source === 'osrm'`)
- Renders `RouteProgressIndicator` (animated progress bar using `animejs`)

### Navigation Integration
- Added to `RootNavigator` / `CustomerTabs` navigation config
- Accessible from: `CheckoutScreen` (after successful `placeOrder` with `dispatch` outcome) and `RiderOrderDetailScreen` (via navigation params)

### Design Token Exceptions
- `RouteExplorer` uses `brand.orange` (store pin) and `brand.success` (delivery pin / route line) as documented brand accent exceptions
- All surface/text/spacing uses `theme.colors`, `semanticSpacing`, `textStyle` consistently

## Accessibility
- `accessibilityRole="image"` on SVG route layer
- `accessibilityLabel` describing route metrics (`"Delivery route: 1.47 km, 9 minutes, Live OSRM routing"`)
- `accessibilityHint` on interactive markers (`"Store marker: Checkstar Umgeni"`, `"Delivery marker"`)
- `reducedMotion` supported (`useReducedMotion` hook disables animation)

## Testing (STLC / V-Model)
- Verification: `mobile/src/features/route-explorer/__tests__/RouteExplorerScreen.test.tsx`
- Integration: `rider-routemap-integration.test.tsx` extended to verify navigator params
- End-to-end: `rider-full-flow-e2e.test.tsx` covers full delivery flow with route exploration

## Deferred / Not in Scope
- Full `react-native-maps` polyline rendering (package broken — deferred)
- `.shp` → `.osrm` conversion (optional enhancement — existing `.osrm` sufficient)
- Multi-stop route optimization (future — single store/delivery pair per Checkstar architecture)
- Real-time GPS tracking during delivery (future sprint)

## Implementation Order (Tracer Bullet)
1. Create `docs/route-explorer.md` (this file) ✅
2. Create `mobile/src/features/route-explorer/RouteExplorerScreen.tsx`
3. Create `mobile/src/features/route-explorer/__tests__/RouteExplorerScreen.test.tsx`
4. Update navigation config (`RootNavigator` / navigation types)
5. Integrate with `CheckoutScreen` (navigation after order placement) and `RiderOrderDetailScreen`
6. Verify `RouteExplorer` consumes `geometry` prop and renders D3 SVG layer properly
7. Verify `ThreeOverlay` renders without errors on Expo SDK 54.0.0
8. Confirm `RouteProgressIndicator` uses `animejs` for smooth progress animation
9. Confirm `useReducedMotion` disables animations when user preference active
