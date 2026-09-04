# Checkstar Mobile — Feature Tickets

> Auto-generated from gap analysis. Each ticket is a vertical slice (schema → API → UI → tests).
> Backend tracking infrastructure already exists: `behavioral_signals`, `user_tracking_events`, `TrackingController` with `/tracking/view`, `/tracking/search`, `/tracking/contact`, `/tracking/events`, `/tracking/events/batch`.

---

## Epic 1 — Foundation (no blockers)

### T-001: expo-image swap — cached product images everywhere
**Type:** AFK
**Blocked by:** None

#### What to build
Replace every `import { Image } from 'react-native'` with `import { Image } from 'expo-image'` across all mobile screens. This gives disk/memory caching, progressive loading, blur placeholder support, and better memory management with zero API change.

#### Acceptance criteria
- [ ] `expo-image` `Image` replaces RN `Image` in: `ProductCard.tsx`, `ProductDetailScreen.tsx`, `HomeScreen.tsx`, `BrowseScreen.tsx`, `CartScreen.tsx`, `OrderDetailScreen.tsx`, `AccountScreen.tsx`
- [ ] Each `<Image>` has `cachePolicy="memory-disk"` prop
- [ ] Each `<Image>` has a `placeholder` prop (either `blurhash` string or solid color fallback)
- [ ] No visual regressions — images render at same size, aspect ratio, border radius
- [ ] TypeScript compiles with no new errors (`npx tsc --noEmit`)
- [ ] Existing tests still pass

#### Files to touch
- `mobile/src/components/shared/ProductCard.tsx`
- `mobile/src/features/product/ProductDetailScreen.tsx`
- `mobile/src/features/home/HomeScreen.tsx`
- `mobile/src/features/browse/BrowseScreen.tsx`
- `mobile/src/features/cart/CartScreen.tsx`
- `mobile/src/features/orders/OrderDetailScreen.tsx`
- `mobile/src/features/account/AccountScreen.tsx`
- Any other file importing `Image` from `react-native`

---

### T-002: Centralize hardcoded constants
**Type:** AFK
**Blocked by:** None

#### What to build
Extract all hardcoded values scattered across components into a single `src/lib/constants.ts` file. Every component imports from there instead of defining magic numbers inline.

#### Acceptance criteria
- [ ] `src/lib/constants.ts` created with: `MIN_ORDER_CENTS`, `FREE_DELIVERY_THRESHOLD_CENTS`, `MAX_QUANTITY_PER_ITEM`, `DURBAN_COORDS`, `BOOT_TIMEOUT_MS`, `SEARCH_DEBOUNCE_MS`, `POLL_BASE_MS`, `POLL_MAX_MS`
- [ ] `CartScreen.tsx` imports `MIN_ORDER_CENTS` from constants (not inline 5000)
- [ ] `checkout/model.ts` imports `MIN_ORDER_CENTS` from constants (not inline 5000)
- [ ] `HomeScreen.tsx` imports `FREE_DELIVERY_THRESHOLD_CENTS` from constants
- [ ] `CheckoutScreen.tsx` imports `EST_DELIVERY_FEE_CENTS` from constants
- [ ] `ProductDetailScreen.tsx` imports `MAX_QUANTITY_PER_ITEM` from constants
- [ ] All Durban CBD coordinate references use `DURBAN_COORDS`
- [ ] `session.ts` imports `BOOT_TIMEOUT_MS` from constants
- [ ] No duplicate constant definitions remain in component files
- [ ] TypeScript compiles clean

#### Files to touch
- `mobile/src/lib/constants.ts` (new)
- `mobile/src/features/cart/CartScreen.tsx`
- `mobile/src/features/checkout/CheckoutScreen.tsx`
- `mobile/src/features/checkout/model.ts`
- `mobile/src/features/home/HomeScreen.tsx`
- `mobile/src/features/product/ProductDetailScreen.tsx`
- `mobile/src/stores/session.ts`
- `mobile/src/features/search/SearchScreen.tsx`

---

### T-003: React Error Boundaries — crash resilience
**Type:** AFK
**Blocked by:** None

#### What to build
Add React Error Boundaries at three levels: root (app crash fallback), screen (per-screen fallback), and section (within-screen fallback for carousels/grids). On crash, show a friendly recovery UI instead of a white screen.

#### Acceptance criteria
- [ ] `ErrorBoundary.tsx` component created with `catchErrors` HOC variant
- [ ] Root `ErrorBoundary` wraps the entire `RootNavigator` in `App.tsx` — on crash shows full-screen "Something went wrong" with retry button
- [ ] Screen-level `ErrorBoundary` wraps each tab screen in `CustomerTabs.tsx` — on crash shows inline error card within the tab (tab bar still works)
- [ ] Section-level `ErrorBoundary` wraps the specials carousel and featured grid on `HomeScreen.tsx` — on crash shows placeholder for that section only
- [ ] Error boundary logs crash info to console in dev, silently in prod
- [ ] Retry button resets boundary state and re-renders children
- [ ] `componentDidCatch` logs `error` and `errorInfo` to console
- [ ] No changes to existing component logic — purely additive wrapper

#### Files to touch
- `mobile/src/components/shared/ErrorBoundary.tsx` (new)
- `mobile/src/App.tsx`
- `mobile/src/navigation/CustomerTabs.tsx`
- `mobile/src/features/home/HomeScreen.tsx`

---

## Epic 2 — Behavioral Tracking (blocks: T-004, T-005, T-006)

### T-004: Mobile tracking service — fire-and-forget signal capture
**Type:** AFK
**Blocked by:** None (backend endpoints already exist)

#### What to build
Create `src/services/trackingService.ts` — a mobile-native adaptation of GreenBidder's `trackingService.js`. All functions are fire-and-forget: wrapped in try/catch with silent failures, never block UI. Uses the existing backend endpoints (`/tracking/view`, `/tracking/search`, `/tracking/contact`, `/tracking/events/batch`).

The service captures behavioral signals that feed the recommendation engine (T-005). Without this, T-005 has no data to work with.

#### Acceptance criteria
- [ ] `src/services/trackingService.ts` created with these exported functions:
  - `trackProductView(productId, durationMs, source)` → POST `/tracking/view` (anonymous ok)
  - `trackSearch(query, categoryId?, resultsCount?)` → POST `/tracking/search` (anonymous ok)
  - `trackAddToCart(productId, quantity)` → POST `/tracking/events` (auth required)
  - `trackRemoveFromCart(productId)` → POST `/tracking/events` (auth required)
  - `trackCheckout(orderTotal)` → POST `/tracking/events` (auth required)
  - `trackCategoryFilterTap(categoryId, categoryName, resultCount)` → POST `/tracking/search`
- [ ] Each function catches errors silently (console.warn in dev, no-op in prod)
- [ ] `trackProductView` includes `duration_ms` in request body
- [ ] `trackSearch` sends `query` field
- [ ] Auth-required functions check for token before sending; skip silently if guest
- [ ] Batch endpoint used when 3+ events queue within 5s (debounced flush)
- [ ] Unit tests: mock fetch, verify each function calls correct endpoint with correct payload, verify errors are swallowed
- [ ] TypeScript types for all parameters and return values

#### Files to touch
- `mobile/src/services/trackingService.ts` (new)
- `mobile/src/services/__tests__/trackingService.test.ts` (new)

---

### T-005: Wire tracking into existing screens
**Type:** AFK
**Blocked by:** T-004

#### What to build
Integrate the tracking service from T-004 into existing Checkstar screens. Every meaningful user action now emits a behavioral signal to the backend. This is the "thin vertical slice" — tracking calls drop into existing UI with zero visual changes.

#### Acceptance criteria
- [ ] `ProductDetailScreen.tsx`: starts timer on mount, calls `trackProductView(productId, duration, 'direct')` on unmount (duration > 0)
- [ ] `BrowseScreen.tsx`: calls `trackProductView(productId, duration, 'feed')` when user navigates away from product card tap
- [ ] `HomeScreen.tsx`: calls `trackProductView(productId, duration, 'home')` for products tapped from home
- [ ] `SearchScreen.tsx`: calls `trackSearch(query, activeCategory, results.length)` on search completion
- [ ] `BrowseScreen.tsx`: calls `trackCategoryFilterTap(catId, catName, count)` when category pill tapped
- [ ] `CartScreen.tsx`: calls `trackAddToCart(productId, qty)` when quantity increased via stepper
- [ ] `CartScreen.tsx`: calls `trackRemoveFromCart(productId)` when item removed
- [ ] `CheckoutScreen.tsx`: calls `trackCheckout(subtotal)` when order placed successfully
- [ ] All tracking calls are non-blocking — no `await` on tracking functions in UI event handlers (fire-and-forget)
- [ ] No visual changes to any screen
- [ ] TypeScript compiles clean
- [ ] Existing tests pass

#### Files to touch
- `mobile/src/features/product/ProductDetailScreen.tsx`
- `mobile/src/features/browse/BrowseScreen.tsx`
- `mobile/src/features/home/HomeScreen.tsx`
- `mobile/src/features/search/SearchScreen.tsx`
- `mobile/src/features/cart/CartScreen.tsx`
- `mobile/src/features/checkout/CheckoutScreen.tsx`

---

## Epic 3 — Recommendations (blocks: T-007)

### T-006: Backend recommendation endpoint
**Type:** AFK
**Blocked by:** T-004 (needs tracking data in DB to be useful)

#### What to build
Add a `/recommendations` API endpoint to the Checkstar backend. Adapted from GreenBidder's `recommendationEngine.js` but server-side (PHP/Laravel). Scores products by: category affinity, popularity (order count + view count), freshness (7-day half-life), novelty (not recently ordered by this customer), and price fit (Gaussian proximity to customer's average order value).

#### Acceptance criteria
- [ ] `RecommendationController.php` created with `index()` method
- [ ] Route `GET /api/recommendations` added to `routes/api.php` (authenticated, throttle:30,1)
- [ ] Algorithm: 4-phase pipeline (profile → score → diversity → cold start)
  - **Phase 1 — Profile:** Query `user_tracking_events` + `behavioral_signals` for customer's last 50 interactions. Compute: category affinity (weighted by signal type), avg order value, avg product price viewed
  - **Phase 2 — Score:** For each active product: `categoryAffinity * 0.30 + popularity * 0.20 + freshness * 0.15 + novelty * 0.15 + priceFit * 0.10`
  - **Phase 3 — Diversity:** Cap any single category at 40% of results
  - **Phase 4 — Cold Start:** If customer has < 3 interactions, return `popular + new + featured` products instead
- [ ] Response shape: `{ recommendations: Product[], isPersonalised: boolean, profileSummary?: { topCategories, avgOrderValue, interactionCount } }`
- [ ] Products include: `id`, `name`, `slug`, `price`, `sale_price`, `images`, `unit`, `category` (relation), `is_featured`
- [ ] Max 20 results
- [ ] Graceful fallback: if tracking data is empty, return popular products
- [ ] Unit tests: profile construction, scoring weights, diversity cap, cold start detection
- [ ] Feature test: endpoint returns 200 with valid response shape

#### Files to touch
- `backend/app/Http/Controllers/Api/RecommendationController.php` (new)
- `backend/app/Services/RecommendationService.php` (new)
- `backend/routes/api.php`
- `backend/tests/Unit/Services/RecommendationServiceTest.php` (new)
- `backend/tests/Feature/RecommendationTest.php` (new)

---

### T-007: "Picked for You" section on Home Screen
**Type:** AFK
**Blocked by:** T-006, T-005

#### What to build
Add a personalized "Picked for You" horizontal carousel to the Home Screen, positioned between the hero section and the specials carousel. Uses the recommendation endpoint from T-006. For cold-start users, shows "Popular near you" instead. For personalised users, shows the top 10 recommended products with a subtle "Based on your browsing" label.

#### Acceptance criteria
- [ ] New `src/features/home/RecommendationsSection.tsx` component created
- [ ] Uses `useQuery` with `queryKeys.recommendations` to fetch from `/recommendations`
- [ ] Renders horizontal `FlatList` with `ProductCard` items (same card as BrowseScreen)
- [ ] Loading state: shows 4 skeleton cards (`ProductCardSkeleton`)
- [ ] Empty state: hidden entirely (no section rendered if no recommendations)
- [ ] Cold start: header says "Popular near you" when `isPersonalised === false`
- [ ] Personalised: header says "Picked for You" with small subtitle "Based on your browsing"
- [ ] Section has horizontal scroll with `showsHorizontalScrollIndicator={false}`
- [ ] Section is inserted into `HomeScreen.tsx` between hero gradient and existing specials section
- [ ] `queryKeys.ts` updated with `recommendations` key
- [ ] `apiClient.ts` updated with `fetchRecommendations()` function
- [ ] Section fades in with `FadeSlideIn` wrapper
- [ ] TypeScript compiles clean
- [ ] No visual regression in existing Home Screen sections

#### Files to touch
- `mobile/src/features/home/RecommendationsSection.tsx` (new)
- `mobile/src/features/home/HomeScreen.tsx`
- `mobile/src/lib/apiClient.ts`
- `mobile/src/lib/queryKeys.ts`

---

## Epic 4 — Product Favorites (blocks: T-009, T-010)

### T-008: Backend favorites table + API
**Type:** AFK
**Blocked by:** None

#### What to build
Add a `product_favorites` table and REST API for customers to save/unsave products. This is a simple many-to-many pivot: customer ↔ product. The mobile app needs this for the favorites screen (T-009) and the recommendation engine uses it as a high-weight signal.

#### Acceptance criteria
- [ ] Migration `create_product_favorites_table.php` creates table with:
  - `id` (bigint, PK)
  - `customer_id` (foreign key → `users.id`, cascade delete)
  - `product_id` (foreign key → `products.id`, cascade delete)
  - `created_at` (timestamp)
  - Unique constraint on (`customer_id`, `product_id`)
  - Index on `customer_id`
- [ ] `ProductFavorite` model with `$guarded = ['id']`, relation `customer()` → BelongsToMany User, relation `product()` → BelongsToMany Product
- [ ] `FavoriteController.php` with:
  - `index()` → returns customer's favorite products (paginated, 20 per page)
  - `store(Request $request)` → validates `product_id` exists, creates pivot row, returns 201
  - `destroy(Request $request, Product $product)` → deletes pivot row, returns 204
  - `check(Request $request, Product $product)` → returns `{ isFavorited: boolean }`
- [ ] Routes added to `routes/api.php` under auth middleware:
  - `GET /api/favorites` → `index`
  - `POST /api/favorites` → `store`
  - `DELETE /api/favorites/{product}` → `destroy`
  - `GET /api/favorites/{product}/check` → `check`
- [ ] Feature test: authenticated user can add, list, check, remove favorites
- [ ] Duplicate add returns 409 Conflict
- [ ] Unauthenticated returns 401

#### Files to touch
- `backend/database/migrations/2026_09_02_000001_create_product_favorites_table.php` (new)
- `backend/app/Models/ProductFavorite.php` (new)
- `backend/app/Http/Controllers/Api/FavoriteController.php` (new)
- `backend/routes/api.php`
- `backend/tests/Feature/FavoriteTest.php` (new)

---

### T-009: Mobile favorites service + API client
**Type:** AFK
**Blocked by:** T-008

#### What to build
Add favorites API client functions to the mobile app and a Zustand store for optimistic UI. The heart icon on ProductCard toggles favorites with instant UI feedback.

#### Acceptance criteria
- [ ] `apiClient.ts` updated with: `fetchFavorites(page)`, `addFavorite(productId)`, `removeFavorite(productId)`, `checkFavorite(productId)`
- [ ] `src/stores/favoritesStore.ts` created:
  - State: `favorites: Set<number>`, `loaded: boolean`
  - Actions: `toggleFavorite(productId)`, `loadFavorites()`, `isFavorite(productId)`
  - Optimistic: `toggleFavorite` flips Set immediately, then calls API; rolls back on error
  - Persist: loads from API on first use, caches in memory only (no AsyncStorage — fresh each session)
- [ ] `queryKeys.ts` updated with `favorites` key
- [ ] Unit test: toggleFavorite flips state, API called, rollback on error

#### Files to touch
- `mobile/src/lib/apiClient.ts`
- `mobile/src/stores/favoritesStore.ts` (new)
- `mobile/src/lib/queryKeys.ts`
- `mobile/src/stores/__tests__/favoritesStore.test.ts` (new)

---

### T-010: SaveHeart component + heart on ProductCard
**Type:** AFK
**Blocked by:** T-009

#### What to build
Build a `SaveHeart` component with burst animation (adapted from GreenBidder's SaveHeart). Place it on `ProductCard` and `ProductDetailScreen`. When tapped: scale overshoots to 1.45x, red burst ring scales from 0.4→2.2x while fading, haptic fires. Unsave: lighter feedback.

#### Acceptance criteria
- [ ] `src/components/shared/SaveHeart.tsx` created:
  - Props: `productId: number`, `size?: number`, `style?: StyleProp`
  - Animated heart icon using `lucide-react-native` `Heart` icon
  - Press-in: scale 1.0 → 1.45 with spring (damping=10, stiffness=240)
  - Burst ring: `Animated.View` that scales 0.4 → 2.2x while opacity 0.6 → 0, timing 400ms
  - Haptic: `Haptics.impactAsync(Medium)` on save, `Haptics.impactAsync(Light)` on unsave
  - Uses `useFavoritesStore` for optimistic toggle
- [ ] `ProductCard.tsx` renders `SaveHeart` positioned top-right of card image
- [ ] `ProductDetailScreen.tsx` renders `SaveHeart` positioned top-right of product image
- [ ] Heart fills red when favorited, outline when not
- [ ] Animation respects `useReducedMotion()` — instant toggle without animation when enabled
- [ ] TypeScript compiles clean
- [ ] Visual: heart overlaps card image corner, doesn't obscure price or title

#### Files to touch
- `mobile/src/components/shared/SaveHeart.tsx` (new)
- `mobile/src/components/shared/ProductCard.tsx`
- `mobile/src/features/product/ProductDetailScreen.tsx`

---

### T-011: Favorites screen — saved products grid
**Type:** AFK
**Blocked by:** T-009

#### What to build
A dedicated screen showing all favorited products in a 2-column grid, accessible from Account screen. Pull-to-refresh, infinite scroll, empty state with CTA to browse.

#### Acceptance criteria
- [ ] `src/features/favorites/FavoritesScreen.tsx` created:
  - Fetches paginated favorites from `GET /api/favorites`
  - 2-column `FlatList` with `ProductCard` items (same grid as BrowseScreen)
  - Pull-to-refresh with spinner
  - Infinite scroll: `onEndReached` loads next page
  - Empty state: `EmptyState` component with heart icon, "No favorites yet", "Browse products" CTA button
  - Loading state: `ProductCardSkeleton` × 4 grid
- [ ] `CustomerTabs.tsx` updated: "Account" tab replaced with a dedicated "Favorites" tab (heart icon), or Favorites accessible from Account screen as a list item
- [ ] Navigation: `Favorites` screen added to `CustomerTabParamList` or as a push from Account
- [ ] `Favorites` header shows count: "Your Favorites (12)"
- [ ] TypeScript compiles clean

#### Files to touch
- `mobile/src/features/favorites/FavoritesScreen.tsx` (new)
- `mobile/src/navigation/CustomerTabs.tsx` or `mobile/src/features/account/AccountScreen.tsx`
- `mobile/src/navigation/types.ts`

---

## Epic 5 — Motion & Physics (blocks: T-013, T-014)

### T-012: Easing curves + spring presets library
**Type:** AFK
**Blocked by:** None

#### What to build
Create `src/theme/curves.ts` — a library of named easing curves and spring presets ported from GreenBidder's `theme.js` (6 named curves + 9 spring presets). Update `src/theme/motion.ts` to re-export these. All animation code across the app can now reference named curves instead of raw bezier values.

#### Acceptance criteria
- [ ] `src/theme/curves.ts` created with:
  - `EASE_SETTLE`: bezier(0.22, 1, 0.36, 1) — gentle deceleration
  - `EASE_TACTILE`: bezier(0.34, 1.35, 0.64, 1) — strong decel + overshoot
  - `EASE_PLAYFUL`: bezier(0.34, 1.7, 0.6) — exaggerated overshoot
  - `EASE_READING`: bezier(0.25, 0.1, 0.3, 1) — slow, comfortable
  - `EASE_DROP`: bezier(0.5, 0, 0.2, 1) — gravity-like fall
  - `EASE_IN_QUICK`: bezier(0.5, 0, 0.9, 0.4) — fast exit
- [ ] `src/theme/curves.ts` also exports spring presets:
  - `SPRING_GENTLE`, `SPRING_STANDARD`, `SPRING_SNAPPY`, `SPRING_BOUNCY`, `SPRING_PRESS`, `CAROUSEL_SPRING`, `CRASH_SPRING`, `DOT_SPRING`, `PRESS_SPRING`
  - Each with: `damping`, `stiffness`, `mass`, `overshootClamping`
- [ ] `src/theme/motion.ts` re-exports everything from `curves.ts`
- [ ] All existing motion imports continue to work (backward compatible)
- [ ] TypeScript types exported for all curves and springs
- [ ] No visual changes anywhere

#### Files to touch
- `mobile/src/theme/curves.ts` (new)
- `mobile/src/theme/motion.ts`

---

### T-013: Physics-based carousel scroll
**Type:** AFK
**Blocked by:** T-012

#### What to build
Replace the static `FlatList` horizontal scroll on Home Screen specials and browse carousels with a physics-driven scroll using Reanimated worklets. Port GreenBidder's `scrollPhysics.js` (projectEndpoint, snapDecision, CAROUSEL_SPRING, rubberBand) to TypeScript. Carousels now feel magnetic — cards snap to position with tuned spring physics.

#### Acceptance criteria
- [ ] `src/utils/scrollPhysics.ts` created (TypeScript port of GreenBidder's `scrollPhysics.js`):
  - `projectEndpoint(offset, velocity, deceleration)` — worklet
  - `snapDecision(offset, endpoint, velocity, snapInterval, contentOffset, maxIndex)` — worklet, returns `{ targetOffset, targetIndex }`
  - `rubberBand(x, dim)` — worklet
  - `CAROUSEL_SPRING` config (damping=26, stiffness=180, mass=0.8)
  - All functions marked with `"worklet"` directive
- [ ] `src/components/shared/PhysicsCarousel.tsx` created:
  - Props: `data: any[], renderItem: Function, snapInterval: number, contentOffset?: number`
  - Uses `Animated.FlatList` with `Animated.ScrollView`
  - On scroll end: runs `projectEndpoint` + `snapDecision` worklets
  - Animates to target with `withSpring(targetOffset, CAROUSEL_SPRING)`
  - Rubber-band effect at edges via `rubberBand`
  - `decelerationRate` removed — physics handle it
- [ ] `HomeScreen.tsx` specials carousel replaced with `PhysicsCarousel`
- [ ] `BrowseScreen.tsx` product grid replaced with `PhysicsCarousel` (if horizontal) or left as FlatList (if vertical grid)
- [ ] Visual: cards snap cleanly to position, no mid-card resting, fast flicks skip cards
- [ ] Performance: all physics run on UI thread (worklets), zero JS bridge calls during scroll
- [ ] TypeScript compiles clean

#### Files to touch
- `mobile/src/utils/scrollPhysics.ts` (new)
- `mobile/src/components/shared/PhysicsCarousel.tsx` (new)
- `mobile/src/features/home/HomeScreen.tsx`
- `mobile/src/features/browse/BrowseScreen.tsx`

---

### T-014: Crash-cascade entrance animation for product cards
**Type:** AFK
**Blocked by:** T-012

#### What to build
Add a premium entrance animation to the product grid on BrowseScreen and the recommendations carousel. Cards fly in from the right with a bouncy spring, motion stretch, and impact squash — adapted from GreenBidder's BuyerFeedScreen entrance pattern.

#### Acceptance criteria
- [ ] `src/components/shared/CrashCascadeIn.tsx` created:
  - Props: `children`, `index`, `delay?: number`, `style?`
  - Animation: translateX from 100 → 0 with CRASH_SPRING (damping=9, stiffness=210, mass=0.75)
  - Motion stretch: scaleX elongates to 1.08 during slide (mimics motion blur)
  - Impact squash: on arrival, scaleX compresses to 0.95 then bounces back, scaleY puffs to 1.04
  - Stagger: 85ms per index, 100ms base delay
  - Respects `useReducedMotion()` — instant appear when enabled
- [ ] `BrowseScreen.tsx`: wraps each `ProductCard` in `CrashCascadeIn` with index-based stagger
- [ ] `RecommendationsSection.tsx`: wraps each recommendation card in `CrashCascadeIn`
- [ ] Animation plays once per mount (not on every re-render) — tracked via `useRef(hasAnimated)`
- [ ] Cards outside viewport don't animate (use `onViewableItemsChanged` or `renderItem` visibility check)
- [ ] TypeScript compiles clean
- [ ] Visual: first load shows cascade; subsequent scrolls are normal (no re-trigger)

#### Files to touch
- `mobile/src/components/shared/CrashCascadeIn.tsx` (new)
- `mobile/src/features/browse/BrowseScreen.tsx`
- `mobile/src/features/home/RecommendationsSection.tsx`

---

## Epic 6 — Push Notifications (blocks: T-016)

### T-015: Push notification token registration
**Type:** AFK
**Blocked by:** None

#### What to build
Wire up push notification token registration with the backend. The app already requests permissions and handles local notifications — but never registers the device token with the server. This ticket adds the registration flow so the backend can push notifications TO customers and riders.

#### Acceptance criteria
- [ ] `src/services/pushNotificationService.ts` created:
  - `registerForPushNotifications()` → calls `Notifications.getExpoPushTokenAsync()`, sends token to backend `POST /auth/device-token`
  - `unregisterPushNotifications()` → sends token deletion to backend `DELETE /auth/device-token`
  - Called on every app launch after authentication
- [ ] Backend: `AuthController::deviceToken()` stores push token on `users` table (add `push_token` column if missing, or use existing `device_tokens` table)
- [ ] Backend: `AuthController::removeDeviceToken()` clears push token
- [ ] Mobile: `session.ts` `signIn()` calls `registerForPushNotifications()` after setting token
- [ ] Mobile: `session.ts` `signOut()` calls `unregisterPushNotifications()` before clearing state
- [ ] `app.json` already has `expo-notifications` configured (verify)
- [ ] Push token stored securely (not in AsyncStorage)
- [ ] Backend can send push to specific user via their stored token
- [ ] Test: register → backend stores token → send test push → device receives it

#### Files to touch
- `mobile/src/services/pushNotificationService.ts` (new)
- `mobile/src/stores/session.ts`
- `backend/app/Http/Controllers/Api/AuthController.php`
- `backend/database/migrations/2026_09_02_000002_add_push_token_to_users_table.php` (new, if needed)
- `backend/routes/api.php`

---

### T-016: Push notifications for order status changes
**Type:** AFK
**Blocked by:** T-015

#### What to build
When an order status changes (confirmed, preparing, out_for_delivery, delivered), the backend sends a push notification to the customer. The existing local notification code in `OrderDetailScreen` is replaced with (or supplemented by) server-side push.

#### Acceptance criteria
- [ ] Backend: `OrderStatusChanged` event dispatched on every status transition
- [ ] Backend: `SendOrderPushNotification` listener catches the event, looks up customer's `push_token`, sends Expo push notification with title/body/data
- [ ] Push payload includes: `orderId`, `status`, `title` ("Order confirmed!", "Your rider is on the way!", etc.), `body` (status-specific message)
- [ ] Mobile: notification tap handler navigates to `OrderDetail` with the correct `orderId` (already exists, verify it works with server-pushed notifications)
- [ ] Notification categories set for iOS (order_update with actions: View Order)
- [ ] Rider also receives push when assigned an order (for future use)
- [ ] Test: place order → backend confirms → push arrives on device → tap navigates to order detail

#### Files to touch
- `backend/app/Listeners/SendOrderPushNotification.php` (new)
- `backend/app/Events/OrderStatusChanged.php` (new)
- `backend/app/Providers/EventServiceProvider.php` (register event-listener)
- `mobile/src/features/orders/OrderDetailScreen.tsx` (verify tap handler)

---

## Epic 7 — Deep Linking (blocks: None)

### T-017: Wire up checkstar:// deep links
**Type:** HITL (requires Apple/Google developer account config)
**Blocked by:** None

#### What to build
Wire up the `checkstar://` URL scheme (already in `app.json`) so links like `checkstar://order/123` or `checkstar://product/milk-2l` open the correct screen. Also support universal links for web → app handoff.

#### Acceptance criteria
- [ ] `expo-linking` installed and configured
- [ ] `Linking` configuration added to `NavigationContainer` in `App.tsx` with prefixes: `['checkstar://', 'https://checkstar.co.za/']`
- [ ] Deep link routes defined:
  - `checkstar://product/{slug}` → `ProductDetail` screen
  - `checkstar://order/{id}` → `OrderDetail` screen
  - `checkstar://` → `Tabs` (home)
- [ ] `useLinking` hook or `linking` prop on `NavigationContainer` handles initial URL (cold start)
- [ ] ` linking` prop handles in-app URLs (warm start)
- [ ] `app.json` updated: `scheme: "checkstar"`, `expo-linking` plugin added
- [ ] iOS: Associated Domains configured (requires HITL — Apple Developer account)
- [ ] Android: intent filter configured in `AndroidManifest.xml` (via Expo config plugin)
- [ ] Test: `npx expo start` → open `checkstar://product/milk-2l` → ProductDetail loads
- [ ] Test: `npx expo start` → open `checkstar://order/42` → OrderDetail loads

#### Files to touch
- `mobile/App.tsx`
- `mobile/app.json`
- `mobile/src/navigation/linking.ts` (new — linking config)

---

## Epic 8 — Reorder + Promo Codes (blocks: None)

### T-018: Reorder from order history
**Type:** AFK
**Blocked by:** None

#### What to build
Add a "Reorder" button on OrderDetailScreen and AccountScreen order history that adds all items from a past order to the current cart. Skips out-of-stock items and shows a summary of what was added vs skipped.

#### Acceptance criteria
- [ ] `apiClient.ts` updated with `fetchOrderById(orderId)` (already exists, verify it returns items)
- [ ] `src/features/orders/OrderDetailScreen.tsx`:
  - "Reorder" button added below the order items list
  - On tap: fetches order items, adds each to cart via `useCart.getState().addItem()` (respecting max quantity)
  - Shows toast: "Added 8 items to cart" or "Added 5 items, 3 unavailable"
  - Button disabled if all items already in cart at same quantity
  - Button hidden if order status is `pending` or `preparing`
- [ ] `src/features/account/AccountScreen.tsx`:
  - Each past order row gets a small "Reorder" icon button (refresh-cw icon)
  - Same logic as above
- [ ] Cart shows standard minimum order / free delivery messages after reorder
- [ ] TypeScript compiles clean

#### Files to touch
- `mobile/src/features/orders/OrderDetailScreen.tsx`
- `mobile/src/features/account/AccountScreen.tsx`
- `mobile/src/features/cart/store.ts` (verify `addItem` API)

---

### T-019: Promo code input at checkout
**Type:** HITL (requires backend promo code business logic decisions)
**Blocked by:** None

#### What to build
Add a promo code / voucher input field at checkout. Backend validates the code, applies discount to the order total, and returns the updated pricing. This is a HITL because the business needs to decide: discount types (percentage vs fixed), minimum order, expiry, usage limits.

#### Acceptance criteria
- [ ] Backend: `promotions` table created with: `id`, `code`, `type` (percentage/fixed), `value`, `min_order_cents`, `max_uses`, `used_count`, `expires_at`, `is_active`, `created_at`
- [ ] Backend: `PromotionController::validate()` — accepts `code`, returns `{ valid, discount_type, discount_value, discount_amount, new_total }` or error
- [ ] Backend: validation checks: code exists, is_active, not expired, used_count < max_uses, order meets min_order
- [ ] Backend: `PromotionController::apply()` — increments `used_count` atomically (DB transaction)
- [ ] Mobile: `CheckoutScreen.tsx` adds promo code input field (TextInput + Apply button) above order summary
- [ ] Mobile: on Apply → `POST /api/promotions/validate` → shows discount line in order summary
- [ ] Mobile: discount applied to `total` in order summary (not `subtotal`)
- [ ] Mobile: "Remove" link to clear promo code
- [ ] Mobile: error state shows inline message (e.g., "Code expired", "Minimum order R100")
- [ ] Feature test: valid code applies discount, invalid returns error, expired returns error

#### Files to touch
- `backend/database/migrations/2026_09_02_000003_create_promotions_table.php` (new)
- `backend/app/Models/Promotion.php` (new)
- `backend/app/Http/Controllers/Api/PromotionController.php` (new)
- `backend/routes/api.php`
- `backend/tests/Feature/PromotionTest.php` (new)
- `mobile/src/features/checkout/CheckoutScreen.tsx`
- `mobile/src/lib/apiClient.ts`

---

## Epic 9 — Polish (blocks: None)

### T-020: Enhanced haptics across the app
**Type:** AFK
**Blocked by:** None

#### What to build
Upgrade the existing haptics from basic `expo-haptics` calls to the intent-based API from GreenBidder's `haptics.js`. Add haptic feedback to all meaningful interactions: cart add/remove, order claim, favorite toggle, checkout, pull-to-refresh bottom, quantity stepper limits.

#### Acceptance criteria
- [ ] `src/utils/haptics.ts` created (TypeScript port of GreenBidder's `haptics.js`):
  - `haptic.tap()` — light impact (iOS Light, Android Medium)
  - `haptic.commit()` — medium impact
  - `haptic.impact()` — heavy impact
  - `haptic.success()` — success notification pattern
  - `haptic.warning()` — warning notification pattern
  - `haptic.error()` — error notification pattern
  - `haptic.selection()` — selection tick
  - Platform-aware: iOS gets Light for tap, Android gets Medium
- [ ] `TactilePressable.tsx` updated to use `haptic.ts` (replace direct `expo-haptics` calls)
- [ ] Cart add: `haptic.commit()` when quantity increases
- [ ] Cart remove: `haptic.tap()` when quantity decreases
- [ ] Cart max limit reached: `haptic.warning()` when trying to exceed 8
- [ ] Favorite toggle: `haptic.commit()` on save, `haptic.tap()` on unsave
- [ ] Checkout success: `haptic.success()`
- [ ] Order claim (rider): `haptic.commit()`
- [ ] Pull-to-refresh bottom: `haptic.selection()`
- [ ] Search clear: `haptic.tap()`
- [ ] All existing haptic calls migrated to new API
- [ ] TypeScript compiles clean

#### Files to touch
- `mobile/src/utils/haptics.ts` (new)
- `mobile/src/components/shared/TactilePressable.tsx`
- `mobile/src/components/shared/SaveHeart.tsx` (from T-010)
- `mobile/src/features/cart/CartScreen.tsx`
- `mobile/src/features/checkout/CheckoutScreen.tsx`
- `mobile/src/features/rider/RiderHomeScreen.tsx`
- `mobile/src/features/search/SearchScreen.tsx`

---

### T-021: ScrollAwareCard — cover-flow parallax on horizontal scroll
**Type:** AFK
**Blocked by:** T-013

#### What to build
Add a `ScrollAwareCard` component that creates a cover-flow effect on horizontal carousels. Cards scale, fade, and parallax-drift based on distance from viewport center. Ported from GreenBidder's `ScrollAwareCard.jsx`.

#### Acceptance criteria
- [ ] `src/components/shared/ScrollAwareCard.tsx` created:
  - Props: `children`, `scrollX`, `itemWidth`, `spacing`, `style?`
  - Inner 60% of viewport is "focus zone" — cards at full scale (1.0) and opacity (1.0)
  - Outside focus zone: scale interpolates 1.0 → 0.92, opacity 1.0 → 0.65
  - Parallax drift: ±8px translateY based on distance from center
  - Uses `useAnimatedStyle` with `interpolate` on `scrollX` shared value
- [ ] `PhysicsCarousel.tsx` wraps each item in `ScrollAwareCard`
- [ ] Visual: center card is largest/brightest, edge cards are smaller/dimmer
- [ ] Smooth 60fps — all worklet-based, no JS thread involvement
- [ ] TypeScript compiles clean

#### Files to touch
- `mobile/src/components/shared/ScrollAwareCard.tsx` (new)
- `mobile/src/components/shared/PhysicsCarousel.tsx`

---

## Ticket Summary

| # | Title | Type | Epic | Blocked By |
|---|-------|------|------|------------|
| T-001 | expo-image swap | AFK | 1 | — |
| T-002 | Centralize hardcoded constants | AFK | 1 | — |
| T-003 | React Error Boundaries | AFK | 1 | — |
| T-004 | Mobile tracking service | AFK | 2 | — |
| T-005 | Wire tracking into screens | AFK | 2 | T-004 |
| T-006 | Backend recommendation endpoint | AFK | 3 | T-004 |
| T-007 | "Picked for You" on Home | AFK | 3 | T-006, T-005 |
| T-008 | Backend favorites table + API | AFK | 4 | — |
| T-009 | Mobile favorites service | AFK | 4 | T-008 |
| T-010 | SaveHeart component | AFK | 4 | T-009 |
| T-011 | Favorites screen | AFK | 4 | T-009 |
| T-012 | Easing curves + spring presets | AFK | 5 | — |
| T-013 | Physics-based carousel | AFK | 5 | T-012 |
| T-014 | Crash-cascade entrance | AFK | 5 | T-012 |
| T-015 | Push notification registration | AFK | 6 | — |
| T-016 | Push for order status | AFK | 6 | T-015 |
| T-017 | Deep linking | HITL | 7 | — |
| T-018 | Reorder from history | AFK | 8 | — |
| T-019 | Promo codes | HITL | 8 | — |
| T-020 | Enhanced haptics | AFK | 9 | — |
| T-021 | ScrollAwareCard parallax | AFK | 9 | T-013 |

---

## Dependency Graph (text)

```
T-001 ─────────────────────────────────┐
T-002 ─────────────────────────────────┤ (independent)
T-003 ─────────────────────────────────┤
T-004 ──→ T-005 ──→ T-007             │
T-004 ──→ T-006 ──→ T-007             │
T-008 ──→ T-009 ──→ T-010             │
T-008 ──→ T-009 ──→ T-011             │
T-012 ──→ T-013 ──→ T-021             │
T-012 ──→ T-014                        │
T-015 ──→ T-016                        │
T-017 ─────────────────────────────────┤ (independent, HITL)
T-018 ─────────────────────────────────┤ (independent)
T-019 ─────────────────────────────────┘ (independent, HITL)
T-020 ─────────────────────────────────┘ (independent)
```

## Suggested Execution Order

**Wave 1 (parallel, no blockers):**
T-001, T-002, T-003, T-004, T-008, T-012, T-015, T-017, T-018, T-019, T-020

**Wave 2 (after Wave 1 completes):**
T-005 (needs T-004), T-006 (needs T-004), T-009 (needs T-008), T-013 (needs T-012), T-014 (needs T-012), T-016 (needs T-015)

**Wave 3 (after Wave 2 completes):**
T-007 (needs T-005 + T-006), T-010 (needs T-009), T-011 (needs T-009), T-021 (needs T-013)
