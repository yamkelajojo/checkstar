# Homepage Expansion & Content Strategy Plan

## Context

The Checkstar homepage is currently short — just a hero, "How it works" section, and a CTA. The old checkstar.co.za site had rich content (consumer services, community/CSR, multicultural promotions) that drove engagement. We need to bring that richness to the new site while keeping it modern and performant.

**Brand Positioning**: The website is for Checkstar the **brand**, not just a delivery utility. It should have atmospheric, branded elements that convey the Checkstar identity.

---

## Final Homepage Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Hero Section]                                             │
│  Fresh groceries, delivered fast                            │
│  Durban's favourite supermarket chain — now online...       │
│  [Shop Now] [Our Story]                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Promotional Banner Carousel]                              │
│  Auto-rotate every 8-10s, swipeable                        │
│  Shows: Eid, Diwali, Christmas, Heritage Day, etc.          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [How it works]                                             │
│  Browse & Add → We Prepare → Rider Delivers                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Airtime Ticker — glass bar, marquee scroll]               │
│  MTN | Vodacom | Cell C | YoCo | rain | Telkom | PayAsYouGo│
│  Hidden on mobile                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [CTA: Ready to get started?]                               │
│  [Browse Products] [View Specials] [Find a Store]           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Trending Now — Product Carousel]                          │
│  Horizontal scroll, product cards                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Most Bought — Product Carousel]                           │
│  Horizontal scroll, product cards                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [New Arrivals — Product Carousel]                          │
│  Horizontal scroll, product cards                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Download the App — Section]                               │
│  ┌──────────────┐  Get the Checkstar app                   │
│  │              │  Shop, track, and save — all in one place│
│  │   iPhone     │  [App Store] [Google Play]               │
│  │   Mockup     │                                          │
│  │              │                                          │
│  └──────────────┘                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Our Community — Banner]                                   │
│  ❤️ From Christmas parties to library reopenings...         │
│  [See Our Impact →]                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Footer]                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Details

### 1. Airtime/Electricity Ticker

**Providers**: MTN, Vodacom, Cell C, YoCo, rain, Telkom, PayAsYouGo

| Decision | Value |
|----------|-------|
| Animation | Single line scrolling horizontally infinitely (marquee) |
| Placement | Between "How it works" and CTA |
| Mobile | Hidden on small screens |
| Glass effect | `solid-glass` frosted effect |

**Technical**:
- Import `solid-glass` and `solid-glass/css`
- Wrap in `<Glass effect="frosted" options={{ blur: 16 }}>`
- CSS marquee animation for infinite scroll
- Hide with `hidden md:block` (Tailwind)

---

### 2. Promotional Banner Carousel

**Placement**: Separate carousel below CTA (hero stays static)
**Link to**: Dedicated specials page filtered by event
**Timing**: Banners appear 1 week before, stay 1 week after event
**Access**: Store Owner, Store Manager, Developer can create banners
**Mobile**: Same banner system (shared API)

**Banner Carousel Behavior**:
- Auto-rotate every 8-10 seconds
- Swipe on mobile, dot click on desktop
- Pause on hover (optional)

**Banner Creator Module** (ported from Sneaksy):

| Role | Can create | Scope |
|------|-----------|-------|
| Developer | Banners | Any store or global |
| Store Owner | Banners | Their store only |
| Store Manager | Banners | Their store only |
| Customer | No | — |
| Rider | No | — |

**Data Model**:
```ts
interface BannerSlide {
  id: string
  subtitle: string        // e.g. "Eid Mubarak"
  title: string           // e.g. "Up to 40% Off"
  ctaLabel: string        // e.g. "Shop Now"
  background: {
    type: 'solid' | 'gradient' | 'radial'
    colorStart: string
    colorEnd: string
    pattern: 'circles' | 'waves' | 'grid' | 'stripes' | 'dots' | 'none'
    patternColor: string
    patternOpacity: number
  }
}

interface BannerCreative {
  id: string
  name: string
  storeId: number | null  // null = global banner
  createdBy: number
  slides: BannerSlide[]
  status: 'draft' | 'published'
  startDate: string
  endDate: string
}
```

**Presets for Checkstar**:
| Event | Colors | Pattern |
|-------|--------|---------|
| Eid | Green/gold | Circles |
| Diwali | Orange/purple | Waves |
| Christmas | Red/green | Stripes |
| Heritage Day | Black/gold/red/green | Grid |
| Women's Day | Pink/purple | Dots |

---

### 3. Product Carousels

**Carousels**: Trending Now, Most Bought, New Arrivals

| Carousel | Data Source | Time Range |
|----------|-------------|------------|
| Trending Now | Order count | Last 7 days |
| Most Bought | Order count | Last 30 days |
| New Arrivals | `created_at` | Last 14 days |

**Backend Endpoints** (public, no auth):
```
GET /api/products/trending     → top 10 products by order count (7 days)
GET /api/products/popular      → top 10 products by order count (30 days)
GET /api/products/new-arrivals → products created in last 14 days
```

**Frontend**: `ProductCarousel.tsx` using Swiper from .opensrc

**Data Simulation**: OrderSeeder already creates 500-1000 orders over 30 days — use this data.

---

### 4. Download the App Section

**Placement**: After product carousels, before community banner

**Design**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ┌──────────────┐   Get the Checkstar App                 │
│   │              │   Shop, track, and save — all in one     │
│   │   iPhone     │   place. Download now and get free       │
│   │   Mockup     │   delivery on your first order.         │
│   │              │                                          │
│   │   (device    │   [Download on App Store]                │
│   │    frame)    │   [Get it on Google Play]                │
│   │              │                                          │
│   └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Components**:
- Device mockup: iPhone frame with app screenshot (or placeholder)
- iOS App Store badge (SVG/image)
- Google Play badge (SVG/image)
- Headline + short copy
- Subtle background gradient or pattern

**Technical**:
- Static section, no API needed
- Device mockup can be a styled div with `rounded-[40px]` + border + shadow
- App screenshots: use placeholder for now, swap with real screenshots later
- Badges: standard SVG badges from Apple/Google

---

### 5. Community Banner

**Content**: Mix of old stories (2014-2015) + new ones (2024-2026)
**Design**: Single "Our Community" banner with summary + CTA
**Link**: Existing `/community` page

---

### 5. Map Fix

**Decision**: Revert Leaflet tiles to default colored tiles (not dark map)

**Implementation**:
- Change tile URL from dark theme to default `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Or use colored style: `https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png`

---

## Implementation Summary

### Backend Changes
| Change | Priority | Complexity |
|--------|----------|------------|
| Banner CRUD (migration, model, controller, routes) | High | Medium |
| Product carousel endpoints (trending, popular, new-arrivals) | High | Low |
| Leaflet tile revert | Low | Trivial |

### Frontend Changes
| Change | Priority | Complexity |
|--------|----------|------------|
| Airtime ticker (solid-glass frosted, marquee) | High | Medium |
| Banner carousel (swiper, auto-rotate) | High | Medium |
| Banner creator admin page (Sneaksy port) | High | High |
| Product carousels (swiper, 3 sections) | High | Medium |
| Download the App section | High | Low |
| Community banner | Medium | Low |
| Leaflet tile revert | Low | Trivial |

### Mobile Changes
| Change | Priority | Complexity |
|--------|----------|------------|
| Banner carousel (shared API) | High | Medium |
| Product carousels (FlatList horizontal) | High | Medium |
| Atmospheric background hints | Medium | Medium |

---

## Libraries (from .opensrc)

| Library | Use case |
|---------|----------|
| `solid-glass` | Airtime ticker glass effect (frosted) |
| `swiper` | Product carousels + banner carousel |

---

*This document is the final plan. Ready for implementation.*
