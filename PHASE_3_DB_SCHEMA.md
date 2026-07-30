# Checkstar — Phase 3: Database Schema Design

**Date:** 2026-07-30
**Branch:** `phase_3_db`
**Designed from:** DB architect + UX designer + UI designer (concurrent)

---

## Design Principles

1. **Schema enforces business rules** — Same pricing structurally enforced (price on `products`, not per-store). Stock on `store_product` pivot only.
2. **Status independence** — `orders.status` and `orders.payment_status` are independent columns enforced in application logic, not DB constraints.
3. **Snapshot pattern** — `order_items` freezes product data + price at time of order so historical records survive catalog changes.
4. **Append-only audit** — `order_activity_logs` is never mutated; every state transition is recorded immutably.
5. **Atomic dispatch** — Rider claiming uses `FOR UPDATE SKIP LOCKED` at the application/query level.
6. **JSON for flexibility** — `tags`, `trading_hours`, `product_snapshot`, `metadata`, `banking_details` use JSON columns where structure varies per record.
7. **SQLite-first** — All column types are SQLite-compatible (no PostGIS, no array columns, no native JSON type enforcement — enforced in app).
8. **Referential integrity over convenience** — Foreign keys reference the domain-correct table even if it adds one join. `orders.rider_id` FK → `riders.id` (not `users.id`) so the schema itself guarantees only actual Rider profiles are assignable. Same for `reviews.rider_id`.
9. **Denormalized counters with source-of-truth** — `riders.total_deliveries`, `riders.average_rating`, `riders.xp` are cached aggregates recalculated from canonical data (`reviews`, `order_activity_logs`). This is an intentional data-science-informed trade-off: read-optimized aggregates on the hot path, rebuildable from append-only source tables at any time. No trigger-based sync; recalculation is handled in application service layer.
10. **Redis for performance and reliability** — Redis handles cache, session storage, and queue backpressure. Dispatch retry polling uses Redis-backed queues to survive process restarts. Gamification events (XP, badges) are dispatched as queued jobs. Active Rider locations cached in Redis with TTL for live tracking without hitting the DB. Cache-aside pattern for product catalog and specials on the public-facing storefront.

---

## Entity-Relationship Map

```
users ──┬──> stores (owner_id)
        ├──> store_staff (user_id)
        ├──> riders (user_id)
        ├──> orders (customer_id)
        ├──> reviews (reviewer_id)
        ├──> transactions (user_id)
        ├──> order_activity_logs (user_id)
        └──> contact_messages (user_id nullable)

stores ──┬──> store_product (store_id)
         ├──> orders (store_id)
         ├──> store_staff (store_id)
         └──> riders (store_id)

categories ──> products (category_id)

products ──┬──> store_product (product_id)
           ├──> order_items (product_id)
           └──> product_special (product_id)

specials ──> product_special (special_id)

orders ──┬──> order_items (order_id)
         ├──> order_activity_logs (order_id)
         ├──> transactions (order_id)
         └──> riders (rider_id)

riders ──┬──> rider_locations (rider_id)
         ├──> rider_badges (rider_id)
         ├──> reviews (rider_id)
         └──> orders (rider_id) — FK from orders.rider_id, NOT users.id
```

---

## 1. `users` — Everyone on the platform

### UX Designer Note
The registration flow forks here: **Customer** signs up with just name + email + password + phone. **Rider** signs up separately (separate form) with extra fields stored in the `riders` table. A Rider who wants to shop creates a _separate_ Customer account — this is a business requirement, not a technical limitation. The role badge on the UI shows which persona is active; there's no "switch role" toggle.

### UI Designer Note
- Role determines the sidebar/menu layout: 3 distinct layouts (Admin/Staff, Customer, Rider)
- `avatar` drives the profile circle top-right; if null, show initials in a `motion.div` with the brand orange background
- `is_active = false` → disabled login, show "Account suspended" message with a motion fade-in

### Schema

| Column | Type | Constraints | Why |
|--------|------|-------------|-----|
| id | bigIncrements | PK | Laravel default |
| name | string(255) | NOT NULL | Displayed on profile, order confirmation, reviews |
| email | string(255) | UNIQUE, NOT NULL | Login credential, receipt delivery |
| password | string(255) | NOT NULL | Bcrypt hashed (Laravel default) |
| role | enum('developer','store_owner','store_manager','logistics_officer','customer','rider') | NOT NULL, INDEX | Single role per user — drives auth gating, layout, available routes |
| phone | string(20) | NULLABLE | Contact for dispatch, order confirmations |
| avatar | string(255) | NULLABLE | Profile image path |
| email_verified_at | timestamp | NULLABLE | For future email verification flow |
| is_active | boolean | DEFAULT true, INDEX | Soft block without deleting; suspended accounts |
| remember_token | string(100) | NULLABLE | Sanctum + "remember me" |
| timestamps | created_at, updated_at | | Standard |
| softDeletes | deleted_at | NULLABLE | Account removal without data loss |

**Indexes:** `(role)`, `(role, is_active)`, `(email)` (unique implicit)

---

## 2. `stores` — The 3 physical locations

### UX Designer Note
Each store is both a retail location AND a fulfillment hub. The Store Finder page shows all 3 on a Leaflet map with cards. During checkout, the system auto-selects the optimal store based on: (1) closest to delivery address, (2) has available Riders, (3) within a configurable fallback threshold. The user never manually picks a store for delivery — it's invisible logic. For browsing, products show the same price regardless of store.

### UI Designer Note
- `trading_hours` JSON renders as an organized table/list on the store card and Store Finder detail
- `delivery_radius_km` is displayed as "Delivers within X km of [store area]"
- `image` is the hero photo on the store card; `logo` is the small badge
- Store cards animate in with `motion.div` staggered entrance, `whileHover` scale effect
- The Leaflet map markers use custom Checkstar-branded icons

### Schema

| Column | Type | Constraints | Why |
|--------|------|-------------|-----|
| id | bigIncrements | PK | |
| name | string(255) | NOT NULL | Store display name |
| slug | string(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| description | text | NULLABLE | "About this store" blurb |
| address | string(255) | NOT NULL | Street address for store finder |
| city | string(100) | NOT NULL | Durban, etc. |
| province | string(100) | NOT NULL | KwaZulu-Natal |
| postal_code | string(20) | NOT NULL | |
| latitude | decimal(10,7) | NOT NULL | Map marker + Haversine dispatch queries |
| longitude | decimal(10,7) | NOT NULL | Map marker + Haversine dispatch queries |
| delivery_radius_km | decimal(5,2) | DEFAULT 10 | How far this store delivers (configurable per store) |
| phone | string(20) | NOT NULL | Displayed on store cards |
| email | string(255) | NULLABLE | Store-specific contact |
| trading_hours | json | NULLABLE | `{"monday": {"open": "07:00", "close": "20:00"}, ...}` |
| logo | string(255) | NULLABLE | Small brand mark for cards |
| image | string(255) | NULLABLE | Hero photo for the store detail |
| is_active | boolean | DEFAULT true | Hide store if closed permanently |
| owner_id | unsignedBigInteger | FK -> users.id, NULLABLE | The `users.role` must be `store_owner` (enforced in app layer) |
| timestamps | | | |
| softDeletes | | | Store closure without data loss |

**Indexes:** `(latitude, longitude)`, `(is_active)`, `(slug)`, `(city, name)` (unique composite — prevents duplicate store names in the same city)

---

## 3. `store_staff` — Store managers & logistics officers

### UX Designer Note
Store Managers see only their store's dashboard (orders, inventory, staff). Logistics Officers can monitor all stores for dispatch oversight. This table assigns those roles to specific stores. A logistics officer can be assigned to multiple stores if needed, or you can leave `store_id` interpretation flexible at the app layer.

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| store_id | unsignedBigInteger | FK -> stores.id, NOT NULL |
| user_id | unsignedBigInteger | FK -> users.id, NOT NULL |
| role | enum('store_manager','logistics_officer') | NOT NULL |
| timestamps | | |

**Unique:** `(store_id, user_id)`, `(user_id)` — a staff member is assigned to exactly one store
**Indexes:** `(user_id)`, `(store_id)`

---

## 4. `categories` — 13 product departments

### UX Designer Note
The Home page shows a 4×something grid of category icons (inspired by the Flutter Grocery App pattern). Tapping a category filters the Products page to that department. Each category has an icon (for the grid) and an image (for the category hero on the products listing). Sort order controls grid sequence.

### UI Designer Note
- `icon` renders as a branded icon in the category grid tile (motion.div with staggered entrance, whileHover scale + color shift)
- `image` is a full-width hero background on the category's filtered product listing page
- Category cards use motion.div with `whileInView` reveal on scroll

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| name | string(255) | NOT NULL |
| slug | string(255) | UNIQUE, NOT NULL |
| description | text | NULLABLE |
| image | string(255) | NULLABLE |
| icon | string(255) | NULLABLE |
| sort_order | integer | DEFAULT 0 |
| is_active | boolean | DEFAULT true |
| timestamps | | |

**Indexes:** `(sort_order)`, `(is_active)`

---

## 5. `products` — Global catalog (same prices everywhere)

### UX Designer Note
Products exist once in the catalog. Price is set here (same across all stores — **structurally enforced** by not having price on the pivot). Each product belongs to exactly one category. `tags` is a JSON array for cross-cutting groupings (e.g. "braai", "lunchbox", "organic") that works like secondary categories without a separate hierarchy. `sale_price` at the product level takes priority over any collection special the product belongs to.

### UI Designer Note
- Product cards show: image, name, unit, price (or sale_price with strikethrough original), discount badge, add-to-cart button
- `images` JSON supports multiple images for a future gallery on the product detail page
- `unit` renders as " / kg", " / each", " / 2L" next to the price
- `is_featured = true` products appear in the "Best Deals" horizontal scroll section on Home
- Tags show as small pills/badges on the product detail page
- Motion: product cards stagger in, `whileHover` lifts card, add-to-cart button has spring feedback

### Schema

| Column | Type | Constraints | Why |
|--------|------|-------------|-----|
| id | bigIncrements | PK | |
| category_id | unsignedBigInteger | FK -> categories.id, NOT NULL, INDEX | Category filter queries |
| name | string(255) | NOT NULL | Product display name |
| slug | string(255) | UNIQUE, NOT NULL | URL for product detail |
| description | text | NULLABLE | Long-form for detail page |
| image | string(255) | NULLABLE | Primary product photo |
| images | json | NULLABLE | `["img1.jpg", "img2.jpg"]` for future gallery |
| unit | string(50) | NOT NULL | "each", "kg", "2L", "500g", "pack", "dozen" |
| price | decimal(10,2) | NOT NULL | Regular price (same everywhere — structural) |
| sale_price | decimal(10,2) | NULLABLE | Product-level special; overrides collection specials |
| tags | json | NULLABLE | `["braai", "lunchbox"]` for secondary groupings |
| is_featured | boolean | DEFAULT false, INDEX | Homepage "Best Deals" section |
| is_active | boolean | DEFAULT true, INDEX | Soft hide without delete |
| sort_order | integer | DEFAULT 0 | Category-level ordering |
| timestamps | | | |
| softDeletes | | | Product removal without breaking order history |

**Indexes:** `(category_id)`, `(is_featured)`, `(is_active)`, `(sale_price)` (non-null = on sale)

---

## 6. `store_product` — Per-store stock (not price)

### UX Designer Note
Stock is tracked per store because each physical location has its own shelves. Price is NOT here — it's on `products` (enforcing same-pricing rule at schema level). Stock decrements when a Rider marks items as bought at the store (not at order placement), because the Rider physically picks items off the shelf.

### UI Designer Note
- `is_available = false` → grey out the product card with "Currently unavailable at your store" overlay
- Stock level is NOT shown to customers (no "only 3 left" — that's an operations concern, not a browsing concern)
- Available to logistics officers in the admin dashboard

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| store_id | unsignedBigInteger | FK -> stores.id, NOT NULL |
| product_id | unsignedBigInteger | FK -> products.id, NOT NULL |
| stock_quantity | integer | DEFAULT 0 |
| is_available | boolean | DEFAULT true |
| timestamps | | |

**Unique:** `(store_id, product_id)` — one stock record per product per store
**Indexes:** `(store_id, is_available)`, `(product_id)`

---

## 7. `specials` — Collection specials (themed groups)

### UX Designer Note
A collection special is a marketing grouping like "Winter Warmers" or "Braai Day Special". It has a banner image and a date range. Products are linked via the pivot table. The Collection Special page shows all products in that group. When a product has BOTH its own `sale_price` AND belongs to a Collection Special, the product-level `sale_price` wins (business rule).

### UI Designer Note
- `banner_image` is the hero for the specials page — full-width with overlay text
- The specials page uses `motion.div` staggered cards with `whileInView` reveal
- Each card shows the product info with the sale price (or regular price if only in the collection)

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| title | string(255) | NOT NULL |
| slug | string(255) | UNIQUE, NOT NULL |
| description | text | NULLABLE |
| banner_image | string(255) | NULLABLE |
| start_date | datetime | NOT NULL |
| end_date | datetime | NOT NULL |
| is_active | boolean | DEFAULT true |
| sort_order | integer | DEFAULT 0 |
| timestamps | | |

**Indexes:** `(start_date, end_date)`, `(is_active)`

---

## 8. `product_special` — Products in a collection special

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| product_id | unsignedBigInteger | FK -> products.id, NOT NULL |
| special_id | unsignedBigInteger | FK -> specials.id, NOT NULL |
| timestamps | | |

**Unique:** `(product_id, special_id)`

---

## 9. `orders` — Customer purchase requests

### UX Designer Note
This is the core of the delivery system. The order lifecycle is:
`pending → confirmed → preparing → out_for_delivery → delivered`
→ `cancelled` (from most states)

Payment status runs independently: `pending → paid → refunded`

A Customer sees their order as a timeline card (powered by `order_activity_logs`). A Rider sees it as a claimable job. A Store Manager sees it as a fulfillment task.

### UI Designer Note
- Order cards show: order number, status badge (color-coded via Tailwind), item count, total, rider name (if assigned), timeline
- Status badges use motion.div for color transitions between states:
  - `pending` → amber/warning, `confirmed` → blue, `preparing` → indigo, `out_for_delivery` → orange, `delivered` → green, `cancelled` → red/grey
- `payment_status` shown as a separate subtle badge next to the main status
- `rider_rating` and `rider_review` appear after delivery as a 5-star scale with text input
- The order detail page is a vertically scrolling timeline with motion.div entrance animations

### Schema

| Column | Type | Constraints | Why |
|--------|------|-------------|-----|
| id | bigIncrements | PK | |
| order_number | string(20) | UNIQUE, NOT NULL | Human-readable like `CS-20260729-0001` |
| customer_id | unsignedBigInteger | FK -> users.id, NOT NULL, INDEX | Who ordered |
| rider_id | unsignedBigInteger | FK -> riders.id, NULLABLE, INDEX | Who delivered (assigned at claim). References riders.id, NOT users.id — ensures only actual Rider profiles are assignable |
| store_id | unsignedBigInteger | FK -> stores.id, NOT NULL, INDEX | Fulfilling store (selected by dispatch algo) |
| status | enum('pending','confirmed','preparing','out_for_delivery','delivered','cancelled') | NOT NULL, INDEX, DEFAULT 'pending' | Single order lifecycle status |
| payment_status | enum('pending','paid','refunded') | NOT NULL, DEFAULT 'pending' | Independent from order status |
| delivery_address | text | NULLABLE | Customer's delivery address |
| delivery_latitude | decimal(10,7) | NULLABLE | For dispatch proximity + map |
| delivery_longitude | decimal(10,7) | NULLABLE | For dispatch proximity + map |
| delivery_notes | text | NULLABLE | "Leave at gate" etc. |
| subtotal | decimal(10,2) | NOT NULL | Sum of line items before fee |
| delivery_fee | decimal(10,2) | DEFAULT 0 | Calculated at dispatch |
| total | decimal(10,2) | NOT NULL | subtotal + delivery_fee |
| rider_rating | tinyint unsigned | NULLABLE | 1-5, set on customer confirmation |
| rider_review | text | NULLABLE | Text review on confirmation |
| customer_confirmed_at | timestamp | NULLABLE | When customer confirmed delivery |
| timestamps | | | |

**Indexes:** `(customer_id)`, `(rider_id)`, `(store_id)`, `(status)`, `(status, store_id)` (dispatch polling), `(payment_status)`, `(order_number)`

---

## 10. `order_items` — Line items (snapshot pattern)

### UX Designer Note
Each product in an order is frozen at the time of purchase. Even if the product price, name, or image changes later, the order record remains accurate. This is critical for dispute resolution and the Order Activity Log.

### UI Designer Note
- Each item renders as a horizontal card: thumbnail (from snapshot), name, unit, quantity, unit_price, total_price
- `product_snapshot` JSON stores everything needed to render the item even if the product is deleted: `{name, image, unit, slug}`
- Quantity controls (for pre-checkout) use motion.div animated transitions (spring effect on decrement/increment)

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| order_id | unsignedBigInteger | FK -> orders.id, NOT NULL, INDEX |
| product_id | unsignedBigInteger | FK -> products.id, NOT NULL |
| store_product_id | unsignedBigInteger | FK -> store_product.id, NULLABLE |
| quantity | integer unsigned | DEFAULT 1 |
| unit_price | decimal(10,2) | NOT NULL |
| total_price | decimal(10,2) | NOT NULL |
| product_snapshot | json | NOT NULL |
| timestamps | | |

**Indexes:** `(order_id)`

---

## 11. `order_activity_logs` — Append-only audit trail

### UX Designer Note
Every state change on an Order is recorded here — who did what and when. The Customer sees this as their order timeline. Recognized `event_type` values:

| Event | Trigger | Status Effect | Side Effect |
|-------|---------|---------------|-------------|
| `order_placed` | Customer submits order | pending → confirmed | Payment held as pending |
| `order_confirmed` | System accepts | (no status change) | Dispatch triggered |
| `rider_assigned` | Rider claims order | confirmed → preparing | rider_id set on order |
| `items_bought` | Rider marks items as bought at store | (still preparing, sub-event) | `store_product.stock_quantity` decremented per item — the only moment inventory moves |
| `out_for_delivery` | Rider departs store | preparing → out_for_delivery | Delivery timer starts |
| `delivered` | Rider marks delivered | out_for_delivery → delivered | Customer confirmation prompt sent |
| `customer_confirmed` | Customer confirms receipt | (no status change) | `payment_status` → paid, review prompt |
| `cancelled` | Customer, Rider, or System | any → cancelled | Reason in `metadata.reason` |
| `payment_paid` | System after confirmation | (payment change only) | Transaction created (credit) |
| `payment_refunded` | System on cancellation | (payment change only) | Transaction created (debit) |

The Store Manager and Logistics Officer use this for dispute resolution and operational visibility. From a data science perspective, this table is a goldmine: event timestamps enable latency analysis (e.g., "average time from `rider_assigned` to `items_bought` by store" or "dispatch-to-delivery funnel by hour of day").

### UI Designer Note
- Renders as a vertical timeline with icons per event type and connecting lines
- Each entry shows: icon, event_type display name, timestamp (relative like "2 min ago"), user name if applicable
- `metadata` JSON can power additional details shown on expand: "Rider: Thabo M. claimed this order", "Status changed from confirmed → preparing"
- Timeline entries animate in sequentially with `motion.div` stagger (`initial={{ opacity: 0, x: -10 }}` → `animate={{ opacity: 1, x: 0 }}`)

### Schema

| Column | Type | Constraints | Why |
|--------|------|-------------|-----|
| id | bigIncrements | PK | |
| order_id | unsignedBigInteger | FK -> orders.id, NOT NULL, INDEX | |
| user_id | unsignedBigInteger | FK -> users.id, NULLABLE (null = system action) | |
| event_type | string(50) | NOT NULL | |
| old_status | string(50) | NULLABLE | Previous `orders.status` value at transition |
| new_status | string(50) | NULLABLE | New `orders.status` value at transition |
| metadata | json | NULLABLE | Extra context: `{"claim_latency_seconds": 12}`, `{"reason": "out of stock"}` |
| created_at | timestamp | NOT NULL (NO updated_at — this is append-only) |

**Indexes:** `(order_id)`, `(created_at)`, `(order_id, created_at)` (timeline queries)

---

## 12. `riders` — Rider-specific profile + gamification

### UX Designer Note
Riders are Checkstar employees who pick and deliver. They have an `is_available` toggle (visible on their dashboard) that indicates readiness. When available, they appear in the dispatch pool. `banking_details` is mocked for the prototype (JSON with dummy fields). Gamification (XP, level, badges) drives engagement.

### UI Designer Note
- Availability toggle is a prominent switch on the Rider dashboard using motion.div's `layout` prop for smooth container animation
- Rider profile card shows: avatar, name, level badge, XP bar, total deliveries, average rating (stars)
- `is_available` state is color-coded: green (available) / red (unavailable) with pulsing dot indicator via motion.div
- Banking details section is clearly marked "Mock — Not functional" with a muted style

### Schema

| Column | Type | Constraints | Why |
|--------|------|-------------|-----|
| id | bigIncrements | PK | |
| user_id | unsignedBigInteger | FK -> users.id, UNIQUE, NOT NULL | One-to-one with users |
| store_id | unsignedBigInteger | FK -> stores.id, NULLABLE, INDEX | Assigned store (null = unassigned) |
| is_available | boolean | DEFAULT false, INDEX | Dispatch pool flag |
| vehicle_type | string(50) | NULLABLE | "motorbike", "scooter" |
| max_radius_km | decimal(5,2) | DEFAULT 10 | Max delivery distance for this rider |
| latitude | decimal(10,7) | NULLABLE | Current live location |
| longitude | decimal(10,7) | NULLABLE | Current live location |
| banking_details | json | NULLABLE | `{"bank": "Test Bank", "account_number": "123456789", "branch_code": "000000", "account_type": "cheque"}` — mock for prototype; shape enforced in app layer |
| total_deliveries | integer unsigned | DEFAULT 0 | Denormalized counter |
| average_rating | decimal(3,2) | DEFAULT 0 | Denormalized from reviews |
| xp | integer unsigned | DEFAULT 0 | Gamification |
| level | integer unsigned | DEFAULT 1 | Gamification (20 XP per level) |
| suspended_at | timestamp | NULLABLE | Admin suspension without deleting |
| timestamps | | | |

**Indexes:** `(is_available, store_id)` (dispatch query), `(user_id)` (unique implicit)

---

## 13. `rider_locations` — Historical location tracking

### UX Designer Note
For the MVP with polling, this is optional but useful for debugging dispatch behavior. In production (with WebSockets), this powers live Rider tracking on the Customer's order map.

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| rider_id | unsignedBigInteger | FK -> riders.id, NOT NULL |
| latitude | decimal(10,7) | NOT NULL |
| longitude | decimal(10,7) | NOT NULL |
| accuracy | decimal(5,2) | NULLABLE |
| recorded_at | timestamp | NOT NULL |

**Indexes:** `(rider_id, recorded_at)`

---

## 14. `rider_badges` — Gamification achievements

### UX Designer Note
Badges are awarded automatically by the GamificationService when a Rider hits milestones: "First Delivery", "Century (100 deliveries)", "Perfect Week (5★ all week)", "Speed Demon (fastest dispatch acceptance)".

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| rider_id | unsignedBigInteger | FK -> riders.id, NOT NULL |
| badge_type | string(50) | NOT NULL |
| metadata | json | NULLABLE |
| awarded_at | timestamp | NOT NULL |

**Unique:** `(rider_id, badge_type)` — one of each badge per rider
**Indexes:** `(rider_id)`

---

## 15. `reviews` — Customer ratings of Riders

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| order_id | unsignedBigInteger | FK -> orders.id, UNIQUE, NOT NULL |
| reviewer_id | unsignedBigInteger | FK -> users.id, NOT NULL |
| rider_id | unsignedBigInteger | FK -> riders.id, NOT NULL |
| rating | tinyint unsigned | NOT NULL (1-5) |
| comment | text | NULLABLE |
| created_at | timestamp | NOT NULL |

**Unique:** `(order_id)` — one review per order
**Indexes:** `(rider_id)`, `(reviewer_id)`

---

## 16. `transactions` — Financial ledger

### UX Designer Note
All money movements recorded here: customer payments, refunds, rider payouts. In the prototype, payments are mock (no real gateway), but the ledger structure is real for future Stripe/whoever integration.

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| order_id | unsignedBigInteger | FK -> orders.id, NOT NULL |
| user_id | unsignedBigInteger | FK -> users.id, NOT NULL |
| direction | enum('credit','debit') | NOT NULL |
| amount | decimal(10,2) | NOT NULL |
| type | enum('payment','refund','delivery_fee','payout') | NOT NULL |
| payout_status | enum('pending','paid') | NULLABLE | Rider payout tracking (independent of main payment flow) |
| metadata | json | NULLABLE |
| timestamps | | |

**Indexes:** `(order_id)`, `(user_id)`

---

## 17. `recipes` — Recipe content

### UX Designer Note
Recipes are authored by Checkstar (no user submission — removed per `original_site_issues.md`). Each recipe has ingredients (structured JSON) and method (text). The "Other Recipes" section lists related recipes by category tag. Old broken links from the original site are replaced by real data.

### UI Designer Note
- Recipe cards show: image, title, prep time, cook time, servings badge
- `ingredients` JSON renders as a checklist; `method` renders as numbered steps
- `is_featured` recipes appear on the Home page hero or a "Recipe of the Week" section
- `image` is a wide hero on the recipe detail page with parallax scroll (motion div using `useScroll`)

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| title | string(255) | NOT NULL |
| slug | string(255) | UNIQUE, NOT NULL |
| description | text | NULLABLE |
| ingredients | json | NOT NULL |
| method | text | NOT NULL |
| image | string(255) | NULLABLE |
| category | string(50) | NULLABLE (e.g. "snacks", "meals", "desserts", "drinks") |
| prep_time | integer unsigned | NULLABLE (minutes) |
| cook_time | integer unsigned | NULLABLE (minutes) |
| servings | integer unsigned | NULLABLE |
| is_featured | boolean | DEFAULT false, INDEX |
| is_published | boolean | DEFAULT true |
| timestamps | | |

**Indexes:** `(is_featured, is_published)`, `(category)`

---

## 18. `community_posts` — Gallery + CSR (merged)

### UX Designer Note
Per `original_site_issues.md`: Consumer Involvement (CSR) and Gallery are merged into one Community page. The `category` field distinguishes them for filtering tabs within the page. CSR posts might have longer content; Gallery posts are primarily image-driven.

### UI Designer Note
- Gallery posts: masonry grid of images with lightbox on click (AnimatePresence + motion.div for transitions)
- CSR posts: card layout with image, title, content excerpt, event date
- Category pills at top filter between "Gallery", "CSR", or "All"
- `event_date` shows as a subtle date badge on cards

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| title | string(255) | NOT NULL |
| slug | string(255) | UNIQUE, NOT NULL |
| content | text | NULLABLE |
| image | string(255) | NULLABLE |
| category | enum('gallery','csr') | NOT NULL, INDEX | SQLite stores as text with app-layer enforcement; native enum in PostgreSQL |
| event_date | date | NULLABLE |
| is_published | boolean | DEFAULT true, INDEX |
| timestamps | | |

**Indexes:** `(category, is_published)`, `(event_date)`

---

## 19. `contact_messages` — Contact form submissions

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| user_id | unsignedBigInteger | FK -> users.id, NULLABLE |
| name | string(255) | NOT NULL |
| email | string(255) | NOT NULL |
| phone | string(20) | NULLABLE |
| subject | string(255) | NULLABLE |
| message | text | NOT NULL |
| is_read | boolean | DEFAULT false |
| timestamps | | |

**Indexes:** `(is_read)`, `(user_id)`

---

## 20. `career_listings` — Job postings

### UX Designer Note
Simplified careers page (per spec). Shows active job listings grouped by department/location. Each listing has a description, requirements, and closing date.

### Schema

| Column | Type | Constraints |
|--------|------|-------------|
| id | bigIncrements | PK |
| title | string(255) | NOT NULL |
| slug | string(255) | UNIQUE, NOT NULL |
| description | text | NOT NULL |
| requirements | text | NULLABLE |
| location | string(255) | NOT NULL |
| type | enum('full_time','part_time','contract') | NOT NULL |
| department | string(100) | NULLABLE |
| is_active | boolean | DEFAULT true, INDEX |
| closes_at | date | NULLABLE |
| timestamps | | |

**Indexes:** `(is_active)`, `(department)`

---

## Dispatch Algorithm Design

### Flow
```
1. Order confirmed (status = 'confirmed')
2. Dispatch attempt on closest store:
   a. Compute Haversine distance from delivery address to each store
   b. Filter stores within their own delivery_radius_km
   c. Select the closest store that has ≥1 available Rider
   d. Assign the order to that store, notify its Riders
   e. If no store has an available Rider immediately:
      - Wait `dispatch.retry_interval_seconds` (default: 60) at the closest qualifying store
      - Poll each `retry_interval_seconds` for a Rider to become available
      - After `dispatch.timeout_seconds` (default: 300 / 5 retries) at a store, cascade to the next-nearest store
      - Repeat through stores in order of proximity
   f. If all stores exhausted → cancel order
3. Available Riders at assigned store see the pending order (polling, MVP).
4. First Rider to claim wins via atomic DB transaction:
   BEGIN TRANSACTION;
   SELECT * FROM orders WHERE id = ? AND rider_id IS NULL
   FOR UPDATE SKIP LOCKED;
   UPDATE orders SET rider_id = ?, status = 'preparing', updated_at = NOW()
   WHERE id = ? AND rider_id IS NULL;
INSERT INTO order_activity_logs (order_id, user_id,
      event_type, old_status, new_status, metadata, created_at)
    VALUES (?, ?, 'rider_assigned',
      'confirmed', 'preparing',
      '{"claim_latency_seconds": ?}', NOW());
   -- Stock NOT decremented here — that happens at 'items_bought'
   COMMIT;
```

### Configurable Thresholds (stored in `config/dispatch.php`, overridable via .env)
| Parameter | Default | Purpose |
|-----------|---------|---------|
| `dispatch.retry_interval_seconds` | 60 | How long between availability polls at the current store |
| `dispatch.timeout_seconds` | 300 | How long to wait at a store before cascading to next |
| `dispatch.max_fallback_stores` | 3 | How many stores to try before cancelling (matches 3 physical stores) |

**Redis dispatch queue:** Retry polling is backed by a Redis queue (`dispatch:retry:{order_id}`) with TTL equal to `timeout_seconds`. On TTL expiry, a queued job cascades to the next store. This survives process restarts and avoids in-memory timer state loss.

### Data Science Instrumentation Note
Every claimed order records `claim_latency_seconds` in the `order_activity_logs.metadata` JSON. Over time, this enables analysis of:
- Peak-hour dispatch latency by store
- Rider availability patterns (day-of-week, hour-of-day)
- Optimal `timeout_seconds` value per store (e.g., Store A might need 180s, Store B only 90s)
- Funnel conversion: % of orders dispatched at first store vs cascaded vs cancelled

---

## Key Query Patterns (for indexing)

| Query | Index | Why |
|-------|-------|-----|
| Active riders at a store | `riders(is_available, store_id)` | Dispatch pool (step 2c) |
| Stores within delivery range | `stores(latitude, longitude, is_active)` | Dispatch proximity sort (Haversine computed in app; index narrows the set) |
| Riders at store with profile data | `riders(store_id, is_available, id)` | Covering index for dispatch — fetches rider IDs without hitting the clustered index |
| Orders pending dispatch at store | `orders(status, store_id)` | Dispatch polling (step 3) |
| Unassigned orders (FOR UPDATE SKIP LOCKED) | `orders(status, rider_id)` WHERE rider_id IS NULL | Rider claim query (step 4) — partial index if PostgreSQL, composite on SQLite |
| Customer order history (sorted recent) | `orders(customer_id, created_at)` | Profile pages, "My Orders" |
| Rider active orders | `orders(rider_id, status)` | Rider dashboard — current deliveries |
| Products in category (available) | `products(category_id, is_active)` | Product listing pages |
| Featured products | `products(is_featured, is_active)` | Homepage "Best Deals" horizontal scroll |
| Active specials by date range | `specials(start_date, end_date, is_active)` | Specials page — filters on all three |
| Community posts by type | `community_posts(category, is_published, event_date)` | Community page with chronological sort |
| Order timeline | `order_activity_logs(order_id, created_at)` | Order detail page — vertical timeline |

---

## Migration Build Order

This is the order migrations should run in (FK dependencies):

```
 1. users
 2. stores (FK -> users.owner_id)
 3. store_staff (FK -> stores, users)
 4. categories
 5. products (FK -> categories)
 6. store_product (FK -> stores, products)
 7. specials
 8. product_special (FK -> products, specials)
 9. riders (FK -> users, stores)
10. rider_locations (FK -> riders)
11. rider_badges (FK -> riders)
12. orders (FK -> users, riders, stores)
13. order_items (FK -> orders, products, store_product)
14. order_activity_logs (FK -> orders, users)
15. reviews (FK -> orders, users, riders)
16. transactions (FK -> orders, users)
17. recipes
18. community_posts
19. contact_messages
20. career_listings
```
