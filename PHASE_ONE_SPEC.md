# Checkstar — Phase One Spec

## 1. Overview

Complete redesign of checkstar.co.za — a Durban-based supermarket chain with 3 physical stores, community roots, and an on-demand delivery app ("Checkstar Now Now"). The old site is a static Dreamweaver-built XHTML 1.0 table layout from 2016. This rebuild turns it into a modern, animated, database-driven platform.

### Core Objectives

- Modern branded website for Checkstar (Durban supermarket)
- Grocery delivery system with runners (bike couriers)
- Admin/store management back-end
- Shared design system that will later power a React Native app
- All UI animation via **motion.dev** (`motion-v` for Vue)

---

## 2. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Backend** | Laravel 11+ | Proven, Inertia-native, Breeze auth |
| **Frontend** | Vue 3 + TypeScript | Inertia default, motion-v support |
| **UI Framework** | Tailwind CSS v3 + custom tokens | Utility-first, eas to theme |
| **Animation** | `motion-v` (motion.dev v2.2.1) | Hybrid JS/CSS engine, gestures, layout, scroll — primary UI kit |
| **State** | Pinia | Companion to Vue 3 / Inertia |
| **Database** | SQLite (dev) → PostgreSQL (prod) | Local-first; SQLite for zero-setup dev |
| **Auth** | Laravel Breeze (Inertia + Vue) | Inertia-native scaffold |
| **Real-time** | Laravel Reverb (future phase) | For runner order feed |
| **Storage** | Laravel local public disk | .env toggle for S3 later |
| **Maps** | Leaflet + OpenStreetMap (free, no API key) | Store locator, runner tracking |

### motion-v Notes

- Import via `npm install motion-v`
- Auto-import via unplugin-vue-components + `MotionResolver`
- Core components: `<motion.div>`, `<motion.button>`, `<AnimatePresence>`
- Key props: `:animate`, `:initial`, `:whileHover`, `:whilePress`, `:whileInView`, `layout`, `layoutId`
- Where motion-v doesn't provide a needed UI pattern → build custom component using motion-v primitives

---

## 3. Design System

### Brand Colors (from existing Checkstar brand)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#EB6522` | Main brand orange — headers, CTAs, footer, primary buttons |
| `primaryDark` | `#CC4400` | Hover states, active elements |
| `primaryLight` | `#FFE0CC` | Subtle backgrounds, badges, highlights |
| `accent` | `#CC0000` | Links, sale badges, urgent indicators |
| `textPrimary` | `#212529` | Body text |
| `textSecondary` | `#6C757D` | Secondary text, captions |
| `background` | `#FFFFFF` | Page background |
| `backgroundSecondary` | `#F8F9FA` | Section alt backgrounds |
| `border` | `#DEE2E6` | Card borders, dividers |
| `success` | `#2D6A4F` | In-stock, delivered, confirmed |
| `warning` | `#E9C46A` | Pending, awaiting runner |

### Typography

| Token | Value |
|-------|-------|
| `font-sans` | Inter / system sans-serif stack |
| `font-display` | Figtree or similar (headings) |

### Spacing & Radius

```
spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 }
radius:  { sm: 6, md: 10, lg: 16, xl: 24, full: 9999 }
```

### Icon System

Lucide icons (open source, consistent, available for both Vue and React Native later).

---

## 4. Site Map (Redesigned)

Based on `orginal_site_issues.md` — tabs simplified, redundancies merged:

| # | Page | Route | Origin Notes |
|---|------|-------|-------------|
| 1 | **Home** | `/` | Hero, store locator card, current promo, featured products, CTA |
| 2 | **About** | `/about` | Brand story, stakeholders, timeline |
| 3 | **Products** | `/products` | 13 department categories → detail pages with products (from DB) |
| 4 | **Specials** | `/specials` | Weekly/monthly promotions (image + price from DB, not static JPG) |
| 5 | **Consumer Services** | `/services` | Milkshakes, pensions, airtime, electricity (section, not separate tab) |
| 6 | **Recipes** | `/recipes` | Recipe list + single recipe view. **No submission form** |
| 7 | **Community** | `/community` | Merged: Gallery + Consumer Involvement (CSR) |
| 8 | **Store Finder** | `/stores` | Dedicated tab with map + 3 store cards (GPS, hours, contact) |
| 9 | **Contact** | `/contact` | Contact form, head office details |
| 10 | **Careers** | `/careers` | Simplified |
| — | *Tips 4 You* | — | **Removed entirely** |
| — | *Competitions* | — | **Removed entirely** |

---

## 5. Database Schema (Core Entities)

### 5.1 Store Management

```sql
stores
  id, name, slug, description, address, city, province, postal_code,
  latitude, longitude, phone, email, trading_hours (json),
  logo, is_active, created_at, updated_at
```

### 5.2 Product Catalogue

```sql
categories
  id, name, slug, description, image, sort_order, is_active, ...

products
  id, category_id, name, slug, description, image, unit (e.g. "each", "kg"),
  is_active, ...

store_products
  id, store_id, product_id, price, sale_price, stock_quantity,
  is_available, ...
```

### 5.3 Content

```sql
recipes
  id, title, slug, ingredients (json), method (text),
  image, category, is_featured, created_at, ...

community_posts
  id, title, slug, content, image, category (gallery|csr),
  event_date, is_published, ...

specials
  id, store_id, title, description, image, start_date, end_date,
  is_active, ...
```

### 5.4 Delivery / Runner System (adapted from Runnar PRD)

```sql
users
  id, name, email, password, role (customer|runner|admin),
  phone, avatar, latitude, longitude, ...

runners
  id, user_id, is_available, base_fee, max_radius_km,
  total_deliveries, rating, xp, level, ...

orders
  id, buyer_id, runner_id, store_id,
  delivery_address, delivery_lat, delivery_lng,
  payment_status (held|released|refunded),
  fulfillment_status (pending|assigned|purchasing|bought|ready),
  delivery_status (not_dispatched|delivering|delivered|confirmed),
  subtotal, delivery_fee, total, notes, created_at, ...

order_items
  id, order_id, store_product_id, quantity, price_at_time,
  product_snapshot (json), ...

order_activity_logs
  id, order_id, user_id, event_type, metadata, created_at, ...
```

### 5.5 Contact & Inquiries

```sql
contact_messages
  id, name, email, phone, subject, message, is_read, created_at, ...

b2b_inquiries
  id, business_name, contact_name, email, phone, message, is_read, ...
```

---

## 6. Feature Scope — Phase One

### 6.1 Website (Public)

- [ ] Brand homepage with animated hero (`<motion.div :animate>`)
- [ ] About page with brand story, stakeholder section
- [ ] Store Finder with Leaflet map + animated store cards (`<motion.div :whileHover>`)
- [ ] Products listing page with category grid
- [ ] Product detail page with pricing, stock info
- [ ] Specials/promotions page (DB-driven, not static images)
- [ ] Consumer Services page (section)
- [ ] Recipes listing + single recipe view (animated transitions via `AnimatePresence`)
- [ ] Community page (Gallery + CSR merged)
- [ ] Contact page with form + store details
- [ ] Careers page (simplified)

### 6.2 Auth System

- [ ] Customer registration / login via Breeze
- [ ] Runner registration (separate flow, extra fields)
- [ ] Admin login

### 6.3 Admin / Store Dashboard

- [ ] Dashboard with metrics (orders, products, views)
- [ ] Manage products & inventory (CRUD)
- [ ] Manage specials/promotions
- [ ] View orders
- [ ] Manage recipes & community posts

### 6.4 Delivery System (MVP)

- [ ] Customer: browse products, add to cart, checkout (mock payment)
- [ ] Customer: order tracking with status + timeline
- [ ] Runner: availability toggle, incoming order feed (polling for MVP)
- [ ] Runner: claim order → mark items bought → mark delivered
- [ ] Runner: basic gamification (XP, level)
- [ ] Customer: confirm delivery → rate runner
- [ ] In-app activity log for orders

### 6.5 Animations (motion-v)

Every page uses motion-v for:
- Page transitions (route change animations)
- Card/listing staggered entries (`:initial` + `:animate` with stagger)
- Hover/press gestures on buttons and cards (`:whileHover`, `:whilePress`)
- Scroll-triggered reveal (`:whileInView`)
- Layout animations for cart/order state changes (`layout` prop)
- Exit animations for modals, alerts (`AnimatePresence` + `:exit`)

---

## 7. Architecture Patterns (from Runnar)

- **State machine**: Order status tracked via 3 independent enums (`payment_status`, `fulfillment_status`, `delivery_status`) — prevents invalid transitions
- **Inventory snapshotting**: `order_items` freezes price + product data at time of order
- **Role-based layouts**: Separate Vue layouts for Customer / Runner / Admin
- **Atomic runner claiming**: Use `FOR UPDATE SKIP LOCKED` when multiple runners try to claim same order
- **Ledger-style transactions**: All financial events recorded with `direction` (credit/debit)

---

## 8. GreenBidder Design Borrows

- **Design tokens pattern**: Centralized colors, spacing, radius, fonts in one config file
- **Tamagui styling approach**: Component-level style tokens instead of CSS sprawl
- **Clean navigation structure**: Bottom tabs → stack screens pattern for mobile later

---

## 9. UX Patterns (from Flutter Grocery App)

The Flutter grocery app (`Flutter-GroceryApp-main/`) has a polished user flow that the web should mirror.

### 9.1 User Flow Sequence

```
Splash (3s, brand logo)
  → Welcome ("Get your groceries delivered…" tagline + "Shop Now" CTA)
  → Registration (or skip to browse)
  → Dashboard/Home
      ├── Search bar (read-only → opens search page)
      ├── Promo carousel
      ├── Categories grid (4 per row, icon + label)
      └── "Best deals" horizontal product scroll
  ├── Categories tab (left sidebar + right product list)
  ├── Cart (item list + total + checkout)
  └── Profile (avatar, preferences, delivery settings, about)
```

### 9.2 Homepage Layout

| Section | Component | Notes |
|---------|-----------|-------|
| Top bar | Store selector dropdown + "Free delivery" badge + profile avatar | Dropdown for multi-store support |
| Search | Read-only search bar → search page | Tap to search, camera icon for scan (future) |
| Hero | Image carousel (auto-advancing) | Promotions, specials, seasonal |
| Categories | 2×4 grid of category icons with labels | Seafood, Vegetables, Fruits, Snacks, Canned, Pasta/Rice, Home, Woman care |
| Best Deals | Horizontal scrolling product cards | Price + discount + name + inline add-to-cart |

### 9.3 Product Card Pattern

```
┌─────────────────────┐
│  [DISCOUNT%]  [ + ] │  ← discount top-left, add-to-cart top-right
│                     │
│    (product img)    │  ← tap for detail page (Hero transition)
│                     │
│     $price          │  ← prominent, red (#FF324B)
│   ~~$orig~~  -20%   │  ← strikethrough original + discount
│  Product Name       │  ← truncated to 1 line
└─────────────────────┘

→ Once added to cart, "+" changes to inline quantity control:
  [−]  2  [+]   (animated container transition)
```

### 9.4 Product Detail Page

```
┌─────────────────────────┐
│  ← back  [search]  [♥] │
├─────────────────────────┤
│                         │
│    (product image)      │  ← tap for photo view gallery (pinch zoom)
│                         │
├─────────────────────────┤
│  $price / unit          │  ← red, bold
│  Product Name           │
│  Quantity: 1kg          │
│  tags: category tags    │
│                         │
│  [organic] [1yr exp]    │  ← key points row
│  [4.8 ★]    [80 kcal]   │
├─────────────────────────┤
│  Total: $price    [Add] │  ← bottom bar, fixed
│                     [+] │     inline qty control after adding
└─────────────────────────┘
```

### 9.5 Cart Page

```
┌─────────────────────────┐
│  Cart 🛒                │
├─────────────────────────┤
│  [img] Product Name     │
│        $price / unit    │
│        [−] 2 [+]        │  ← qty control
│  ─────────────────────  │
│  [img] Product Name     │
│        $price / unit    │
│        [−] 1 [+]        │
│                         │
│  "Cart saved for 72hrs" │
├─────────────────────────┤
│  Total (with tax)       │
│  $amount        [Checkout] │
└─────────────────────────┘
```

### 9.6 Categories Page

```
┌─────────────────────────┐
│  [search bar]           │
├────────┬────────────────┤
│ Seafood│  Product 1      │
│ Veggies│  Product 2      │
│ Fruits │  Product 3      │
│ Snacks │  Product 4      │
│ Canned │  Product 5      │
│ Pasta  │  ...            │
│ Home   │                 │
│ Woman  │                 │
└────────┴────────────────┘
     ↑ vertical                ↑ products under
     sidebar                   selected category
```

### 9.7 Cart Logic

- **addToCart**: If product exists in cart → increment quantity (max 8). If not → add with quantity 1
- **removeFromCart**: If quantity > 1 → decrement. If quantity == 1 → remove item
- **Persistence**: Cart saved to local storage, survives app restart
- **Badge**: Cart icon shows live count of unique items
- **Checkout**: Total calculated from `price × quantity` per item; mock payment with success dialog

### 9.8 Key Design Details

- **Price color**: `#FF324B` (red) for sale/current price
- **Card background**: `#E9F5FA` light blue tint for cart controls
- **Product image**: Circular crop in lists, full width on detail
- **Discount badge**: Top-left corner of card, primary color bg
- **Hero animation**: Shared image transition between card and detail page
- **AnimatedContainer**: For cart add/remove state transitions (200ms)
- **Empty states**: Custom illustration for empty cart
- **Min order**: Message displayed when cart value is below threshold
- **Stadium buttons**: Rounded pill shape for primary CTAs

---

## 10. Project Structure

```
checkstar/
├── app/                    # Laravel app
│   ├── Http/Controllers/
│   │   ├── Auth/
│   │   ├── StoreController.php
│   │   ├── ProductController.php
│   │   ├── OrderController.php
│   │   ├── RecipeController.php
│   │   └── Admin/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Store.php
│   │   ├── Product.php
│   │   ├── Category.php
│   │   ├── Order.php
│   │   ├── OrderItem.php
│   │   ├── Recipe.php
│   │   └── ...
│   └── Services/
│       ├── OrderService.php
│       └── DeliveryService.php
├── database/
│   └── migrations/
├── resources/
│   └── js/
│       ├── Components/
│       │   ├── motion/        # Custom motion-wrapped components
│       │   ├── ui/            # Generic UI components
│       │   └── ...
│       ├── Composable/
│       ├── Layouts/
│       │   ├── CustomerLayout.vue
│       │   ├── RunnerLayout.vue
│       │   └── AdminLayout.vue
│       ├── Pages/
│       │   ├── Customer/
│       │   ├── Runner/
│       │   └── Admin/
│       ├── Stores/            # Pinia
│       └── Types/
├── tailwind.config.js
├── composer.json
└── package.json
```

---

## 11. motion-v Usage Patterns

```vue
<!-- Example: Page enter with staggered children -->
<template>
  <motion.div
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.4 }"
  >
    <motion.div
      v-for="(item, i) in items"
      :key="item.id"
      :initial="{ opacity: 0, y: 10 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ delay: i * 0.05 }"
    >
      {{ item.name }}
    </motion.div>
  </motion.div>
</template>

<!-- Example: Card hover -->
<motion.div
  :whileHover="{ scale: 1.02 }"
  :whilePress="{ scale: 0.98 }"
  :transition="{ type: 'spring', stiffness: 300 }"
>
  <!-- card content -->
</motion.div>

<!-- Example: Scroll reveal -->
<motion.div
  :initial="{ opacity: 0, y: 40 }"
  :whileInView="{ opacity: 1, y: 0 }"
  :viewport="{ once: true, margin: '-50px' }"
>
  <!-- section content -->
</motion.div>
```

Custom UI components (buttons, cards, inputs, modals) will be created wrapping motion-v primitives so every interactive element comes with animation baked in.

---

## 12. Delivery System Flow

```
Buyer browses → adds to cart → checkout (mock payment)
  → order created (pending_runner)
  → runners notified
  → first runner claims (atomic via SKIP LOCKED)
  → runner buys items → marks "items_bought"
  → runner delivers → marks "delivered"
  → buyer confirms + rates
  → payment released (mock)
```

---

## 13. Initial Setup Steps

1. `laravel new checkstar --breeze --stack=vue --typescript`
2. `npm install motion-v`
3. Configure Tailwind + design tokens
4. Set up SQLite database
5. Create migrations for all core entities
6. Build admin auth + product CRUD
7. Build public pages with motion-v animations
8. Implement cart + checkout flow
9. Implement runner system
10. Seed demo data (products, stores, recipes)

---

*This spec is a living document — update as decisions evolve.*
