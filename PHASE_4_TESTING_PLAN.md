# Checkstar — Phase 4: Testing Plan

**Date:** 2026-07-30
**Author:** Test Engineering (8+ years experience)
**Reference Architecture:** DB Architect + UX Designer + UI Designer (concurrent design)
**Source of Truth:** `.opensrc` cached packages, Laravel 11 skeleton, motion.dev v12.42.2

---

## 1. Testing Philosophy

### What Makes a Good Test

A test is valuable when it:

1. **Asserts observable behavior, not implementation** — Tests should break only when the external contract changes, not when internals are refactored. For example, `DispatchServiceTest` asserts that calling `dispatch($order)` returns a `DispatchResult` with the correct store/rider, not that a specific SQL query was executed.
2. **Is isolated and deterministic** — No shared state between tests. Database transactions are rolled back after each test. External dependencies (Redis, queues) are faked or mocked unless under integration test scope.
3. **Covers the full grid: happy path + edge cases + error states** — Every endpoint and service method must have tests for valid input, invalid input, boundary conditions, and auth/authorization failures.
4. **Reads as documentation** — A test name should describe the scenario in business language: `it_cancels_an_order_when_no_riders_are_available_after_all_stores_exhausted`.
5. **Runs fast** — Unit tests complete in milliseconds. Feature/API tests complete in seconds. E2E tests are reserved for critical user journeys only.

### Test Levels (Pyramid)

```
        /\                        E2E (Playwright)
       /  \                       Critical user journeys only
      /    \
     /      \                     Integration (PHP Feature tests)
    /        \                    Module boundaries, API contracts
   /          \
  /            \                  Unit (PHPUnit / Vitest)
 /______________\                 Deep modules, stores, utilities
```

- **Unit** — 70%+ of test volume. Pure logic, no IO (or mocked IO).
- **Integration** — 20% of test volume. API endpoint contracts, database interactions, auth gating.
- **E2E** — 10% of test volume. Full user journeys through the browser.

### Test Independence Rule

Every test must be able to run in isolation and in any order. Shared setup is limited to:
- Database migrations (run once per test suite, rolled back between tests via `RefreshDatabase` or `DatabaseTransactions`)
- Seed data for reference records that don't change (e.g., the 3 stores, 13 categories)
- Factory definitions for test-specific records

Never share mutable state between tests.

---

## 2. Test Environment

| Environment | Database | Redis | Queue | Purpose |
|-------------|----------|-------|-------|---------|
| `testing` | SQLite (:memory:) | `null` driver (array cache) | `sync` driver | Unit + Feature tests — fast, isolated |
| `e2e` | SQLite (file) | `null` driver | `sync` driver | Playwright — persistent between request but reset per suite |
| `local` | SQLite (file) | Local Redis | `database` fallback | Developer manual testing |

Redis is not available in CI test environments. The application must degrade gracefully:
- Cache driver falls back to `array` when Redis is unavailable
- Queue driver falls back to `sync` when Redis is unavailable
- Session driver falls back to `database` when Redis is unavailable

These fallbacks are configured per-environment in `.env.testing` and asserted by dedicated infrastructure tests.

---

## 3. Backend Testing (PHPUnit)

### Framework & Configuration

- **Framework**: PHPUnit 11.x (ships with Laravel 11)
- **Base test case**: `Tests\TestCase` extends `Illuminate\Foundation\Testing\TestCase`
- **Trait**: `RefreshDatabase` for feature tests, `DatabaseTransactions` for integration tests that need DB state
- **Assertions**: PHPUnit assertions + Laravel test response assertions (`assertStatus`, `assertJson`, `assertJsonStructure`, `assertDatabaseHas`)
- **Factories**: Laravel model factories for all 20 entities
- **Seeders**: `DatabaseSeeder` and domain-specific seeders
- **Mocking**: PHPUnit `createMock` / `getMockBuilder` for service dependencies; `Queue::fake()` for queueable jobs; `Event::fake()` for events

### 3.1 Unit Tests — Deep Modules

These are the highest-value tests. Each deep module is tested in complete isolation with mocked dependencies.

#### DispatchServiceTest

**Interface:** `dispatch(Order $order): DispatchResult`

**Test Scenarios:**

| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Closest store has available Rider → assigned to that store's closest Rider | Order with delivery coords near Store A; Store A has available Riders | `DispatchResult` with `store_id = A`, `rider_id = nearest`, status = `dispatched` |
| 2 | Closest store has no available Riders → fallback to next store | Order near Store A; Store A has 0 available Riders; Store B has available Riders | `DispatchResult` with `store_id = B`, status = `dispatched` |
| 3 | All stores exhausted → order cancelled | No store has available Riders within delivery radius | `DispatchResult` with `status = cancelled`, reason = no_available_riders |
| 4 | Delivery address outside all store delivery radii → cancelled | Order far from every store | `DispatchResult` with `status = cancelled`, reason = out_of_range |
| 5 | No active stores at all → cancelled | All stores have `is_active = false` | `DispatchResult` with `status = cancelled`, reason = no_active_stores |
| 6 | Store with available Rider but rider's max_radius_km too small | Rider at Store A has max_radius 5km but delivery is 8km away | Rider excluded; falls back to next Rider/store |
| 7 | Dispatch latency recorded in metadata | Successful dispatch | `claim_latency_seconds` present in activity log metadata |
| 8 | Dispatch algorithm prefers nearest store (not first found) | Both Store A (2km) and Store B (10km) have available Riders | Store A selected |

**Dependencies mocked:**
- `StoreRepository` (returns stores with coordinates, active status)
- `RiderRepository` (returns available riders per store with max radius)
- `HaversineService` (or tested together if pure)
- `OrderRepository` (for updating order state)

#### PricingServiceTest

**Interface:** `effectivePrice(Product $product, ?Collection $specials): Price`

**Test Scenarios:**

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | Product has no sale_price and no active specials | `sale_price = null`, no specials | Returns `product.price` |
| 2 | Product has sale_price set (no specials) | `sale_price = 25.00`, `price = 40.00` | Returns `25.00` |
| 3 | Product belongs to active collection special (no sale_price) | `sale_price = null`, special has discount | Returns special-adjusted price |
| 4 | Product has BOTH sale_price AND collection special | `sale_price = 25.00`, special discount would give 30.00 | Returns `25.00` (product-level wins) |
| 5 | Product belongs to expired special | Special's end_date in the past | Returns `product.price` |
| 6 | Product belongs to future special | Special's start_date in the future | Returns `product.price` |
| 7 | Product belongs to multiple active specials | 2 active specials | Lowest price wins |

**Pure function test** — no dependencies to mock. Just instantiate with product/specials data.

#### OrderStateMachineTest

**Interface:** `transition(Order $order, string $newStatus, ?User $actor): ActivityLogEntry`

**Valid Transitions (happy path):**

| # | From | To | Actor |
|---|------|----|-------|
| 1 | pending | confirmed | System (actor=null) |
| 2 | confirmed | preparing | Rider (rider_assigned event) |
| 3 | preparing | out_for_delivery | Rider |
| 4 | out_for_delivery | delivered | Rider |
| 5 | delivered | (no transition) | Terminal state |

**Cancellation (valid from most states):**

| # | From | To | Actor |
|---|------|----|-------|
| 6 | pending | cancelled | Customer |
| 7 | confirmed | cancelled | Customer |
| 8 | preparing | cancelled | System (timeout) |
| 9 | Any | cancelled | System (all stores exhausted) |

**Invalid transitions (must throw/return error):**

| # | From | To | Reason |
|---|------|----|--------|
| 10 | delivered | preparing | Already delivered |
| 11 | cancelled | confirmed | Already cancelled |
| 12 | pending | out_for_delivery | Must go through confirmed + preparing |
| 13 | pending | delivered | Jumping states |
| 14 | delivered | cancelled | Cannot cancel after delivery |

**Side effects NOT tested here** (verified in feature tests):
- Queueing dispatch job
- Sending notifications
- Updating rider stats

**Assertions per test:**
- Order status is updated in database
- Activity log entry is created with correct `old_status`, `new_status`, `event_type`, `user_id`
- Activity log has a `created_at` timestamp
- `metadata` contains relevant context (e.g., `reason` for cancellations)

#### HaversineServiceTest

**Interface:** `distance(float $lat1, float $lng1, float $lat2, float $lng2): float`

**Test Scenarios:**

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | Same point (zero distance) | Same lat/lng | `0.0` |
| 2 | Known distance between two cities | Durban (-29.8587, 31.0218) to Pinetown (-29.8175, 30.8500) | ~18.5 km (±0.5 km tolerance) |
| 3 | North-to-south (meridian) | (0, 0) to (1, 0) | ~111 km |
| 4 | Equatorial | (0, 0) to (0, 1) | ~111 km |
| 5 | Antipodal (opposite sides) | (0, 0) to (0, 180) | ~20015 km (half circumference) |
| 6 | Very close points (centimeter precision) | Same building, 10m apart | ~0.01 km |

**Pure function** — no dependencies. Test precision with `assertEqualsWithDelta(0.5)`.

#### CartSyncServiceTest

**Interface:** `mergeGuestCart(array $guestItems, User $user): Cart`

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | Guest cart empty, user has no existing cart | Empty array, user with no cart | Empty cart returned |
| 2 | Guest cart has items, user has no cart | `[{product_id: 1, quantity: 2}]` | Cart created with those items |
| 3 | Guest cart has items, user has existing cart with different items | Guest: `[{product_id: 1, qty: 2}]`, User: `[{product_id: 2, qty: 1}]` | Merged: both items in cart |
| 4 | Same product in both guest and user cart | Guest: `[{product_id: 1, qty: 2}]`, User: `[{product_id: 1, qty: 3}]` | Higher quantity (3) wins |
| 5 | Guest cart product no longer available/active | Guest item with `is_active = false` product | Item removed, noted in metadata |
| 6 | Guest cart product no longer exists (deleted) | Guest item with non-existent product_id | Item silently removed |
| 7 | Guest cart has quantity > max allowed | Guest item with qty 99 | Capped at max (e.g., 8) |

#### GamificationServiceTest

**Interface:** `awardXp(Rider $rider, string $event, array $metadata): GamificationResult`

| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | First delivery completed | Rider with 0 XP, event=delivery_completed | XP increases, level still 1 |
| 2 | XP crosses level-up threshold | Rider with 19 XP, award 5 XP | Level 1 → 2, XP becomes 24, 4 toward next level |
| 3 | Multiple level-ups at once | Rider with 0 XP, award 50 XP | Level 1 → 3 (20+20), XP 10 toward next |
| 4 | Badge awarded on milestone | 1st delivery | `first_delivery` badge awarded |
| 5 | 100th delivery badge | 100 deliveries | `century` badge awarded |
| 6 | Same badge not awarded twice | Rider already has `first_delivery` badge | No duplicate badge |
| 7 | Event type not recognized | Unknown event type | No XP change, no error |

### 3.2 Feature Tests — API Contract Tests

Feature tests verify the HTTP interface: request → response, status codes, JSON structure, auth gating, role-based authorization. These use Laravel's `TestCase` with `RefreshDatabase` and hit real routes.

#### AuthTest

| # | Endpoint | Scenario | Expected |
|---|----------|----------|----------|
| 1 | POST /api/auth/register | Valid customer registration | 201, user created, Sanctum cookie set |
| 2 | POST /api/auth/register | Duplicate email | 422, validation error |
| 3 | POST /api/auth/register | Missing required fields | 422 for each required field |
| 4 | POST /api/auth/register/rider | Valid rider registration with vehicle + banking | 201, rider profile created, user has rider role |
| 5 | POST /api/auth/register/rider | Missing banking_details (mock) | 422 |
| 6 | POST /api/auth/login | Valid credentials | 200, Sanctum cookie returned |
| 7 | POST /api/auth/login | Invalid password | 401 |
| 8 | POST /api/auth/login | Non-existent email | 401 |
| 9 | POST /api/auth/login | Inactive user (is_active=false) | 401, "Account suspended" |
| 10 | POST /api/auth/logout | Authenticated | 204, cookie revoked |
| 11 | POST /api/auth/logout | Unauthenticated | 401 |
| 12 | GET /api/auth/user | Authenticated | 200, user JSON with role |
| 13 | GET /api/auth/user | Unauthenticated | 401 |

#### Role-Based Access Tests

Every endpoint is tested for each role to ensure proper gating:

| # | Endpoint | Role | Expected |
|---|----------|------|----------|
| 1 | POST /api/rider/claim/{order} | Customer | 403 |
| 2 | POST /api/rider/claim/{order} | Rider | 200 (if eligible) |
| 3 | POST /api/rider/claim/{order} | Store Manager | 403 |
| 4 | GET /api/admin/products | Developer | 200 |
| 5 | GET /api/admin/products | Customer | 403 |
| 6 | GET /api/admin/products | Rider | 403 |
| 7 | PATCH /api/store/orders/{id}/status | Store Manager | 200 |
| 8 | PATCH /api/store/orders/{id}/status | Logistics Officer | 200 |
| 9 | PATCH /api/store/orders/{id}/status | Rider | 403 |

#### Product & Catalog Tests

| # | Endpoint | Scenario | Expected |
|---|----------|----------|----------|
| 1 | GET /api/products | No filters | 200, paginated product list |
| 2 | GET /api/products?category=snacks | Filter by category slug | 200, only snacks |
| 3 | GET /api/products?is_featured=1 | Featured products | 200, only featured |
| 4 | GET /api/products?search=chips | Search by name | 200, matching products |
| 5 | GET /api/products?search=braai | Search by tag | 200, products with "braai" tag |
| 6 | GET /api/products/{slug} | Valid product | 200, full product JSON |
| 7 | GET /api/products/{slug} | Non-existent slug | 404 |
| 8 | GET /api/products/{slug} | Inactive product | 404 (not exposed) |

#### Order Lifecycle Tests (Full Feature Tests)

These test the complete flow through the API:

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Place order as authenticated customer | Login → POST /api/orders with cart items | 201, order with status=pending |
| 2 | Place order with empty cart | POST /api/orders with no items | 422 |
| 3 | Place order with unavailable product | Cart contains product with `is_available=false` at closest store | 422, error message |
| 4 | View order history | Authenticated customer with 3 past orders | 200, paginated list |
| 5 | View order detail | Authenticated customer | 200, order with items + timeline |
| 6 | View another customer's order | Customer A tries to view Customer B's order | 403 |
| 7 | Cancel order while pending | Customer cancels pending order | 200, status=cancelled |
| 8 | Cancel order after dispatched | Customer tries to cancel preparing order | 422, cannot cancel |

#### Dispatch & Claim Tests

| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Two Riders attempt to claim same order simultaneously | Concurrent requests | Exactly one succeeds (200), one fails (409) |
| 2 | Rider claims order from another store | Rider at Store A claims order assigned to Store B | 422 |
| 3 | Rider claims already-claimed order | Rider B tries to claim order already claimed by Rider A | 409 |
| 4 | Rider marks items bought | Rider claims → marks items bought | Stock decremented in `store_product`, activity logged |
| 5 | Rider marks complete lifecycle | claim → items_bought → out_for_delivery → delivered | Status chain correct, all 4 activity logs created |
| 6 | Customer confirms delivery | Rider marks delivered → Customer confirms | payment_status→paid, review prompt |

#### Content & Admin CRUD Tests

Standard CRUD patterns for each content entity:
- Test `GET /api/recipes` (public, active only)
- Test `POST /api/admin/recipes` (admin only, validation)
- Test `PUT /api/admin/recipes/{id}` (admin only)
- Test `DELETE /api/admin/recipes/{id}` (admin only, soft delete)
- Same pattern for: categories, products, specials, community_posts, careers, contact_messages

Each CRUD test verifies:
- Authorization (correct role required)
- Validation (required fields, field types, uniqueness)
- Response structure (consistent JSON envelope)
- Database state (assertDatabaseHas, assertDatabaseMissing)
- Soft delete behavior (deleted_at set, not actually removed)

### 3.3 Database / Migration Tests

| # | Scenario | Assertion |
|---|----------|-----------|
| 1 | All migrations run without error | `php artisan migrate --force` exits 0 |
| 2 | All foreign keys are valid | Insert violates FK → integrity constraint violation |
| 3 | Unique indexes enforced | Duplicate insert violates unique constraint |
| 4 | Default values applied | Insert without optional fields → defaults present |
| 5 | JSON columns accept valid JSON | Insert with JSON → stored and retrievable |
| 6 | Soft delete works | Delete → `deleted_at` set, record excluded from queries |
| 7 | Rollback all migrations | `php artisan migrate:rollback` → no migrations remain |

### 3.4 Redis Fallback Tests

| # | Scenario | Setup | Assertion |
|---|----------|-------|-----------|
| 1 | Cache falls back to array when Redis unavailable | `CACHE_DRIVER=array` | Application functions, cache operations complete |
| 2 | Queue falls back to sync when Redis unavailable | `QUEUE_CONNECTION=sync` | Jobs execute synchronously |
| 3 | Session falls back to database when Redis unavailable | `SESSION_DRIVER=database` | Login still works, session persists |

---

## 4. Frontend Testing (Vitest + Playwright)

### Framework & Configuration

- **Unit/Integration**: Vitest (Vite-native test runner, matches Jest API)
- **E2E**: Playwright v1.62.0 (cached in `.opensrc`)
- **Component testing**: Vitest + React Testing Library for component behavior
- **Store testing**: Vitest with Zustand stores (no DOM needed)

### 4.1 Zustand Store Tests (Vitest)

#### Auth Store

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Store initializes with unauthenticated state | `user = null`, `isAuthenticated = false` |
| 2 | Login action sets user state | `login(credentials)` → `user` populated, `isAuthenticated = true` |
| 3 | Logout action clears state | `logout()` → `user = null`, `isAuthenticated = false` |
| 4 | Role is accessible from store | `user.role` returns the correct role enum |
| 5 | Login with invalid credentials returns error | Error state updated, user remains null |
| 6 | Session restore on page load | `checkAuth()` → if cookie valid, user populated |

#### Cart Store

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Store initializes with empty cart | `items = []`, `total = 0`, `itemCount = 0` |
| 2 | Add new product to cart | `addItem(product, 2)` → item added, `itemCount = 1` |
| 3 | Add existing product increments quantity | Second `addItem(product, 1)` → quantity becomes 3 |
| 4 | Add product caps at max quantity | `addItem(product, 99)` → quantity capped at 8 |
| 5 | Remove item reduces quantity | `removeItem(productId)` → decrements |
| 6 | Remove item at quantity 1 removes it entirely | `removeItem(productId)` when qty=1 → item removed |
| 7 | Update item quantity directly | `updateQuantity(productId, 5)` → quantity = 5 |
| 8 | Clear cart removes all items | `clearCart()` → `items = []` |
| 9 | Total calculated correctly | `items` sum of `price * qty` = `total` |
| 10 | Persist middleware saves to localStorage | After add, localStorage has serialized cart |
| 11 | Hydrate from localStorage on init | Page load reads localStorage into state |
| 12 | Guest → logged in sync triggers | `syncToServer()` called on auth change |

#### Order Tracking Store

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Fetch orders returns history | `fetchOrders()` → `orders` populated |
| 2 | Fetch single order detail | `fetchOrder(id)` → `currentOrder` set |
| 3 | Polling updates order status | Poll interval detects status change → store updated |
| 4 | Order timeline sorted chronologically | Timeline entries in ascending order |

### 4.2 Component Tests (Vitest + React Testing Library)

Focus on behavior, not styling. Test what the user sees and interacts with.

| # | Component | Scenario | Assertion |
|---|-----------|----------|-----------|
| 1 | ProductCard | Renders with all fields | Shows name, price, unit, image, add-to-cart button |
| 2 | ProductCard | Shows sale price with strikethrough | `sale_price` present → sale price visible, original struck through |
| 3 | ProductCard | Add to cart triggers store action | `addItem` called with correct product |
| 4 | ProductCard | Quantity control after adding | Shows `[–] 2 [+]` instead of add button |
| 5 | CartDrawer | Empty state | Shows "Your cart is empty" + illustration |
| 6 | CartDrawer | Items display correctly | Each item shows name, qty, unit price, total |
| 7 | CartDrawer | Checkout button disabled below minimum | Total < minimum → disabled button with message |
| 8 | OrderTimeline | Renders events in order | Events appear in ascending chronological order |
| 9 | OrderTimeline | Each event has icon and timestamp | Icon + relative time displayed |
| 10 | AvailabilityToggle | Toggle calls API | Click calls endpoint, updates UI |
| 11 | AvailabilityToggle | Shows pulsing green dot when available | CSS class changes based on state |
| 12 | StarRating | Click selects rating | Click 3rd star → rating = 3, highlights correct stars |
| 13 | SearchBar | Debounce search input | Input pauses 300ms before making API call |
| 14 | CategoryGrid | Renders categories from data | Categories appear as clickable cards with icons |

### 4.3 Playwright E2E Tests

E2E tests cover critical user journeys — the paths that generate revenue and the most likely failure points. These are the safety net.

**Test Setup:**
- Laravel backend runs on `http://localhost:8000`
- Next.js frontend runs on `http://localhost:3000`
- Database seeded with deterministic demo data before each suite
- Test runner waits for both servers to be ready

#### Journey 1: Guest Browse → Cart → Register → Checkout

```
1. Visit homepage
2. Hero carousel is visible and auto-advances
3. Category grid shows 13 categories
4. Click a category → products page filtered
5. Click a product → detail page
6. Add to cart as guest (quantity control appears)
7. Navigate to cart → items visible
8. Click "Checkout" → prompted to login/register
9. Register as new customer
10. Cart preserved after registration (guest cart synced)
11. Enter delivery address, place order
12. Order confirmation shown with order number
```

**Assertions:**
- Each page loads without console errors
- Cart persists through page navigation
- Guest cart syncs after registration
- Order confirmation shows correct total and items

#### Journey 2: Rider Claim → Deliver → Complete

```
1. Logistics Officer confirms order (or auto-dispatch)
2. Rider logs in → dashboard shows available orders
3. Rider claims order → moves to active deliveries
4. Rider marks items as bought
5. Rider marks out for delivery
6. Rider marks delivered
7. Customer logs in → sees "delivered" status
8. Customer confirms delivery → can rate Rider
9. Customer submits rating + review
10. Rider dashboard → XP increased, delivery count incremented
```

**Assertions:**
- Atomic claim: second Rider gets "already claimed" error
- Activity log has entries for each step
- Rider XP increments correctly after delivery

#### Journey 3: Admin Full CRUD

```
1. Admin logs in → dashboard loads
2. Navigate to products → create new product
3. Product appears in public catalog
4. Edit product name → update reflected on public page
5. Soft delete product → product hidden from public
6. Navigate to categories, specials, recipes, community posts → each CRUD works
7. View contact messages inbox
```

**Assertions:**
- Each CRUD operation succeeds
- Changes reflect publicly (catalog page shows new product)
- Soft deleted items are hidden from public

#### Journey 4: Dispatch Failover

```
1. Set all Riders at Store A to unavailable
2. Place order with delivery address near Store A
3. System should cascade to Store B
4. Order shows Store B as fulfilling store
5. Set Store B Riders unavailable too
6. Place another order → cascades to Store C
7. Set all Riders unavailable everywhere
8. Place order → order cancelled with "no available riders"
```

**Assertions:**
- Store failover works correctly
- Cancelled order shows correct reason in timeline

### 4.4 Visual Regression Tests (Playwright)

For key pages, capture screenshots and compare against baselines:

| Page | Viewport | Key Check |
|------|----------|-----------|
| Homepage (hero) | 1920x1080 | Hero carousel, category grid alignment |
| Homepage (hero) | 375x667 | Mobile layout, hamburger menu |
| Products listing | 1920x1080 | Product card grid, no layout shift |
| Product detail | 1920x1080 | Image, price, add-to-cart layout |
| Cart | 1920x1080 | Item list, totals, checkout button |
| Store Finder | 1920x1080 | Leaflet map renders, store cards visible |
| Rider Dashboard | 1920x1080 | Availability toggle, order lists |
| Mobile Navigation | 375x667 | Menu opens, all links navigable |

---

## 5. CI/CD Integration (GitHub Actions)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: pdo, sqlite, bcmath, ctype, json, mbstring, openssl, tokenml, xml
      
      - run: composer install --no-interaction --prefer-dist
      - run: cp .env.testing .env
      - run: php artisan key:generate
      - run: php artisan migrate --force
      - run: php artisan test --parallel

  frontend-unit:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - run: npm ci
      - run: npm run test:unit

  e2e:
    runs-on: ubuntu-latest
    needs: [backend, frontend-unit]
    defaults:
      run:
        working-directory: frontend
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

---

## 6. Test Definitions Quick Reference

### What Each Test Layer Covers

| Layer | What we test | What we don't test | Tools |
|-------|-------------|-------------------|-------|
| Unit (Services) | Business logic in isolation, all branches | IO, database, network | PHPUnit |
| Unit (Stores) | State transitions, persistence, computed values | API calls, DOM rendering | Vitest |
| Unit (Components) | Render behavior, event handlers, conditional display | Visual appearance, animations | Vitest + RTL |
| Integration (API) | Request/response, auth, validation, role gating | Internal service implementation | PHPUnit Feature |
| Integration (DB) | Migrations, FKs, indexes, constraints | Query performance | PHPUnit |
| E2E (Browser) | Full user journeys, multi-step flows, error handling | Individual component unit behavior | Playwright |
| Visual (Browser) | Layout consistency, responsive design | Dynamic content changes | Playwright |

### Test Doubles Strategy

| Dependency | Unit Tests | Feature Tests | E2E |
|------------|-----------|---------------|-----|
| Database | Mocked repository | SQLite (RefreshDatabase) | SQLite (seeded) |
| Redis | Mocked cache/queue | Array cache, sync queue | Array cache, sync queue |
| External APIs | Mocked HTTP client | Mocked HTTP client | Mocked HTTP client |
| Laravel Queue | `Queue::fake()` | `Queue::fake()` | Sync driver |
| Laravel Events | `Event::fake()` | `Event::fake()` | Real |
| Laravel Mail | `Mail::fake()` | `Mail::fake()` | Log driver |
| Next.js API proxy | N/A | N/A | Real proxy (servers running) |

### Coverage Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Deep module line coverage | 100% | DispatchService, PricingService, StateMachine, Haversine |
| API endpoint coverage | 100% | Every route tested for success + auth failure |
| Zustand store branch coverage | 100% | Every action and selector |
| Component coverage | 80%+ | Key interactive components only |
| E2E journey coverage | 4 critical journeys | Browse→checkout, Rider lifecycle, Admin CRUD, Dispatch failover |
| Overall backend line coverage | 90%+ | Excluding config, routes, views |
| Overall frontend line coverage | 70%+ | Excluding page files (tested via E2E) |

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Redis unavailable in CI | Fallback drivers configured in `.env.testing`; infrastructure tests verify graceful degradation |
| Concurrent dispatch race conditions | Unit test with mocked concurrent access; Playwright cannot simulate true DB concurrency — covered at integration level |
| SQLite ↔ PostgreSQL differences | All schema uses SQLite-compatible types; no PostGIS, no native JSON enforcement; separate CI job for PostgreSQL in future |
| Flaky E2E tests | Retry failed tests once; Playwright's `auto-waiting` handles most timing issues; `page.waitForSelector` for explicit waits |
| Test data collisions between parallel tests | `RefreshDatabase` per test class; factories use `Sequence` for unique data |
