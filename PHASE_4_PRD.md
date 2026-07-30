# Checkstar — Phase 4: Full Build PRD

**Date:** 2026-07-30
**Status:** Draft
**Branch:** `phase_4`

---

## Problem Statement

Checkstar is a Durban-based supermarket chain with 3 physical stores operating an outdated static XHTML 1.0 Dreamweaver site from 2016. The business needs a modern, animated, database-driven website combined with a grocery delivery service using motorbike Riders. There is no existing digital ordering infrastructure — every piece must be built from scratch.

The previous phases established the domain glossary (Phase 1), tech stack decisions (Phase 2), and the complete database schema with Redis integration (Phase 3). This phase delivers the entire working system: Laravel API backend, Next.js storefront, delivery dispatch system, admin dashboards, and all content pages.

---

## Solution

A monorepo containing two projects side by side:

- **`backend/`** — Laravel 11 API-only application serving JSON endpoints. Handles all business logic, database operations, Redis caching/queues, authentication (Sanctum cookie-based SPA), and the dispatch algorithm. No Blade views, no Inertia — pure API.
- **`frontend/`** — Next.js (App Router) + React 19 application serving the public website, customer dashboard, Rider dashboard, and admin panels. Communicates with Laravel via a proxy at `/api/*`. Uses motion.dev for all animations, Tailwind v3 for styling, and Zustand v5 for client-side state.

The dispatch system automatically assigns available Riders to confirmed orders using a Haversine-based store proximity algorithm with configurable retry intervals and store failover. Atomic claim handling via `FOR UPDATE SKIP LOCKED` prevents double-assignment. Redis backs the dispatch retry queue, session storage, and cache store.

---

## User Stories

### Visitor (Unauthenticated)

1. As a visitor, I want to view the homepage with a hero carousel, category grid, and featured products, so that I can quickly understand what Checkstar offers.
2. As a visitor, I want to browse products by category, so that I can find what I'm looking for.
3. As a visitor, I want to view product details including price, unit, description, and images, so that I can decide what to buy.
4. As a visitor, I want to view current specials and promotions with banners and pricing, so that I can take advantage of deals.
5. As a visitor, I want to find store locations on a Leaflet map, so that I can visit the nearest Checkstar.
6. As a visitor, I want to view store details (address, phone, trading hours, delivery radius), so that I know when and how to shop.
7. As a visitor, I want to read recipes with ingredients and method, so that I can cook with Checkstar products.
8. As a visitor, I want to view the Community page (Gallery + CSR merged), so that I can see Checkstar's involvement and photo gallery.
9. As a visitor, I want to read about Checkstar's brand story and stakeholders, so that I understand the company.
10. As a visitor, I want to contact Checkstar via a form, so that I can ask questions or give feedback.
11. As a visitor, I want to view career listings grouped by department, so that I can find job opportunities.
12. As a visitor, I want to register as a Customer with name, email, password, and phone, so that I can place delivery orders.
13. As a visitor, I want to register as a Rider with extra fields (vehicle type, banking details), so that I can deliver orders.
14. As a visitor, I want to browse products and add them to a cart without logging in, so that I can explore the catalog before committing to an account.
15. As a visitor, I want my guest cart to persist across browser sessions via localStorage, so that I don't lose my selections.

### Customer

16. As a Customer, I want to log in with email and password, so that I can access my account.
17. As a Customer, I want to log out, so that I can secure my session.
18. As a Customer, I want to update my profile (name, email, phone, avatar), so that my information stays current.
19. As a Customer, I want my guest cart to sync to my account on login, so that I don't lose items I added before signing in.
20. As a Customer, I want to view and edit my cart (change quantities, remove items), so that I can prepare my order.
21. As a Customer, I want to see a running total with subtotal and delivery fee, so that I know what I'll pay.
22. As a Customer, I want to place an order with delivery address and notes, so that my groceries are delivered to me.
23. As a Customer, I want to see an order confirmation with order number and status, so that I know my order was received.
24. As a Customer, I want to view my order history sorted by date, so that I can track past purchases.
25. As a Customer, I want to track my active order with a timeline of status changes, so that I know where my delivery is.
26. As a Customer, I want to confirm delivery when my order arrives, so that the Rider gets credit and payment processes.
27. As a Customer, I want to rate my Rider (1-5 stars) and leave a text review after delivery, so that I can provide feedback.
28. As a Customer, I want to cancel my order if it hasn't been dispatched yet, so that I'm not charged for unwanted items.
29. As a Customer, I want to see which store is fulfilling my order, so that I know where my groceries come from.
30. As a Customer, I want to search products by name or tag, so that I can find items quickly.

### Rider

31. As a Rider, I want to log in to a dedicated Rider dashboard, so that I can manage my deliveries.
32. As a Rider, I want to toggle my availability on and off, so that I only receive orders when I'm ready.
33. As a Rider, I want to see my assigned store, so that I know where to pick up orders.
34. As a Rider, I want to view a list of available (claimable) orders at my store, so that I can choose which to deliver.
35. As a Rider, I want to claim an order with one tap, so that I can start fulfilling it.
36. As a Rider, I want to be guaranteed that only the first Rider to claim gets the order, so that there's no double-assignment.
37. As a Rider, I want to view my active deliveries with customer address and delivery notes, so that I know where to go.
38. As a Rider, I want to mark items as bought at the store, so that inventory is decremented and the customer knows their items are secured.
39. As a Rider, I want to mark an order as out for delivery, so that the customer knows I'm on my way.
40. As a Rider, I want to mark an order as delivered, so that the customer can confirm receipt.
41. As a Rider, I want to view my gamification stats (XP, level, badges, total deliveries, average rating), so that I can track my performance.
42. As a Rider, I want to earn XP and badges for completing deliveries and milestones, so that I'm motivated to perform well.
43. As a Rider, I want to view my delivery history, so that I can review past orders.
44. As a Rider, I want to view my profile with my vehicle type, rating, and banking details, so that I can keep my information current.

### Store Manager

45. As a Store Manager, I want to log in to a store dashboard, so that I can manage my store's operations.
46. As a Store Manager, I want to view all orders for my store, so that I can oversee fulfillment.
47. As a Store Manager, I want to update order status when needed, so that I can handle edge cases manually.
48. As a Store Manager, I want to view stock levels for all products at my store, so that I can manage inventory.
49. As a Store Manager, I want to toggle product availability at my store, so that I can hide out-of-stock items.
50. As a Store Manager, I want to view order activity logs, so that I can audit state changes and resolve disputes.
51. As a Store Manager, I want to view my store staff, so that I know who's on shift.

### Logistics Officer

52. As a Logistics Officer, I want to monitor orders across all stores, so that I have operational visibility.
53. As a Logistics Officer, I want to manually dispatch an order to a specific Rider, so that I can override the algorithm when needed.
54. As a Logistics Officer, I want to view dispatch algorithm performance (claim latency, failover rates), so that I can tune configuration.
55. As a Logistics Officer, I want to reassign an order to a different Rider, so that I can handle Rider dropouts.

### Store Owner

56. As a Store Owner, I want to manage my store's settings (name, address, hours, delivery radius), so that my store information is accurate.
57. As a Store Owner, I want to manage store staff (hire fire store managers and logistics officers), so that my store is properly staffed.
58. As a Store Owner, I want to view all orders and activity for my store, so that I have full operational oversight.

### Developer / Admin

59. As a Developer, I want full CRUD on all entities (products, categories, specials, recipes, community posts, career listings, users, riders, stores), so that I can manage the entire platform.
60. As a Developer, I want to manage the product catalog with bulk operations, so that I can efficiently maintain thousands of products.
61. As a Developer, I want to manage categories with icons, images, and sort order, so that the browse experience is well organized.
62. As a Developer, I want to manage collection specials with date ranges and product assignments, so that promotions are configurable.
63. As a Developer, I want to manage recipes with structured ingredients and method, so that content is up to date.
64. As a Developer, I want to manage community posts (gallery and CSR), so that community content is current.
65. As a Developer, I want to manage career listings with descriptions and closing dates, so that job postings are accurate.
66. As a Developer, I want to view and respond to contact messages, so that customer inquiries are handled.
67. As a Developer, I want to view system health, cache status, and queue metrics, so that I can monitor production.
68. As a Developer, I want to seed demo data for development, so that I have realistic content to work with.

---

## Implementation Decisions

### Repo Structure

Monorepo with two top-level directories:

```
checkstar/
├── backend/          # Laravel 11 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/    # API controllers grouped by domain
│   │   │   └── Middleware/     # Role-based, Sanctum, CORS
│   │   ├── Models/             # Eloquent models (all 20)
│   │   ├── Services/           # Domain services (deep modules)
│   │   └── Enums/              # PHP enums for roles, statuses
│   ├── config/
│   │   ├── dispatch.php        # Dispatch algorithm config
│   │   ├── sanctum.php         # Sanctum SPA config
│   │   └── ...
│   ├── database/
│   │   ├── migrations/         # 20 migrations (build order per PHASE_3_DB_SCHEMA.md)
│   │   └── seeders/            # Demo data seeders
│   └── routes/
│       ├── api.php             # All API routes
│       └── console.php
├── frontend/         # Next.js App Router + React 19
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # Shared components (motion/react + shadcn/ui)
│   │   ├── stores/             # Zustand stores
│   │   ├── lib/                # API client, utilities
│   │   └── types/              # TypeScript types
│   ├── public/                 # Static assets
│   └── middleware.ts           # Next.js proxy middleware for /api/*
└── PHASE_3_DB_SCHEMA.md        # Schema reference (source of truth)
```

### Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend | Next.js App Router + React 19 | Server components for SEO, client components for interactivity, App Router for nested layouts |
| Backend | Laravel 11 API-only | No Blade, no Inertia — pure API with Sanctum SPA auth |
| Auth | Laravel Sanctum (cookie-based) | SPA authentication; Next.js does not store tokens, just proxies cookies |
| Proxy | Next.js rewrites `/api/*` to Laravel | Single origin, no CORS issues in production |
| UI Animation | motion (core library, MIT, entry: `motion/react`) + shadcn/ui base components | All custom components use motion/react primitives — no hand-rolled CSS animations |
| CSS | Tailwind v3 + Josh Comeau CSS reset | Utility-first, consistent with design tokens |
| State | Zustand v5 with persist middleware | Client-side cart persists to localStorage |
| Database | SQLite (dev) → PostgreSQL (prod) | Zero-setup dev, robust prod |
| Cache | Redis (cache store) | Cache-aside for products, specials, categories |
| Sessions | Redis (session driver) | Fast, shared across instances |
| Queues | Redis (queue backend) | Dispatch retry polling, gamification events |
| Maps | Leaflet + OpenStreetMap | Free, no API key, custom markers |
| Mobile future | React Native (shares types, Zustand patterns) | Same API, same state patterns |

### Deep Modules

These modules pass the **deletion test**: if deleted, their complexity would reappear across multiple callers, not concentrate in one place. Each has a small **interface** (few methods, simple params, typed inputs/outputs) hiding a large **implementation**.

**Dependency categories** (per DEEPENING.md): in-process (pure computation), local-substitutable (SQLite in testing), remote but owned (own services), true external (third-party).

#### 1. DispatchService

```php
/**
 * Initiates dispatch for a confirmed order.
 * If a rider is immediately available, assigns them atomically.
 * If not, schedules retry via the queue.
 * All outcomes recorded in order activity log.
 *
 * @throws OrderNotFoundException
 * @throws InvalidOrderStatusException (if not 'confirmed')
 * @throws DispatchFailedException (all stores exhausted)
 */
function dispatch(OrderId $orderId): void;
```

**Implementation hides:**
- Haversine distance calculation (formerly its own module — absorbed here)
- Store proximity sort and delivery radius filtering
- Available rider query
- Atomic claim via `FOR UPDATE SKIP LOCKED`
- Retry scheduling (Redis queue with TTL)
- Store failover cascade with configurable timeout
- Activity log entries for each sub-step (attempt, assignment, retry, cancellation)

**Dependency category:** Remote but owned (queue for retries), local-substitutable (repositories). Single public method — maximum depth.

#### 2. PricingService

```php
/**
 * Returns the effective price for a product given optional collection specials.
 * Product-level sale_price always takes priority over collection pricing.
 *
 * @param CollectionSpecial[] $specials — active specials the product belongs to
 */
function effectivePrice(Product $product, array $specials = []): Price;
```

**Implementation hides:** sale_price vs collection special priority logic, active date range checking, null-to-regular-price fallback.

**Dependency category:** In-process (pure computation). No adapter needed — test directly. Interfaces passes specials in so the function stays pure; callers load specials once and pass them.

#### 3. OrderStateMachine

```php
/**
 * Validates and executes an order status transition.
 * Atomically updates the order and writes an append-only activity log entry.
 *
 * @throws OrderNotFoundException
 * @throws InvalidTransitionException (transition not allowed from current status)
 */
function transition(OrderId $id, OrderStatus $to, ?UserId $actor): void;
```

**Implementation hides:** 18 transition rules (14 valid + 4 invalid, includes cancellation from most states), status update, activity log creation with old/new status and metadata, immutable audit enforcement (no updates to existing logs).

**Dependency category:** Local-substitutable (Eloquent repositories). Typed `OrderStatus` enum communicates valid values in the interface — callers cannot pass invalid strings.

#### 4. GamificationService

```php
/**
 * Processes a gamification event for a Rider.
 * Awards XP, checks level-up thresholds, and awards milestone badges.
 *
 * @param GameEvent $event — typed enum (DeliveryCompleted, OrderConfirmed, etc.)
 */
function handleEvent(RiderId $riderId, GameEvent $event, array $context): GamificationOutcome;
```

Where `GamificationOutcome` = `{xpGained: int, newLevel: ?int, newBadges: BadgeType[]}`.

**Implementation hides:** XP calculation per event type, level-up detection (20 XP per level), badge milestone checks, duplicate badge prevention, queued badge award job.

**Dependency category:** Local-substitutable (Eloquent). `GameEvent` typed enum replaces the old string-typed `$event` — misspellings are caught at compile time.

#### Removed as deep modules

| Module | Reason | New home |
|--------|--------|----------|
| **HaversineService** | Failed deletion test — only one caller (DispatchService). Interface as complex as the formula. | Absorbed into DispatchService's implementation as a private function. |
| **CartSyncService** | Failed deletion test — only one call site (login handler). One adapter (Eloquent). Seam is hypothetical, not real. | Inlined into the auth login handler. Merge logic for conflict resolution and stale cleanup lives as private methods there. |

### Database

Full 20-table schema defined in `PHASE_3_DB_SCHEMA.md`. Key design points:

- **Status independence**: `orders.status` and `orders.payment_status` are independent columns, enforced in application logic
- **Snapshot pattern**: `order_items.product_snapshot` JSON freezes product data at purchase time
- **Append-only audit**: `order_activity_logs` has no UPDATE or DELETE — immutable audit trail
- **Atomic dispatch**: Rider claim uses `FOR UPDATE SKIP LOCKED` at the query level
- **Denormalized counters**: `riders.total_deliveries`, `average_rating`, `xp` are cached aggregates recalculated from canonical source tables (`reviews`, `order_activity_logs`)
- **JSON columns**: `tags`, `trading_hours`, `product_snapshot`, `metadata`, `banking_details`, `images` — enforced in application layer
- **Referential integrity**: `orders.rider_id` FK → `riders.id` (not `users.id`) — schema guarantees only actual Rider profiles are assignable

### Redis Integration

| Purpose | Redis Key Pattern | TTL | Notes |
|---------|------------------|-----|-------|
| Cache: product catalog | `cache:products:*` | 1 hour | Invalidated on product update |
| Cache: categories | `cache:categories:*` | 1 hour | Invalidated on category update |
| Cache: active specials | `cache:specials:active` | 30 min | Rebuilt on special create/update |
| Session | Laravel default | configurable | Session driver set to `redis` |
| Queue | Laravel default | N/A | Queue driver set to `redis` |
| Dispatch retry | `dispatch:retry:{order_id}` | 300s | TTL = `timeout_seconds`; on expiry, cascades to next store |
| Rider live location | `rider:location:{rider_id}` | 30s | Updated via polling, not persisted in MVP |

### API Contract (High-Level)

All routes prefixed with `/api` and proxied through Next.js:

**Auth:**
- `POST /api/auth/register` — Customer registration
- `POST /api/auth/register/rider` — Rider registration (extra fields)
- `POST /api/auth/login` — Login (returns Sanctum cookie)
- `POST /api/auth/logout` — Logout (revokes cookie)
- `GET /api/auth/user` — Current user with role + profile

**Public:**
- `GET /api/categories` — Active categories with sort order
- `GET /api/products` — Filterable by category, featured, tag, search
- `GET /api/products/{slug}` — Product detail
- `GET /api/specials` — Active collection specials with products
- `GET /api/stores` — All active stores with coordinates
- `GET /api/stores/{slug}` — Store detail with trading hours
- `GET /api/recipes` — Published recipes, filterable by category
- `GET /api/recipes/{slug}` — Recipe detail
- `GET /api/community-posts` — Published posts, filterable by category (gallery/csr)
- `GET /api/careers` — Active career listings

**Customer (auth required):**
- `GET /api/orders` — Customer's order history
- `POST /api/orders` — Place new order (from cart)
- `GET /api/orders/{id}` — Order detail with timeline
- `POST /api/orders/{id}/cancel` — Cancel order (if allowed)
- `POST /api/orders/{id}/confirm` — Confirm delivery
- `POST /api/orders/{id}/review` — Rate Rider (1-5) + text
- `GET /api/cart` — Get user's cart
- `POST /api/cart/sync` — Sync guest cart on login
- `PUT /api/profile` — Update profile

**Rider (auth required):**
- `GET /api/rider/available-orders` — Claimable orders at rider's store
- `POST /api/rider/claim/{order}` — Claim order (atomic)
- `GET /api/rider/active-deliveries` — Current deliveries
- `POST /api/rider/items-bought/{order}` — Mark items bought
- `POST /api/rider/out-for-delivery/{order}` — Mark out for delivery
- `POST /api/rider/delivered/{order}` — Mark delivered
- `POST /api/rider/toggle-availability` — Toggle is_available
- `GET /api/rider/stats` — Gamification stats (XP, level, badges)
- `GET /api/rider/history` — Delivery history

**Store Manager / Logistics Officer (auth required):**
- `GET /api/store/orders` — Orders for assigned store
- `PATCH /api/store/orders/{id}/status` — Update order status
- `GET /api/store/inventory` — Stock levels at store
- `PATCH /api/store/inventory/{product}` — Update stock/availability

**Admin (auth required, developer role):**
- Full CRUD routes for: products, categories, specials, recipes, community-posts, careers, users, riders, stores
- `GET /api/admin/messages` — Contact messages inbox
- `GET /api/admin/health` — System health metrics

### Monorepo Scripts

```json
// Root package.json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && php artisan serve",
    "dev:frontend": "cd frontend && npm run dev",
    "test": "cd backend && php artisan test && cd ../frontend && npm run test",
    "setup": "cd backend && composer install && cp .env.example .env && php artisan key:generate && cd ../frontend && npm install"
  }
}
```

---

## Testing Decisions

A comprehensive testing plan is documented in `PHASE_4_TESTING_PLAN.md` (separate file). The high-level decisions:

- **Backend**: PHPUnit for unit tests (deep modules in isolation) + feature tests (API contract tests)
- **Frontend**: Vitest for Zustand stores and utility functions; Playwright for e2e flows
- **Deep modules** (DispatchService, PricingService, OrderStateMachine, GamificationService): Unit tested across their external seams (the interface is the test surface — see codebase-design principles). HaversineService and CartSyncService removed as modules: Haversine absorbed into DispatchService, CartSync inlined at its single call site.
- **API tests**: Test request/response contracts, auth gating, role-based access, status transitions
- **E2E**: Playwright covers critical user journeys (browse → cart → checkout → track, Rider claim → deliver cycle, admin CRUD flows)
- **CI**: GitHub Actions running backend tests, frontend tests, and Playwright on push

---

## Out of Scope

- **Real payment gateway integration** — Payments are mock for this phase (no Stripe, no PayFast). The `transactions` table and `payment_status` field are designed for future integration.
- **WebSockets / real-time push** — Rider dispatch uses polling for MVP. Laravel Reverb integration is deferred.
- **React Native mobile app** — The Zustand stores and TypeScript types are designed for future sharing, but no mobile build in this phase.
- **Email notifications** — No email delivery for order confirmations, password resets, etc. (but `email_verified_at` and auth scaffolding support it in the future).
- **SMS notifications** — No SMS dispatch for Rider notifications (future phase).
- **B2B inquiries** — The original spec mentioned `b2b_inquiries` table; deferred to future phase.
- **Multi-language / i18n** — English only for MVP.
- **Performance / load testing** — Not in this phase.
- **Security audit / penetration testing** — Standard Laravel practices applied but no dedicated audit.
- **S3 / cloud storage** — Local public disk for images; S3 configurable later via .env.
- **Search indexing (Algolia/Meilisearch)** — Basic SQL `LIKE` search for MVP.

---

## Further Notes

- **Source of truth**: `C:\Users\Acer\.opensrc\sources.json` indexes all cached packages. Laravel 11 skeleton at `repos/github.com/laravel/laravel/11.x`. Motion (core library, MIT, v12.42.2) at `repos/github.com/motiondivision/motion/main/packages/motion`. shadcn/ui (v4.10.0) at `repos/github.com/shadcn-ui/ui/4.10.0`. Consult local cache before any external resource.
- **Brand colors**: Primary `#EB6522`, PrimaryDark `#CC4400`, PrimaryLight `#FFE0CC`, Accent `#CC0000`. Design tokens in Tailwind config.
- **Typography**: Inter for body, Figtree for headings. Lucide icons.
- **Pricing rule**: Product-level `sale_price` takes priority over Collection Special pricing — enforced in PricingService.
- **Stock rule**: Stock decrements when Rider marks `items_bought`, NOT at order placement.
- **Rider-Customer separation**: A Rider who wants to shop creates a separate Customer account. No role switching.
- **Dispatch configuration**: `config/dispatch.php` with env-overridable `retry_interval_seconds` (60), `timeout_seconds` (300), `max_fallback_stores` (3).
- **3 stores**: Durban-based. Same pricing across all stores. Each has its own delivery radius and inventory.
- **Pages removed from original site**: Tips 4 You (entirely), Competitions (entirely), Recipe submission form.
- **Pages merged**: Consumer Services (into relevant page section, no dedicated tab), Community (Gallery + CSR merged).
