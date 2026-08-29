# Rider Operations Dashboard — Ticket Plan

**Date:** 2026-08-29
**Methodology:** TDD + V-Model + STLC
**Status:** Plan complete, awaiting implementation

---

## Methodology

### TDD (Test-Driven Development)
Every ticket follows Red → Green → Refactor:
1. **Red** — Write a failing test that defines the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up while keeping tests green

### V-Model (Verification & Validation)
Each development phase maps to a testing phase:

| Development Phase | Verification Phase |
|-------------------|-------------------|
| Requirements (this doc) | Acceptance Testing |
| System Design (architecture) | System Testing |
| Module Design (components) | Integration Testing |
| Coding (implementation) | Unit Testing |

### STLC (Software Testing Life Cycle)
Each ticket progresses through:
1. **Requirement Analysis** — What to build, what could go wrong
2. **Test Planning** — Test strategy, edge cases, bug scenarios
3. **Test Development** — Write tests before code
4. **Test Execution** — Run tests, verify pass
5. **Test Reporting** — Document results
6. **Test Closure** — Confirm all criteria met

---

## Risk Register

Before diving into tickets, here are the critical risks and failure modes I've identified:

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | **Race condition in dispatch** — two operators assign the same rider simultaneously | High | Database-level locking (`FOR UPDATE SKIP LOCKED`), already exists in `OrderClaim` |
| R2 | **Stale GPS data** — rider location is old, ETA calculation is wrong | Medium | Check `rider_locations.recorded_at` freshness, reject if >60s old |
| R3 | **OSRM unavailability** — routing service is down, ETA fails | Medium | Fallback to straight-line distance / estimated speed |
| R4 | **Map performance** — too many markers slow Leaflet | Medium | Marker clustering, virtual rendering, limit to visible riders |
| R5 | **Polling load** — dashboard polling every 5s causes DB pressure | Medium | Adaptive polling (faster when active, slower when idle), index optimization |
| R6 | **Role bypass** — UI hides tabs but API doesn't validate | High | Every API endpoint validates role server-side, not just UI |
| R7 | **User tracking PII** — tracking events contain personal data | Medium | Anonymize search queries, don't store PII in metadata |
| R8 | **Browser autoplay policy** — dispatch chime blocked | Low | Lazy-init AudioContext on first user interaction |
| R9 | **Seeded data unrealistic** — charts look wrong | Medium | Use real product IDs, realistic time-of-day distributions, South African prices (ZAR) |
| R10 | **Chart.js responsive** — charts break on different screen sizes | Low | Use Chart.js responsive option, test at multiple breakpoints |
| R11 | **ETA drift** — OSRM ETA differs significantly from reality | Medium | Log actual vs predicted, flag large deviations for future model tuning |
| R12 | **Event feed race** — events lost between polls | Low | Use `created_at` cursor-based pagination, not offset |
| R13 | **Fullscreen toggle z-index** — map controls hidden behind panels | Low | Use consistent z-index scale, test layering |
| R14 | **Sound memory leak** — AudioContext not cleaned up | Low | Single global AudioContext, proper disposal |
| R15 | **Role hierarchy confusion** — store_owner vs logistics_officer scope | Medium | Document role permissions clearly, test each role |

---

## Ticket List

### Ticket 1: Documentation Cleanup

**Type:** AFK
**Blocked by:** None
**V-Model Level:** Requirements (this doc itself)

#### What to Build
Delete 10 unnecessary documentation files that are completed retrospectives, auto-generated outputs, or tracking artifacts. The decisions and knowledge from these files are already captured in CONTEXT.md, ADRs, and SHARED_UNDERSTANDING.md.

#### Files to Delete
1. `docs/PHASE1_REPORT.md`
2. `docs/AUDIT_REPORT.md`
3. `docs/grilling/mobile-ui-overhaul.md`
4. `docs/SMART_TRACKING_ANALYSIS.md`
5. `graphify-out/GRAPH_REPORT.md`
6. `graphify-out/graph.html`
7. `graphify-out/graph.json`
8. `graphify-out/manifest.json`
9. `graphify-out/cost.json`
10. `graphify-out/cache/` (entire directory)

#### Acceptance Criteria
- [ ] All 10 files/directories deleted
- [ ] No broken imports or references in remaining code
- [ ] `npm run lint` passes (no references to deleted files)
- [ ] Git diff shows only deletions, no modifications to kept files

#### TDD Approach
- **Test:** Grep codebase for references to deleted filenames. Expect zero matches.
- **Verify:** Run linter after deletion.

#### Bug Risks
- Risk: A file in `docs/` might be imported or referenced elsewhere
- Mitigation: Grep before deleting, verify no references

---

### Ticket 2: Dark Map Theme + Shared MapContainer

**Type:** AFK
**Blocked by:** None
**V-Model Level:** System Design → System Testing

#### What to Build
Swap Leaflet tiles from default OpenStreetMap to CARTO `dark_all` across the existing frontend web app. Create a shared `MapContainer` React component that encapsulates Leaflet setup with dark theme, glass-morphism controls, and configurable props (center, zoom, markers, routes). Apply dark glass-morphism CSS to all map controls (zoom buttons, attribution, layer controls).

#### Schema Changes
None — this is purely UI.

#### API Changes
None — this is purely UI.

#### Components
- `frontend/src/components/MapContainer.tsx` — Reusable Leaflet wrapper
- `frontend/src/components/MapContainer.css` — Dark theme overrides

#### Files to Modify
- `frontend/src/app/(public)/stores/StoresClient.tsx` — Use MapContainer
- `frontend/src/app/(public)/stores/[slug]/StoreDetailClient.tsx` — Use MapContainer

#### Map Configuration
```
Tiles: https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png
Center: [-29.825, 31.00] (Durban)
Zoom: 12.5, Min: 10, Max: 18
Container background: #090B10
```

#### CSS Values
```css
.leaflet-container { background: #090B10 !important; }
.MapControls {
  background: rgba(13, 17, 26, 0.82);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #E2E8F0;
}
```

#### Acceptance Criteria
- [ ] MapContainer component renders with dark tiles
- [ ] Dark glass-morphism applied to zoom controls
- [ ] Existing store locator uses MapContainer
- [ ] Existing store detail uses MapContainer
- [ ] Component accepts props: center, zoom, markers, routes, className
- [ ] Responsive: works on mobile and desktop
- [ ] No console errors

#### TDD Approach
- **Unit Test:** MapContainer renders with correct tile URL
- **Unit Test:** MapContainer applies dark theme CSS class
- **Integration Test:** StoresClient renders MapContainer with correct center
- **Visual Test:** Screenshot comparison at desktop and mobile breakpoints

#### Bug Risks
- Risk: CARTO CDN blocked or slow → tiles don't load
- Mitigation: Add fallback to OpenStreetMap tiles if dark tiles fail
- Risk: `backdrop-filter` not supported in older browsers
- Mitigation: Use `@supports` query, fallback to solid background
- Risk: Leaflet CSS conflicts with existing styles
- Mitigation: Scope all overrides under `.leaflet-container`

---

### Ticket 3: Dashboard Skeleton + Metrics HUD

**Type:** AFK
**Blocked by:** Ticket 2 (needs MapContainer)
**V-Model Level:** System Design → System Testing

#### What to Build
Create the rider operations dashboard page at `(dashboard)/operations/`. The page is map-centric with a full-screen MapContainer and floating glass-morphism panels. Left HUD shows key metrics (Active Fleet, Orders/Hr, Active Deliveries). Right panel is a placeholder for the event feed (built in Ticket 6).

#### Schema Changes
None — uses existing tables.

#### API Endpoints
```
GET /api/operations/metrics
Response: {
  active_riders: number,
  total_riders: number,
  orders_this_hour: number,
  pending_orders: number,
  active_deliveries: number,
  delivered_today: number
}
```

#### Backend
- `app/Http/Controllers/OperationsController.php` — metrics endpoint
- `app/Services/MetricsService.php` — aggregate queries

#### Frontend
- `frontend/src/app/(dashboard)/operations/page.tsx` — Dashboard page
- `frontend/src/components/operations/MetricsHud.tsx` — Left floating metrics
- `frontend/src/components/operations/EventFeedPlaceholder.tsx` — Right panel placeholder

#### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] CHECKSTAR OPS                              [Avatar]  │
├────────┬─────────────────────────────────────┬───────────────┤
│        │                                     │               │
│ METRICS│          FULL-SCREEN MAP            │  EVENT FEED   │
│ HUD    │     (MapContainer dark tiles)       │  (placeholder)│
│        │                                     │               │
│ O/HR   │                                     │               │
│ ETA    │                                     │               │
│ ACTIVE │                                     │               │
│        │                                     │               │
├────────┴─────────────────────────────────────┴───────────────┤
└──────────────────────────────────────────────────────────────┘
```

#### Acceptance Criteria
- [ ] `/operations` route renders dashboard page
- [ ] MapContainer fills viewport
- [ ] MetricsHUD shows 4 cards: Active Fleet, Orders/Hr, Pending, Active Deliveries
- [ ] MetricsHUD uses glass-morphism styling
- [ ] Event feed placeholder visible on right
- [ ] Backend returns valid metrics JSON
- [ ] Page requires authentication
- [ ] Responsive: panels collapse on mobile

#### TDD Approach
- **Unit Test:** MetricsHud renders with correct data
- **Unit Test:** MetricsHud applies glass-morphism class
- **Integration Test:** Dashboard page renders MapContainer + MetricsHud
- **API Test:** `/api/operations/metrics` returns expected shape
- **E2E Test:** Navigate to `/operations`, verify map and metrics visible

#### Bug Risks
- Risk: Metrics query is slow (full table scan)
- Mitigation: Add indexes on `orders.status`, `orders.created_at`, `riders.is_available`
- Risk: Panel overlaps map on small screens
- Mitigation: Use CSS media queries, collapse panels to icons on mobile
- Risk: Unauthenticated access to `/operations`
- Mitigation: Route guard checks auth, API validates session

---

### Ticket 4: ETA System

**Type:** AFK
**Blocked by:** Ticket 2 (needs MapContainer for rider markers)
**V-Model Level:** Module Design → Integration Testing

#### What to Build
Calculate estimated delivery time (ETA) for each active order using OSRM routing. Store ETA on the order record. Recalculate when rider moves >200m from last calculation point. Display ETA on rider map marker tooltip.

#### Schema Changes
```sql
ALTER TABLE orders ADD COLUMN eta_seconds INTEGER NULL;
ALTER TABLE orders ADD COLUMN eta_updated_at TIMESTAMP NULL;
```

#### API Endpoints
```
POST /api/operations/eta/calculate
Body: { order_id: number }
Response: { eta_seconds: number, calculated_at: timestamp }

POST /api/operations/eta/recalculate-stale
(Internal: finds orders where rider moved >200m, recalculates)
```

#### Backend
- `app/Services/EtaCalculationService.php` — OSRM routing, distance calculation
- `app/Http/Controllers/OperationsController.php` — eta/calculate endpoint
- `app/Jobs/RecalculateStaleEtas.php` — Queue job for batch recalculation

#### Haversine Distance Formula
```javascript
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

#### Acceptance Criteria
- [ ] `orders` table has `eta_seconds` and `eta_updated_at` columns
- [ ] ETA calculation returns seconds from OSRM route
- [ ] ETA stored on order at dispatch time
- [ ] ETA recalculates when rider moves >200m
- [ ] ETA displays on rider map marker tooltip
- [ ] Fallback to straight-line distance if OSRM unavailable
- [ ] Stale GPS (>60s old) returns error, not wrong ETA
- [ ] Unit tests for Haversine distance calculation
- [ ] Unit tests for ETA calculation service
- [ ] Integration test: dispatch triggers ETA calculation

#### TDD Approach
- **Unit Test:** `haversineDistance` returns correct meters for known coordinates
- **Unit Test:** `EtaCalculationService.calculate()` calls OSRM and returns seconds
- **Unit Test:** `EtaCalculationService` falls back to straight-line when OSRM fails
- **Unit Test:** `EtaCalculationService` rejects stale GPS data
- **Integration Test:** Dispatching order sets `eta_seconds` on order
- **Integration Test:** Rider movement >200m triggers recalculation

#### Bug Risks
- Risk: OSRM returns 0 duration for same start/end
- Mitigation: Validate duration > 0, return minimum 60s
- Risk: Rider location is null (no GPS yet)
- Mitigation: Check rider_locations exists before calculation
- Risk: OSRM timeout causes slow response
- Mitigation: 2-second timeout, fallback to straight-line
- Risk: Multiple recalculations for same rider simultaneously
- Mitigation: Mutex lock per order_id during recalculation

---

### Ticket 5: Dispatch Suggestion Panel

**Type:** AFK
**Blocked by:** Ticket 4 (needs ETA data, rider locations)
**V-Model Level:** Module Design → Integration Testing

#### What to Build
When an operator clicks a pending order, show a slide-in panel from the right with the nearest available rider, their ETA to the order, and a one-click ASSIGN button. Backend calculates nearest rider using rider_locations + availability.

#### Schema Changes
None — uses existing tables.

#### API Endpoints
```
GET /api/operations/dispatch-suggestion/:orderId
Response: {
  order: { id, customer_name, items_count, total_amount },
  nearest_rider: { id, name, distance_meters, eta_seconds, current_location },
  alternative_riders: [{ id, name, distance_meters, eta_seconds }]
}

POST /api/operations/assign-rider
Body: { order_id: number, rider_id: number }
Response: { success: boolean, order: { id, rider_id, status } }
```

#### Backend
- `app/Services/DispatchSuggestionService.php` — nearest rider calculation
- `app/Http/Controllers/OperationsController.php` — dispatch-suggestion, assign-rider endpoints

#### Frontend
- `frontend/src/components/operations/DispatchPanel.tsx` — Slide-in panel
- `frontend/src/components/operations/DispatchPanel.css` — Glass-morphism + spring animation

#### Animation
```css
.DispatchPanel {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 380px;
  background: rgba(13, 17, 26, 0.9);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(245, 130, 32, 0.15);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.DispatchPanel.open { transform: translateX(0); }
```

#### Acceptance Criteria
- [ ] Clicking pending order opens dispatch panel
- [ ] Panel shows nearest available rider with distance and ETA
- [ ] Panel shows alternative riders (up to 3)
- [ ] ASSIGN button assigns rider to order
- [ ] After assignment, order status changes to confirmed
- [ ] Panel closes after successful assignment
- [ ] Race condition: concurrent assignments handled (FOR UPDATE SKIP LOCKED)
- [ ] Panel animates in/out with spring transition
- [ ] Unit test: nearest rider calculation
- [ ] Integration test: full assign flow

#### TDD Approach
- **Unit Test:** `DispatchSuggestionService` returns nearest rider by distance
- **Unit Test:** `DispatchSuggestionService` excludes unavailable riders
- **Unit Test:** `DispatchSuggestionService` excludes riders with insufficient radius
- **Integration Test:** Assign rider updates order.rider_id and order.status
- **Integration Test:** Concurrent assignment attempt — one succeeds, one fails gracefully

#### Bug Risks
- Risk: Two operators assign same rider simultaneously
- Mitigation: Use `FOR UPDATE SKIP LOCKED` on rider row, atomic claim
- Risk: Rider becomes unavailable between suggestion and assignment
- Mitigation: Re-check availability at assignment time
- Risk: Panel shows stale rider location
- Mitigation: Refresh rider location when panel opens
- Risk: Assignment fails silently
- Mitigation: Show error toast, retry option

---

### Ticket 6: Event Feed

**Type:** AFK
**Blocked by:** Ticket 3 (needs dashboard layout)
**V-Model Level:** Module Design → Integration Testing

#### What to Build
Right-side panel showing live events: order state changes, rider availability toggles, dispatch attempts. Events are polled from the backend, displayed with severity icons and timestamps.

#### Schema Changes
None — uses existing tables (orders, riders, rider_locations).

#### API Endpoints
```
GET /api/operations/events?cursor=<timestamp>&limit=50
Response: {
  events: [{
    id: number,
    type: 'order_state_change' | 'rider_availability' | 'dispatch_attempt',
    severity: 'info' | 'warning' | 'success' | 'error',
    message: string,
    entity_type: string,
    entity_id: number,
    metadata: object,
    created_at: timestamp
  }],
  next_cursor: timestamp | null
}
```

#### Backend
- `app/Services/EventFeedService.php` — aggregates events from multiple tables
- `app/Http/Controllers/OperationsController.php` — events endpoint

#### Frontend
- `frontend/src/components/operations/EventFeed.tsx` — Event list component
- `frontend/src/components/operations/EventItem.tsx` — Single event row

#### Event Types
| Type | Source | Severity | Example Message |
|------|--------|----------|-----------------|
| `order_state_change` | orders.status | info/success | "Order #1234 confirmed" |
| `rider_availability` | riders.is_available | info | "Rider KZN-04 went available" |
| `dispatch_attempt` | orders.dispatch_attempts | success/warning | "Rider KZN-07 assigned to Order #1234" |
| `dispatch_failed` | orders.dispatch_attempts | error | "No riders available for Order #1234" |

#### Acceptance Criteria
- [ ] Event feed displays on right side of dashboard
- [ ] Events show severity icon (colored dot or emoji)
- [ ] Events show timestamp relative to now ("2m ago")
- [ ] Events are scrollable
- [ ] Events use cursor-based pagination (no offset)
- [ ] Polling interval: 5 seconds
- [ ] New events appear at top with subtle animation
- [ ] Unit test: event aggregation from orders table
- [ ] Unit test: event aggregation from riders table
- [ ] Integration test: event feed returns correct shape

#### TDD Approach
- **Unit Test:** `EventFeedService` returns order state change events
- **Unit Test:** `EventFeedService` returns rider availability events
- **Unit Test:** `EventFeedService` respects cursor pagination
- **Integration Test:** Creating an order produces an event
- **Integration Test:** Changing rider availability produces an event

#### Bug Risks
- Risk: Event feed causes N+1 queries
- Mitigation: Single query with UNION across event sources
- Risk: Events lost between polls
- Mitigation: Cursor-based pagination, never skip events
- Risk: Old events accumulate in memory
- Mitigation: Limit to last 200 events in frontend, backend returns max 50 per page
- Risk: Relative timestamp ("2m ago") doesn't update
- Mitigation: Use `Intl.RelativeTimeFormat`, update every minute

---

### Ticket 7: Audit Logging

**Type:** AFK
**Blocked by:** None
**V-Model Level:** Module Design → Integration Testing

#### What to Build
Create `audit_logs` table and middleware that logs order lifecycle changes, rider actions, and operator actions. Every significant action is recorded with who did what, when, and metadata.

#### Schema Changes
```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_audit_entity (entity_type, entity_id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_created (created_at)
);
```

#### Backend
- `app/Models/AuditLog.php` — Eloquent model
- `app/Services/AuditService.php` — logging service
- `app/Http/Middleware/AuditMiddleware.php` — request logging
- `database/migrations/xxxx_create_audit_logs_table.php` — migration

#### Logged Actions
| Entity | Action | Who |
|--------|--------|-----|
| Order | confirmed, dispatched, picked_up, delivered, cancelled | System/Rider/Operator |
| Rider | available, unavailable, break_start, break_end | Rider |
| Operator | manual_dispatch, view_order, export_data | Store Owner/Manager/Logistics |

#### Acceptance Criteria
- [ ] `audit_logs` table exists with correct schema
- [ ] Order state changes produce audit log entries
- [ ] Rider availability changes produce audit log entries
- [ ] Operator actions produce audit log entries
- [ ] Each entry has user_id, action, entity_type, entity_id, metadata, created_at
- [ ] Queryable by entity (get all logs for Order #1234)
- [ ] Queryable by user (get all actions by User #5)
- [ ] Queryable by time range
- [ ] Unit test: AuditService.log() creates record
- [ ] Integration test: order state change produces audit entry

#### TDD Approach
- **Unit Test:** `AuditService.log()` creates audit_logs record
- **Unit Test:** `AuditService.log()` stores metadata as JSON
- **Integration Test:** Confirming order creates audit log with action='confirmed'
- **Integration Test:** Rider going available creates audit log
- **Performance Test:** Audit logging adds <10ms to request

#### Bug Risks
- Risk: Audit logging slows down requests
- Mitigation: Async logging (queue job), don't block response
- Risk: Audit log table grows unbounded
- Mitigation: Plan for archival policy (keep 90 days, archive older)
- Risk: user_id is null for system actions
- Mitigation: Use a system user ID (e.g., user_id=0) for automated actions
- Risk: Metadata JSON is too large
- Mitigation: Limit metadata to 1KB, truncate if needed

---

### Ticket 8: User Tracking API

**Type:** AFK
**Blocked by:** None
**V-Model Level:** Module Design → Integration Testing

#### What to Build
Create `user_tracking_events` table and API endpoint to receive customer behavior events: product views, search queries, cart additions, cart removals, checkouts. This is the data pipeline for analytics.

#### Schema Changes
```sql
CREATE TABLE user_tracking_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    event_type ENUM('product_view', 'search', 'add_to_cart', 'remove_from_cart', 'checkout') NOT NULL,
    product_id BIGINT NULL,
    search_query VARCHAR(255) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_tracking_customer (customer_id),
    INDEX idx_tracking_event_type (event_type),
    INDEX idx_tracking_created (created_at),
    INDEX idx_tracking_product (product_id)
);
```

#### API Endpoints
```
POST /api/tracking/events
Body: {
  event_type: 'product_view' | 'search' | 'add_to_cart' | 'remove_from_cart' | 'checkout',
  product_id?: number,
  search_query?: string,
  metadata?: object
}
Response: { success: true }

POST /api/tracking/events/batch
Body: { events: [{ event_type, product_id?, search_query?, metadata? }] }
Response: { success: true, stored: number }
```

#### Backend
- `app/Models/UserTrackingEvent.php` — Eloquent model
- `app/Services/TrackingService.php` — event storage
- `app/Http/Controllers/TrackingController.php` — API endpoints
- `database/migrations/xxxx_create_user_tracking_events_table.php` — migration

#### Acceptance Criteria
- [ ] `user_tracking_events` table exists with correct schema
- [ ] Single event endpoint stores event
- [ ] Batch endpoint stores multiple events in one request
- [ ] Validates event_type enum
- [ ] product_id validated against products table (optional)
- [ ] search_query truncated to 255 chars
- [ ] PII not stored in metadata (enforced in validation)
- [ ] Rate limiting: max 100 events per customer per minute
- [ ] Unit test: TrackingService stores event
- [ ] Unit test: TrackingService validates event_type
- [ ] Integration test: POST /api/tracking/events creates record
- [ ] Integration test: batch endpoint stores multiple events

#### TDD Approach
- **Unit Test:** `TrackingService.store()` creates user_tracking_events record
- **Unit Test:** `TrackingService.store()` rejects invalid event_type
- **Unit Test:** `TrackingService.storeBatch()` stores all events atomically
- **Integration Test:** POST /api/tracking/events returns 200 and creates record
- **Integration Test:** POST /api/tracking/events with invalid event_type returns 422
- **Security Test:** metadata field rejects PII patterns (email, phone regex)

#### Bug Risks
- Risk: Customers send too many events, DB overload
- Mitigation: Rate limiting per customer_id
- Risk: PII leaked in metadata or search_query
- Mitigation: Validation regex for email/phone, strip before storage
- Risk: product_id references deleted product
- Mitigation: Foreign key nullable, log warning but don't reject
- Risk: Batch endpoint used for DDoS
- Mitigation: Limit batch size to 50 events

---

### Ticket 9: Analytics Page + Charts

**Type:** AFK
**Blocked by:** Ticket 8 (needs user tracking data)
**V-Model Level:** System Design → System Testing

#### What to Build
Create analytics page at `/operations/analytics` with Chart.js visualizations: revenue over time, orders by hour, top products, rider utilization. Summary KPIs on the main dashboard link to this page.

#### Schema Changes
None — uses existing tables + Ticket 8 tracking data.

#### API Endpoints
```
GET /api/operations/analytics/sales?period=7d|30d|90d
Response: {
  revenue_over_time: [{ date: string, revenue: number }],
  orders_by_hour: [{ hour: number, count: number }],
  total_revenue: number,
  total_orders: number,
  avg_order_value: number
}

GET /api/operations/analytics/products?limit=10
Response: {
  top_products: [{ id, name, view_count, cart_count, order_count, conversion_rate }],
  search_queries: [{ query, count }]
}

GET /api/operations/analytics/riders?period=7d|30d
Response: {
  rider_utilization: [{ rider_id, name, delivery_count, avg_delivery_time, total_distance }],
  fleet_summary: { active_riders, avg_utilization_rate }
}
```

#### Backend
- `app/Services/AnalyticsService.php` — aggregation queries
- `app/Http/Controllers/OperationsController.php` — analytics endpoints

#### Frontend
- `frontend/src/app/(dashboard)/operations/analytics/page.tsx` — Analytics page
- `frontend/src/components/operations/charts/RevenueChart.tsx` — Line chart
- `frontend/src/components/operations/charts/OrdersByHourChart.tsx` — Bar chart
- `frontend/src/components/operations/charts/TopProductsChart.tsx` — Horizontal bar
- `frontend/src/components/operations/charts/RiderUtilizationChart.tsx` — Bar chart

#### Chart.js Configuration
```javascript
// Revenue line chart
{
  type: 'line',
  data: { labels: dates, datasets: [{ label: 'Revenue (ZAR)', data: revenues }] },
  options: {
    responsive: true,
    plugins: { legend: { labels: { color: '#E2E8F0' } } },
    scales: {
      x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  }
}
```

#### Acceptance Criteria
- [ ] `/operations/analytics` route renders analytics page
- [ ] Revenue over time chart (line) renders with correct data
- [ ] Orders by hour chart (bar) renders with correct data
- [ ] Top products chart (horizontal bar) renders with correct data
- [ ] Rider utilization chart (bar) renders with correct data
- [ ] Period selector (7d/30d/90d) updates charts
- [ ] Charts are responsive (mobile + desktop)
- [ ] Dark theme applied to charts (text color, grid color)
- [ ] Summary KPIs on main dashboard link to analytics page
- [ ] Unit test: AnalyticsService returns correct data shape
- [ ] Integration test: analytics endpoints return valid data

#### TDD Approach
- **Unit Test:** `AnalyticsService.getSalesData()` returns revenue_over_time array
- **Unit Test:** `AnalyticsService.getSalesData()` respects period parameter
- **Unit Test:** `AnalyticsService.getProducts()` returns conversion rates
- **Unit Test:** `AnalyticsService.getRiders()` returns utilization data
- **Integration Test:** GET /api/operations/analytics/sales returns 200 with valid JSON
- **Visual Test:** Charts render at desktop and mobile breakpoints

#### Bug Risks
- Risk: Analytics queries are slow (large datasets)
- Mitigation: Add database indexes, cache results for 5 minutes
- Risk: Charts break with null data
- Mitigation: Handle empty datasets gracefully, show "No data" message
- Risk: Chart.js bundle is large
- Tree-shake: Import only needed chart types (line, bar, doughnut)
- Risk: Period selector doesn't update charts
- Mitigation: Use React state, re-fetch on period change

---

### Ticket 10: Data Seeder

**Type:** AFK
**Blocked by:** Ticket 1 (docs cleanup), Ticket 8 (tracking schema must exist)
**V-Model Level:** Coding → Unit Testing

#### What to Build
Laravel seeder that generates realistic test data: 500-1000 orders over 30 days, rider delivery records, user tracking events. Data should have realistic time-of-day patterns (more orders at lunch/dinner), South African prices (ZAR), and real product IDs.

#### Schema Changes
None — uses existing tables.

#### Seeder Files
- `database/seeders/OrderSeeder.php` — 500-1000 orders
- `database/seeders/RiderDeliverySeeder.php` — rider delivery records
- `database/seeders/UserTrackingSeeder.php` — tracking events

#### Data Distribution
| Metric | Distribution |
|--------|-------------|
| Orders per day | 30-50, with weekend spike |
| Time of day | Peak at 11:00-13:00 (lunch) and 17:00-19:00 (dinner) |
| Order values | R150-R800, normal distribution centered on R350 |
| Delivery times | 15-45 minutes, log-normal distribution |
| Product views | 10x order count |
| Search queries | 5x order count |
| Cart additions | 3x order count |

#### Acceptance Criteria
- [ ] Seeder runs without errors: `php artisan db:seed --class=OrderSeeder`
- [ ] 500-1000 orders created spanning 30 days
- [ ] Orders have realistic time-of-day distribution
- [ ] Order items reference real product IDs
- [ ] Prices are in ZAR (R150-R800 range)
- [ ] Rider delivery records created for delivered orders
- [ ] User tracking events created (10x views, 5x searches, 3x carts)
- [ ] Seeder is idempotent (can run multiple times without duplicates)
- [ ] Data is queryable by analytics endpoints

#### TDD Approach
- **Unit Test:** OrderSeeder creates correct number of orders
- **Unit Test:** OrderSeeder distributes orders across 30 days
- **Unit Test:** OrderSeeder uses realistic ZAR prices
- **Unit Test:** UserTrackingSeeder creates correct ratio of events
- **Integration Test:** Seeded data is returned by analytics endpoints

#### Bug Risks
- Risk: Seeder creates orders with invalid foreign keys
- Mitigation: Verify products, customers, riders exist before seeding
- Risk: Seeder is not idempotent, creates duplicates on re-run
- Mitigation: Check for existing data before inserting, use `DB::transaction`
- Risk: Prices are unrealistic (e.g., R0.01 or R100000)
- Mitigation: Validate price range in seeder
- Risk: Time distribution is uniform, not realistic
- Mitigation: Use weighted random for hour selection

---

### Ticket 11: UI Polish (Sound + Hotkeys + Fullscreen + Layers + Alerts)

**Type:** AFK
**Blocked by:** Ticket 3 (needs dashboard layout)
**V-Model Level:** Module Design → Integration Testing

#### What to Build
Five small UI features that polish the dashboard experience:
1. **Dispatch chime** — Web Audio API sine wave on new order
2. **Keyboard hotkeys** — Space=pause, 1-5=speed, Esc=close
3. **Map fullscreen toggle** — Glass-morphism button on map edge
4. **Layer toggles** — Traffic, Routes, Demand with glow effects
5. **Rule-based alerts** — Order pending >5min, rider idle >10min

#### Sound System
```javascript
class DispatchChime {
  private ctx: AudioContext;
  
  play() {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    // C5 → E5 → G5 → C6 arpeggio
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.3); // C6
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}
```

#### Hotkey Map
| Key | Action |
|-----|--------|
| Space | Pause/Play simulation |
| 1 | Speed 1x |
| 2 | Speed 2x |
| 3 | Speed 5x |
| 4 | Speed 10x |
| 5 | Speed 20x |
| Esc | Close all panels |
| F | Toggle fullscreen |
| L | Toggle layers |

#### Layer Toggle Values
| Layer | Default | Glow Color |
|-------|---------|------------|
| Traffic | Off | `rgba(244, 63, 94, 0.6)` (rose) |
| Routes | Off | `rgba(245, 130, 32, 0.6)` (orange) |
| Demand | Off | rgba(251, 191, 36, 0.6) (amber) |

#### Alert Thresholds
| Alert | Condition | Severity |
|-------|-----------|----------|
| Order pending | `status='pending'` for >5 minutes | warning |
| Rider idle | No order assigned for >10 minutes | info |
| Delivery slow | `eta_seconds` > 2x average | warning |

#### Acceptance Criteria
- [ ] Dispatch chime plays on new order arrival
- [ ] Chime only plays after first user interaction (autoplay policy)
- [ ] Keyboard hotkeys work as defined
- [ ] Hotkeys don't interfere with text input fields
- [ ] Fullscreen toggle button visible on map
- [ ] Fullscreen toggle animates smoothly
- [ ] Layer toggles show/hide overlays
- [ ] Active layers show glow effect
- [ ] Alerts appear when thresholds exceeded
- [ ] Alerts dismissible
- [ ] Unit test: DispatchChime plays without error
- [ ] Unit test: Hotkey handler calls correct action

#### TDD Approach
- **Unit Test:** DispatchChime initializes AudioContext
- **Unit Test:** DispatchChime.play() creates oscillator
- **Unit Test:** Hotkey handler maps Space to pause
- **Unit Test:** Alert service checks order pending threshold
- **Integration Test:** New order triggers chime
- **Integration Test:** Keyboard shortcut toggles fullscreen

#### Bug Risks
- Risk: AudioContext blocked by browser autoplay policy
- Mitigation: Initialize on first click/touch, show "Enable sound" button
- Risk: Hotkeys conflict with browser shortcuts (Space = scroll)
- Mitigation: Prevent default only when dashboard is focused
- Risk: Fullscreen toggle z-index conflicts with map controls
- Mitigation: Use consistent z-index scale (z-1000 for overlays)
- Risk: Layer toggles cause map to re-render slowly
- Mitigation: Use Leaflet layer groups, add/remove without re-render

---

### Ticket 12: Role-Based Access

**Type:** AFK
**Blocked by:** Ticket 3 (needs dashboard layout)
**V-Model Level:** System Design → System Testing

#### What to Build
Protect the `/operations` route and its API endpoints based on user role. Route-level guards redirect unauthorized users. Tab-level hiding removes UI elements for roles that shouldn't see them. Backend validates role on every API call.

#### Schema Changes
None — uses existing roles from `UserRole` enum.

#### Role Permissions Matrix
| Feature | developer | store_owner | store_manager | logistics_officer | customer | rider |
|---------|-----------|-------------|---------------|-------------------|----------|-------|
| View dashboard | ✓ | ✓ (own store) | ✓ (own store) | ✓ (all stores) | ✗ | ✗ |
| View metrics | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View event feed | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Assign rider | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View analytics | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View audit logs | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Export data | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |

#### Backend
- `app/Http/Middleware/RoleMiddleware.php` — role-based route protection
- `app/Services/StoreContextService.php` — resolves store for scoped roles

#### Frontend
- `frontend/src/components/operations/RoleGuard.tsx` — route wrapper
- `frontend/src/components/operations/useRole.ts` — hook for role checks

#### Acceptance Criteria
- [ ] `/operations` redirects customers and riders to their own dashboards
- [ ] Store Owner sees only their store's data
- [ ] Store Manager sees only their store's data
- [ ] Logistics Officer sees all stores' data
- [ ] Developer sees everything
- [ ] Tabs/panels hidden based on role (e.g., export button hidden for store_manager)
- [ ] API endpoints validate role server-side
- [ ] Unauthorized API access returns 403
- [ ] Unit test: RoleMiddleware allows authorized role
- [ ] Unit test: RoleMiddleware rejects unauthorized role
- [ ] Integration test: Store Owner cannot see other store's riders

#### TDD Approach
- **Unit Test:** `RoleMiddleware` allows store_owner for `/operations`
- **Unit Test:** `RoleMiddleware` rejects customer for `/operations`
- **Unit Test:** `StoreContextService` resolves correct store for store_owner
- **Unit Test:** `StoreContextService` returns all stores for logistics_officer
- **Integration Test:** GET /api/operations/metrics as store_owner returns own store only
- **Integration Test:** GET /api/operations/metrics as customer returns 403

#### Bug Risks
- Risk: Frontend hides tab but API doesn't validate
- Mitigation: Defense in depth — both UI and API validate independently
- Risk: Store Owner queries other store's data via API manipulation
- Mitigation: Backend injects store_id from session, not client input
- Risk: Role check is bypassed for developer role
- Mitigation: Developer role explicitly checked, not used as default
- Risk: StoreContextService fails for riders (no store assignment)
- Mitigation: Riders never reach /operations, but if they do, return 403

---

## Dependency Graph

```
Ticket 1 (Docs Cleanup)
Ticket 2 (Dark Map) ─────────┬── Ticket 3 (Dashboard) ──┬── Ticket 6 (Event Feed)
                              │                          ├── Ticket 11 (UI Polish)
                              │                          └── Ticket 12 (Role Access)
                              └── Ticket 4 (ETA) ─── Ticket 5 (Dispatch)

Ticket 7 (Audit) ──────────────────────────────────────── (independent)
Ticket 8 (User Tracking) ─────────┬── Ticket 9 (Analytics)
                                  └── Ticket 10 (Data Seeder)
```

## Implementation Order

| Phase | Tickets | Rationale |
|-------|---------|-----------|
| **Phase 1: Foundation** | 1, 2, 7, 8 | Independent, no blockers. Clean docs, create map, create schema. |
| **Phase 2: Core Dashboard** | 3, 4, 6 | Build on map foundation. Dashboard layout, ETA, events. |
| **Phase 3: Dispatch** | 5 | Needs ETA and dashboard. The core operational feature. |
| **Phase 4: Data & Analytics** | 9, 10 | Needs tracking schema. Charts and seeded data. |
| **Phase 5: Polish** | 11, 12 | Needs dashboard. Sound, hotkeys, roles. |

## Verification Checklist

After all tickets are complete:

- [ ] All unit tests pass (`npm test` / `php artisan test`)
- [ ] All integration tests pass
- [ ] No console errors in browser
- [ ] Dashboard loads in <3 seconds
- [ ] Map renders with dark tiles
- [ ] Rider markers show ETA on hover/click
- [ ] Dispatch panel opens and assigns riders
- [ ] Event feed shows live events
- [ ] Charts render with seeded data
- [ ] Sound plays on new order
- [ ] Hotkeys work
- [ ] Role guards redirect unauthorized users
- [ ] Audit logs are created for all actions
- [ ] User tracking events are stored
- [ ] Responsive on mobile and desktop
- [ ] No accessibility violations (WCAG 2.1 AA)
