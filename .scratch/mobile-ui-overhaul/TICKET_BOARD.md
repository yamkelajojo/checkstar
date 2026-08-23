# Mobile UI Overhaul — Ticket Board (FINAL)

**Generated from:** `/grilling` + `/domain-modeling` + `/to-tickets` + TDD review  
**Total tickets:** 34 (31 previous + 3 final additions)  
**Tracking:** Local files in `.scratch/mobile-ui-overhaul/issues/`

---

## Final Additions (This Review)

| # | Ticket | Critical Path | Layer |
|---|--------|---------------|-------|
| **06n** | `useReducedMotion` hook unit test | Accessibility (reduce motion) | Unit |
| **I12** | Order Review flow integration | Post-delivery rating/comment | Integration |
| **I13** | Local notifications on status change | Background order updates | Integration |

---

## Complete Ticket Registry (34 tickets)

### Layer 0: Crash Fix + Env (Frontier)
| # | Ticket | Status |
|---|--------|--------|
| 01 | Fix Logo Crash | ✅ DONE |
| 01a | Logo crash regression test | 🔴 Ready |
| 01b | Logo variants test | 🔴 Ready |
| 02 | Add .env.local | 🔴 Ready |

### Layer 1: Tamagui Foundation
| # | Ticket | Blocked By |
|---|--------|------------|
| 03a | Install Tamagui deps | 01, 02 |
| 03b | Babel plugin order | 03a |
| 04a | Config tokens typed | 03b |
| 04b | Checkstar palette | 04a |
| 04c | Semantic color aliases | 04b |
| 05a | Provider context | 04c |
| 05b | Provider wraps | 05a |

### Layer 2: Shared Components (Vertical Slices)
| # | Ticket | Seam | Blocked By |
|---|--------|------|------------|
| 06a | Stack/YStack/XStack | Layout props | 05b |
| 06b | Text | `variant`, `color`, `weight` | 05b |
| 06c | Button | Press, disabled, variant, haptics | 05b, 08a |
| 06d | Card | Elevation, radius, padding | 05b |
| 06e | SkeletonCard | Animates, matches Card | 05b |
| 06f | EmptyState | Icon+title+caption+action | 05b |
| 06g | Stepper | Inc/dec, min/max, a11y | 05b, 08a |
| 06h | ProductCard | Image+name+price+stepper+badge | 06c, 06d, 06g |
| 06i | CollectionPill | Text+icon+press | 06b, 06c |
| 06j | PriceLabel/PriceGauge | Strike-through, % badge | 06b |
| 06k | AnimatedError/FadeSlideIn | Animation, reduced-motion | 05b, 08b, **06n** |
| 06l | Search unit tests | Debounce, recent, category | 06a, 06h, 09b |
| 06m | StorePicker unit tests | List, select, auto-select | 06a, 06b, 06c, 08a, 09b |
| **06n** | **useReducedMotion hook** | Accessibility reduce-motion | 05b, 08b |

### Layer 2b: Utils
| # | Ticket | Seam | Blocked By |
|---|--------|------|------------|
| 08a | usePressAnimation | `{scale, opacity}` style | 05b |
| 08b | scrollPhysics | `ScrollView` fast props | 05b |
| 08c | haptics | `impactLight/selection/notification` | 05b |
| 08d | formatters | `formatZar/Date/Number` strings | 05b |

### Layer 2c: Feedback Components
| # | Ticket | Seam | Blocked By |
|---|--------|------|------------|
| 07a | Toast | `show()` queues, auto-dismiss | 06a, 06b, 08a |
| 07b | Sheet | `open/close`, snapPoints, backdrop | 06a, 06b, 08a |
| 07c | ProgressBar | `progress` 0–1, steps, animated | 06a, 06b |

### Layer 2d: Icons + Logo
| # | Ticket | Seam | Blocked By |
|---|--------|------|------------|
| 09a | Icon snapshot | Visual parity | 03a |
| 09b | Icon props | `size`/`color`/`strokeWidth` | 09a |
| 17a | Star mark SVG | White wing + orange check | 06a, 06b |
| 17b | Wordmark | "Check" orange, "star" white | 06b |
| 17c | Tagline | "cares enough" italic | 06b |
| 17d | Variants | `stacked`/`lockup`, `size` scales | 17a, 17b, 17c |

### Layer 3: Integration Tests
| # | Ticket | Seam | Blocked By |
|---|--------|------|------------|
| I01 | Auth flow | `AuthScreen` → API → `useSession` | 06c, 07a, 09b |
| I02 | Onboarding→StorePicker→Home | Nav stack, store persists | 06a, 06b, S06 |
| I03 | Cart add/remove→badge | `useCart` + stepper + tab badge | 06c, 06g, 06h |
| I04 | Browse category switch | Rail + grid, React Query cache | 06a, 06h |
| I05 | Product detail→cart→toast | Detail stepper → `useCart` → `Toast` | 06c, 06g, 07a |
| I06 | Checkout→OrderDetail | Form → placeOrder → success → timeline | I03, I05, 07a |
| I07 | API auth+errors | 401 → `onUnauthorized` → signOut | 02, 03a |
| I08 | Deep linking + notifications | `checkstar://order/123` → OrderDetail | I06, 17d |
| I09 | Cart persistence | 72h survive kill/restart | 06c, 06g, 08d, I03 |
| I10 | Error boundary+offline | Fallback UI, cached data, banner | 05b, 07a, I07, S01 |
| I11 | Order realtime tracking | Poll 15s, timeline animates, rider info | I06, 07a, 08a, 17d |
| **I12** | **Order review flow** | Star rating + comment → `reviewOrder` | I06, I11, 06c, 06b, 07a, 09b |
| **I13** | **Local notifications** | Status change → local notification + deep link | I06, 08a, 17d |

### Layer 4: System Tests
| # | Ticket | Seam | Blocked By |
|---|--------|------|------------|
| S01 | Home tab journey | Splash→Onboarding→Home: carousel, cats, specials | I01, I03, I04 |
| S02 | Browse→Product→Cart | Browse rail → ProductDetail → Cart → Checkout | I03, I04, I05 |
| S03 | Account→Orders→Detail | Auth → Account → OrderDetail timeline | I01, I06 |
| S04 | Offline resilience | Cached data + banner when API fails | I07, I10 |
| S05 | Search screen | Debounce, recent, results grid, category pills | 06a, 06h, 07a, 09b, I04 |
| S06 | Store picker | Store list, auto-select nearest, persists | 06a, 06b, 06c, 08a, 09b, I02 |
| S07 | Product summary modal | Sheet: image, price, stepper, add→cart | 06a, 06b, 06c, 06g, 06h, 07a, 09b, I05 |

### Layer 5: Acceptance Tests
| # | Ticket | Seam | Blocked By |
|---|--------|------|------------|
| A01 | Accessibility audit | TalkBack/VoiceOver, AA contrast, dynamic type, reduce motion | All System |
| A02 | 60fps scroll | FlatList/ScrollView on all grids | S01, S02 |
| A03 | Tab switch <300ms | `CustomerTabs` timing | S01 |
| A04 | Splash <1s | Cold start timing | S01 |
| A05 | iPhone fleet acceptance | Expo Go 54.0.2 on iPhone 17 | A01–A04, 17d |

---

## Frontier (Start Here)

| Ticket | Blockers | Notes |
|--------|----------|-------|
| **01a** | 01 ✅ | Write failing test for `InvalidNumber` crash |
| **01b** | 01a | Test `stacked`/`lockup`/`size`/`tone` variants |
| **02** | — | Add `mobile/.env.local` with `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api` |

---

## Critical Path Coverage Matrix

| Critical Path | Unit | Integration | System | Acceptance |
|---------------|------|-------------|--------|------------|
| **Crash-free boot** | 01a, 01b | — | S01 | A05 |
| **Backend connectivity** | 02 | I07 | S01 | A05 |
| **Design system (Tamagui)** | 03a–06k, 07a–07c, 08a–08d, 09a–09b, 06n | — | S01–S07 | A01–A04 |
| **Brand logo (exact SVG)** | 17a–17d | — | S01, S03, S04, I02 | A05 |
| **Home (carousel, cats, specials)** | 06h, 06i | — | S01 | A02, A03 |
| **Browse (2-pane rail)** | 06a, 06h | I04 | S02 | A02 |
| **Search (debounce, recent)** | **06l** | — | **S05** | A01, A02 |
| **Store picker (radius, auto)** | **06m** | I02 | **S06** | A01 |
| **Product summary modal** | 06h, 06g | I05 | **S07** | A01 |
| **Product detail (gallery, CTA)** | 06h, 06g | I05 | S02 | A02 |
| **Cart (steppers, 72h, badge)** | 06g, 06h | I03, **I09** | S02 | A02, A03 |
| **Checkout → Order → Tracking** | — | I06, I11 | S03 | A01 |
| **Auth/Onboarding** | — | I01, I02 | S01 | A01 |
| **Account/Orders** | — | I01, I06 | S03 | A01 |
| **Order review (stars/comment)** | — | **I12** | S03 | A01 |
| **Deep linking (notifications)** | — | I08, **I13** | S03 | A05 |
| **Offline + error boundary** | — | **I10** | S04 | A01 |
| **Accessibility (reduce motion)** | **06n** | — | — | A01 |

---

## Source Coverage Check

| Source File | Covered By |
|-------------|------------|
| `mobile/src/components/shared/Logo.tsx` | 01, 01a, 01b, 17a–17d |
| `mobile/src/components/shared/*.tsx` (13 components) | 06a–06k, 06n |
| `mobile/src/features/search/SearchScreen.tsx` | 06l, S05 |
| `mobile/src/features/store/StorePickerScreen.tsx` | 06m, S06, I02 |
| `mobile/src/features/catalog/ProductSummaryModal.tsx` | S07, I05 |
| `mobile/src/features/product/ProductDetailScreen.tsx` | 15, I05, S02 |
| `mobile/src/features/cart/*.tsx` | 12, I03, I09, S02 |
| `mobile/src/features/checkout/CheckoutScreen.tsx` | I06, S02 |
| `mobile/src/features/orders/OrderDetailScreen.tsx` | I06, I11, **I12**, I13, S03 |
| `mobile/src/features/orders/OrderPlacedScreen.tsx` | I06 |
| `mobile/src/features/account/AccountScreen.tsx` | 13, S03 |
| `mobile/src/features/auth/AuthScreen.tsx` | I01 |
| `mobile/src/features/onboarding/*.tsx` | I02, S01 |
| `mobile/src/features/home/HomeScreen.tsx` | S01 |
| `mobile/src/features/catalog/BrowseScreen.tsx` | 11, I04, S02 |
| `mobile/src/features/rider/*.tsx` | Out of scope (mockable) |
| `mobile/src/navigation/CustomerTabs.tsx` | A03 |
| `mobile/src/navigation/RootNavigator.tsx` | I02, I08 |
| `mobile/src/lib/apiClient.ts` | I07, I09, I11, I12 |
| `mobile/src/lib/deliveryCoords.ts` | Existing test + I06 |
| `mobile/src/lib/pricing.ts` | Existing test |
| `mobile/src/lib/currency.ts` | 08d + existing |
| `mobile/src/stores/session.ts` | I01, I07 |
| `mobile/src/stores/deliveryStore.ts` | S06, I02, I09 |
| `mobile/src/stores/motionPreferences.ts` | **06n** |
| `mobile/src/theme/*.ts` | 04a–04c (migrated to Tamagui) |
| `checkstar-logo-icon-star.html` | 17a |
| `checkstar-logo-text.html` | 17b, 17c |
| GreenBidder `src/config/theme.js` | 04a–04c, 06a–06k, 07a–07c, 08a–08d |

---

## Ready to Proceed?

**Frontier:** 01a → 01b → 02 → 03a → 03b → 04a → 04b → 04c → 05a → 05b → (parallel fan-out: 06a–06n, 08a–08d, 09a–09b)

All 34 tickets written to `.scratch/mobile-ui-overhaul/issues/`. Every feature screen, shared component, utility, and critical user journey has a vertical slice with declared seam and blocking edges.

**Confirm and I'll begin implementation with 01a (Logo crash regression test).**