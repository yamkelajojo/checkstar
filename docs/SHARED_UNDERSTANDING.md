# Shared Understanding — Rider Operations Dashboard

**Date:** 2026-08-29
**Status:** Finalized via grilling session (29 rounds)

---

## EGAD Framework

### Problem Statement

**Vision:** A real-time operations dashboard that gives Checkstar store owners, managers, and logistics officers full visibility into rider locations, order status, delivery performance, and revenue — enabling data-driven decisions that improve delivery speed, customer satisfaction, and profitability.

**Issue:** Currently, store operators have no centralized view of active deliveries, rider locations, or real-time order status. Decisions are made reactively. Customer behavior data (browsing, search, conversion) is not captured or analyzed.

**Process:** Build a map-centric web dashboard with real-time GPS tracking, order lifecycle monitoring, audit logging, financial metrics, and customer behavior analytics — powered by seeded data for v1, real data as the system matures.

### Equation of Value

| Key Value Driver | Value per Driver | Enterprise Value |
|------------------|------------------|------------------|
| Faster delivery dispatch | Reduced avg delivery time → higher customer satisfaction | More repeat orders |
| Rider utilization visibility | Better rider allocation → fewer idle riders | Lower cost per delivery |
| Customer behavior insights | Product view → cart → purchase conversion data | Targeted marketing, better inventory |
| Audit trail | Dispute resolution, compliance | Reduced losses, NIST alignment |

### Problem Landscape

| Layer | What we have |
|-------|-------------|
| **Data** | `orders`, `order_items`, `rider_locations`, `riders`, `products`, `customers` tables. New: user tracking events (product views, searches, cart additions) |
| **Information** | Order state machine, rider GPS updates, product catalog, customer profiles |
| **Knowledge** | OSRM routing for ETA, Dispatch Policy for rider assignment, existing role-based access control |

---

## Architecture Decisions

### Dashboard Audience
- **Both scoped and global views**, role-dependent
- Store Owner/Manager → their store's riders and orders only
- Logistics Officer → all 3 stores overlaid on one map
- Customer → order tracking, not the operations dashboard
- Rider → mobile only, no web dashboard

### Real-Time Data Flow
| Signal | Source | Cadence |
|--------|--------|---------|
| Rider GPS | Rider app → `rider_locations` table | Every N seconds (polling) |
| Order status | Backend state machine → `orders` table | Polling for v1, SSE/WebSocket later |
| ETA | OSRM calculation → `orders.eta_seconds` | Recalculates on >200m rider movement |

### Map Configuration
- **Tiles:** CARTO `dark_all` (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`)
- **Center:** Durban `[-29.825, 31.00]`, Zoom 12.5
- **Controls:** Dark glass-morphism (backdrop-filter: blur(18px) saturate(1.2))
- **Fullscreen toggle:** Frontend web + rider dashboard, not mobile
- **Sound:** Dispatch chime only (Web Audio API procedural sine wave)

### Role-Based UI
- **Route-level guards:** `/operations` redirects non-authorized roles
- **Tab-level hiding:** Tabs/panels hide based on role within the dashboard
- **Backend validation:** Every API call validates role (defense in depth)

### Default View
- **Map-centric** — full-screen map with rider dots, side panels collapsed
- Left HUD: Metrics (Fleet, Orders/Hr, Avg ETA, Active deliveries)
- Right panel: Event feed + Dispatch suggestions
- Click rider → slide-in panel from right (spring animation: stiffness 300, damping 30)

---

## Features In Scope (v1)

### Core Dashboard
| Feature | Details |
|---------|---------|
| Real-time map | Leaflet + CARTO dark tiles, rider markers with direction |
| Rider click modal | Slide-in panel: order items, customer info, ETA, actions |
| Metrics HUD | Active/Total riders, Orders/hr, Pending/Active/Delivered, Avg ETA |
| Event feed | Order state changes + rider availability + dispatch attempts |
| Dispatch suggestion | Nearest available rider to order, one-click assign |
| Layer toggles | Traffic, Routes, Demand (glow effects when active) |
| Keyboard hotkeys | Space=pause, 1-5=speed, W=weather, F=fleet, Esc=close |
| Dispatch chime | One sound on new order arrival |

### ETA System
| Component | Details |
|-----------|---------|
| Schema | `orders.eta_seconds INTEGER NULL`, `orders.eta_updated_at TIMESTAMP NULL` |
| Calculation | OSRM route from rider current location to customer address |
| Trigger | At dispatch + on >200m rider movement |
| Display | Rider detail card, order list, map marker tooltip, left metrics HUD (avg) |

### Financial Metrics
| Metric | Source |
|--------|--------|
| Revenue (total, by store, by time) | `orders` table |
| Average order value | `orders` table |
| Items per order | `order_items` table |
| Payment status | `orders.payment_status` (pending/paid/failed/refunded) |

### User Tracking
| Event Type | What it captures |
|------------|-----------------|
| `product_view` | Customer views a product detail page |
| `search` | Customer searches for products |
| `add_to_cart` | Customer adds item to cart |
| `remove_from_cart` | Customer removes item from cart |
| `checkout` | Customer completes purchase |

### Audit Logging
| Scope | What gets logged |
|-------|-----------------|
| Order lifecycle | Confirmed, dispatched, picked up, delivered, cancelled |
| Rider actions | Availability toggles, location updates, break starts |
| Operator actions | Manual dispatch, view logs, config changes |

### Charts (Chart.js)
| Category | Charts |
|----------|--------|
| Sales overview | Revenue over time (line), orders by hour (bar), top products (horizontal bar) |
| Product performance | View-to-cart conversion, search-to-purchase funnel |
| Rider utilization | Delivery count per rider, avg delivery time per rider |

### Smart Alerts (Rule-Based)
| Alert | Threshold |
|-------|-----------|
| Order pending too long | >5 minutes without dispatch |
| SLA risk | Delivery time approaching target |
| Rider idle | No order for >10 minutes |
| High demand | Orders/hour exceeding baseline |

---

## Features Explicitly Excluded (v1)

| Feature | Reason |
|---------|--------|
| Simulation engine | Don't simulate what you can track |
| A* graph pathfinding | Backend already has OSRM |
| Canvas 60fps rendering | Won't have 48 concurrent riders |
| Weather system | Not needed for v1 operations |
| Boot sequence | Low priority |
| HubHUD / ZoneHUD | Store-level views come later |
| Demand heatmap | Requires historical data |
| Animated flow dashes on mobile | Static polyline is fine for v1 |
| Full SSE/WebSocket | Polling for v1 |
| D3.js charts | Chart.js for v1, D3 as scalpel later |
| Rider web dashboard | Riders use mobile only |

---

## Schema Changes Required

### `orders` table
```sql
ALTER TABLE orders ADD COLUMN eta_seconds INTEGER NULL;
ALTER TABLE orders ADD COLUMN eta_updated_at TIMESTAMP NULL;
ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
-- payment_status: 'pending', 'paid', 'failed', 'refunded'
```

### `customers` table
```sql
ALTER TABLE customers ADD COLUMN has_checkstar_card BOOLEAN DEFAULT FALSE;
```

### `audit_logs` table (new)
```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### `user_tracking_events` table (new)
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
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## Reusable Assets from Mockups

| Asset | Source | Destination |
|-------|--------|-------------|
| CARTO `dark_all` tiles | Copy (2) | Frontend web + dashboard |
| Glass-morphism CSS | Copy (2) + (3) | All dashboard panels |
| Orange glow accents `#F58220` | Copy (3) | Buttons, badges, highlights |
| Background `#070709` | Copy (3) | Near-black base |
| Panel BG `#0A0A0B` | Copy (3) | Top bar, panels |
| Card BG `#101012` | Copy (3) | Metric cards |
| Border `rgba(255,255,255,0.08)` | Copy (2) | Subtle white border |
| Inter font (300-500) | Copy (3) | All UI text |
| JetBrains Mono | Copy (3) | Data values, IDs, timestamps |
| Zustand + throttled state | Copy (1) | Dashboard state management |
| LayoutId tab animations | Copy (1) | Dashboard tab switching |
| Sparkline SVG charts | Copy (1) | Analytics panel |
| Dispatch chime sound | Copy (2) | Dashboard audio |
| Keyboard hotkeys | Copy (2) | Desktop power users |
| Layer toggles with glow | Copy (1) + (2) | Map overlay controls |
| Spring panel entry | Copy (1) | Rider detail slide-in |
| Pointer-events passthrough | Copy (1) | Map + overlay panels |
| Custom scrollbar | Copy (2) | Dashboard panels |

---

## Documentation Cleanup

### Files to DELETE (10 files)
1. `docs/PHASE1_REPORT.md` — Completed implementation audit
2. `docs/AUDIT_REPORT.md` — Completed integration review
3. `docs/grilling/mobile-ui-overhaul.md` — Grilling session record
4. `docs/SMART_TRACKING_ANALYSIS.md` — Future feature analysis
5. `graphify-out/GRAPH_REPORT.md` — Auto-generated
6. `graphify-out/graph.html` — Auto-generated
7. `graphify-out/graph.json` — Auto-generated
8. `graphify-out/manifest.json` — Auto-generated
9. `graphify-out/cost.json` — Auto-generated
10. `graphify-out/cache/` — 48 auto-generated cache files

### Files to KEEP (18 files)
1. `CONTEXT.md` — Ubiquitous language
2. `README.md` — Root project README
3. `cs.md` — Website Intelligence Report
4. `MOBILE_APP_UX.md` — Mobile UX page map
5. `checkstar_recipes.md` — Original recipes content
6. `docs/adr/0001-mobile-react-native-expo.md` — ADR
7. `docs/adr/0002-tamagui-design-system-adoption.md` — ADR
8. `docs/route-explorer.md` — Route Explorer feature spec
9. `frontend/ARCHITECTURE.md` — Frontend navigation architecture
10. `mobile/README.md` — Mobile build instructions
11. `mobile/AGENTS.md` — SDK pin guard doc
12. `mobile/CLAUDE.md` — Claude agent instructions
13. `backend/README.md` — Laravel framework README
14. `checkstar-logo-icon-star.html` — Logo icon SVG
15. `checkstar-logo-text.html` — Logo text SVG
16. `osrm-durban/*/README.txt` (2 files) — Data attribution
17. `backend/public/robots.txt` — Crawler config

---

## Implementation Priority

| Priority | Task | Estimated Effort |
|----------|------|------------------|
| P1 | Documentation cleanup (delete 10 files) | 10 min |
| P1 | Dark map theme on frontend web | 30 min |
| P1 | Schema migrations (orders, customers, audit_logs, user_tracking_events) | 1 hour |
| P1 | Shared MapContainer component | 2 hours |
| P1 | Rider operations dashboard page skeleton | 3 hours |
| P2 | ETA calculation service | 2 hours |
| P2 | Dispatch suggestion panel | 2 hours |
| P2 | Event feed component | 2 hours |
| P2 | Metrics HUD component | 2 hours |
| P2 | Audit logging middleware | 2 hours |
| P2 | User tracking events API | 2 hours |
| P3 | Chart.js analytics page | 3 hours |
| P3 | Data seeder (orders, riders, user tracking) | 3 hours |
| P3 | Dispatch chime sound | 1 hour |
| P3 | Keyboard hotkeys | 1 hour |
| P3 | Rule-based alerts | 2 hours |
| P4 | Map fullscreen toggle | 1 hour |
| P4 | Layer toggles | 2 hours |
| P4 | Role-based route guards | 2 hours |
| P4 | Tab-level role hiding | 2 hours |

---

## TDD Approach

Every feature will follow test-driven development:
1. Write failing test first
2. Implement minimum code to pass
3. Refactor
4. Verify all existing tests still pass

Test commands:
- Frontend: `npm test` (Jest)
- Backend: `php artisan test` (PHPUnit)
- Mobile: `npm test` (Jest + expo)
