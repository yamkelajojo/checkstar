# Local Agent Handoff — How to pull & run Checkstar manually on Windows

> This doc is for the AI coding agent running **on the user's Windows machine** to set up the environment for manual E2E testing.

## 1. Where the work lives

- **GitHub repo**: `yamkelajojo/checkstar`
- **Working branch**: `arena/01a0c3d7-checkstar` (this session's branch, tracks Arena)
- **Base**: branched from `cbd64e1` → `ae29419` (master)
- **Remote**: `origin` = `https://github.com/yamkelajojo/checkstar.git`

### Latest commits on this branch (top = newest)
```
6bfcd75 feat: mandatory live order tracking + real-time rider location + recipe matching improvements
a9d5b06 ci: backend diagnostics [skip ci]
b32d147 docs: handoff guide for local Windows agent
3819346 feat: complete remaining admin CRUD — recipes, community, careers, health
549975a feat: add account sub-nav for profile/orders/favorites/dispatch
af20ab6 fix: dispatch policy must filter riders by store_id
2cafb20 feat: complete MVP admin gaps — products, categories, specials, stores, users, riders, audit logs, favorites
a98153a fix: mobile hand-in-hand polish — checkout saved-address gate, rider toast, cart storeProductId normalization, product detail availability, formatter test
```

### New in 6bfcd75 (your requested 3 features)
- **Order tracking page with live map (web + mobile) — MANDATORY**
  - `frontend/src/lib/polyline.ts` — decoder shared with mobile
  - `frontend/src/lib/api.ts`: `getOrderRiderLocation`, `getRoute`, `getRouteGeometry`
  - `frontend/src/lib/query.ts`: `useOrderRiderLocation` (5s poll), `useRoute`, `useRouteGeometry`
  - `frontend/src/components/OrderTrackingMap.tsx`: leaflet map, polls rider location 5s, stale 90s, LIVE/STALE badge, OSRM geometry polyline with dashed fallback, fitBounds, metrics overlay
  - `frontend/src/app/(account)/account/orders/[id]/OrderDetailClient.tsx`: embeds tracking when status in [confirmed, preparing, out_for_delivery, retrying] and delivery method
  - `frontend/src/app/(account)/account/orders/[id]/tracking/page.tsx` + `TrackingClient.tsx`: full-height tracking page with store/rider/delivery cards + how-it-works explainer
  - Mobile: `LiveDeliveryMap` already had 5s polling, pulse animation, stale detection; now also fetches `fetchRouteGeometry` if geometry prop missing, so map shows OSRM route even when OrderDetailScreen doesn't pass geometry
- **Rider location tracking real-time**
  - Mobile rider: `useRiderLocationUpdates` sends GPS every 30s while active deliveries (`expo-location` Balanced accuracy)
  - Backend: `POST /rider/location` stores in `rider_locations`, `GET /orders/{id}/rider-location` returns latest with `recorded_at`
  - Customer polling 5s gives near real-time; WebSocket upgrade path documented (Laravel Reverb/Pusher can replace polling, API ready)
- **Recipe ingredient matching improvements**
  - `frontend/src/lib/ingredientMatch.ts`: expanded STOPWORDS (tbsp, tsp, cup, softened, halved, peeled, etc.), phrase synonyms (baby marrow→zucchini, brinjal/aubergine→eggplant, mielie→corn, naartjie→mandarin, bell pepper/capsicum→pepper, coriander↔cilantro, chilli↔chili, yoghurt↔yogurt, chickpea↔garbanzo), token synonyms canonical map, Levenshtein fuzzy (≤1 for ≥4 chars, ≤2 for ≥7), improved ranking (matched count, coverage, positional, ingredient coverage, shorter canonical, fuzzy penalty)
  - New tests: `ingredientMatch.improved.test.ts` 9 tests covering SA synonyms + fuzzy
  - Existing tests still pass: seed regression 5 tests + 11 unit tests
```

### What changed (summarized)
**Backend**
- `app/Services/DispatchPolicy.php`: added `where('store_id', $store->id)` — was returning any rider regardless of store, breaking `test_eligible_rider_returns_null_when_no_riders_match_store` and allowing cross-store dispatch. Now 439 tests pass.
- No other backend logic changed in this stretch (seeders, controllers already existed).

**Frontend `lib/api.ts`**
- Added admin methods: `getAdminProducts/Categories/Specials/Stores/Users/Riders/Recipes/CommunityPosts/Careers`, create/update/delete for each, `getAuditLogsForEntity`, `getFavorites/addFavorite/removeFavorite/checkFavorite`, `getRecommendations`, `getAdminHealth`.

**Frontend `lib/query.ts`**
- Added hooks: `useAdminProducts/Create/Update/Delete`, same for categories, specials, stores, users, riders, recipes, community, careers, `useAdminHealth`, `useFavorites/Add/Remove`, `useRecommendations`, `useAuditLogsForEntity`. Normalized paginated handling (`data` vs `Paginated`).

**Frontend admin UIs (all new, developer-only)**
- `app/(admin)/admin/products/ProductsClient.tsx` + page
- `categories/CategoriesClient`
- `specials/SpecialsAdminClient`
- `stores/StoresAdminClient`
- `users/UsersClient`
- `riders/RidersClient`
- `recipes/RecipesAdminClient` (JSON ingredients editor)
- `community/CommunityAdminClient` (gallery/csr)
- `careers/CareersAdminClient` (full_time/part_time/contract)
- `health/HealthClient` (shows php/laravel version, timestamp, raw JSON)
- `operations/audit-logs/AuditLogsClient`
- `account/favorites/FavoritesClient` + page
- `components/FavoriteHeart.tsx` — heart toggle on `ProductCard`, auth-gated, optimistic
- `components/AccountSubNav.tsx` — sticky tabs for Profile/Orders/Favorites/Dispatch (role-gated)
- `app/(admin)/admin/dashboard/AdminDashboardClient.tsx` — added Catalog Management grid (products, categories, specials, stores, users, riders, recipes, community, careers) + health in Operations
- `components/DashboardNav.tsx` — labels for all new routes
- `app/(admin)/__tests__/manager-surfaces.test.tsx` — updated to expect 19 real links, no `#`

**Verification**
- `frontend: npx tsc --noEmit` clean
- `frontend: npm run test -- --run` → 33 files 240 tests (231 + 9 new synonym/fuzzy)
- `mobile: npm test` → 64 suites 611 tests
- `backend: php artisan test` → 439 passed (was 1 fail)
- New tracking: `OrderTrackingMap` uses `MapContainer` (leaflet), `useOrderRiderLocation` polls 5s, `useRouteGeometry` fetches OSRM polyline

## 2. How to pull on Windows

Open PowerShell / Git Bash in your local clone:

```powershell
cd C:\path\to\checkstar

# make sure remote is correct
git remote -v
# should show origin https://github.com/yamkelajojo/checkstar.git

git fetch origin

# if you already have the branch checked out:
git checkout arena/01a0c3d7-checkstar
git reset --hard origin/arena/01a0c3d7-checkstar
# OR if you want to keep local changes:
git pull origin arena/01a0c3d7-checkstar

# if you don't have it yet:
git checkout -b arena/01a0c3d7-checkstar origin/arena/01a0c3d7-checkstar

git log --oneline -10
# you should see 3819346 on top
git status
```

If you get `fetch first` rejection when pushing later, always:
```
git fetch origin refs/heads/arena/01a0c3d7-checkstar:refs/remotes/origin/arena/01a0c3d7-checkstar --force
git rebase origin/arena/01a0c3d7-checkstar
git push origin arena/01a0c3d7-checkstar
```

## 3. Environment setup for 3-terminal manual E2E

### Terminal 1 — Backend :8000 (Laravel + SQLite seed)

```powershell
cd backend

# copy env
copy .env.example .env
# edit .env: set APP_URL=http://localhost:8000, FRONTEND_URL=http://localhost:3000
# set DB_CONNECTION=sqlite, DB_DATABASE=database/database.sqlite
# set DEVELOPER_PASSWORD=password (or your own) so demo accounts seed

php -v
# needs PHP ^8.2, composer installed

composer install

php artisan key:generate

# create sqlite file
if (!(Test-Path database/database.sqlite)) { New-Item -ItemType File -Path database/database.sqlite }

php artisan migrate:fresh --seed
# seeds: 3 stores (durban-central, umhlanga, pinetown), categories, products, 5 riders, recipes, community, specials, banners, orders

# optional: check seed
php artisan tinker --execute "echo \App\Models\Store::count();"

php artisan serve --host=0.0.0.0 --port=8000
# backend now at http://localhost:8000/api
```

**Test accounts seeded** (password = `password` for all):
- `dev@checkstar.co.za` — developer (full CRUD)
- `john@example.com` — customer
- `mock@checkstar.co.za` — mock shopper (customer)
- `owner@checkstar.co.za` — store_owner (Durban Central owner)
- `manager@checkstar.co.za` — store_manager (Durban Central)
- `logistics@checkstar.co.za` — logistics_officer
- Riders:
  - `thabo@checkstar.co.za` (Durban Central, motorbike)
  - `lindiwe@checkstar.co.za` (Durban Central, scooter)
  - `sipho@checkstar.co.za` (Umhlanga)
  - `zanele@checkstar.co.za` (Umhlanga)
  - `bongani@checkstar.co.za` (Pinetown)

### Terminal 2 — Frontend :3000 (Next.js)

```powershell
cd frontend

# create .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api
# (or http://127.0.0.1:8000/api)

npm install
npm run dev -- --port 3000 --hostname 0.0.0.0
# frontend at http://localhost:3000
# also: npx tsc --noEmit && npm run test -- --run to verify
```

**Key flows to test manually:**

**Customer (mock@checkstar.co.za / password):**
1. Browse `/products`, click ProductCard — heart icon toggles favorite (if logged in)
2. Add to cart → cart icon toast
3. `/cart` → checkout
   - Saved address gate: if you have addresses in `/account/profile`, checkout shows them; selecting one fills coords
   - Or add new address with map
   - Fulfillment: backend finds nearest store that can fulfill full cart (StoreFulfillmentService)
   - Place order → `OrderPlacementResult`
4. `/account/orders` → history, click order → **Live Tracking map** should appear when status is confirmed/preparing/out_for_delivery (delivery only, not pickup)
   - Map shows store pin (Checkstar orange teardrop), delivery pin (green dot), rider pin (orange with LIVE badge, pulse animation on mobile, static on web)
   - Polls every 5s, shows STALE if no update 90s, shows last updated time
   - Route polyline from OSRM if available, else dashed straight line store→rider→delivery
   - Click "Full tracking" → `/account/orders/[id]/tracking` → full-height map 520px + info cards + how-it-works explainer
5. Confirm delivery when out_for_delivery, rate rider (review)
6. `/account/favorites` → should list favorited products, add to cart, remove
7. Check `SaveHeart` on product detail as well
8. **Recipe ingredient matching**: go to `/recipes/classic-sa-braai` — each ingredient should show product thumbnail that links to product page (e.g., "4 chicken thighs" → Grain Field Chickens, "2 tbsp butter" → Butter, "white bread" → SASKO, "red apples" → Top Red Apples, etc.). Test SA synonyms: create a test recipe with "baby marrow" should link to zucchini, "brinjal" to eggplant, "mielie" to corn, "naartjie" to mandarin, "capsicum" to pepper, typo "mozzarela" should still link to mozzarella via fuzzy.

**Rider (thabo@checkstar.co.za / password):**
- Login → rider dashboard (mobile or frontend if you have rider UI, but primarily mobile)
- Toggle availability
- `/rider/available-orders` → claim → mark items bought (must pass item_ids array), out_for_delivery, delivered
- Stats/history

**Store Manager (manager@checkstar.co.za):**
- `/admin/dashboard` → shows Staff Dashboard with Your Tools (banners, staff, inventory, orders, operations, dispatch) — not messages (developer only)
- `/admin/inventory` → update stock
- `/admin/orders` → scoped to Durban Central, status updates
- `/account/dispatch` → pending orders within store radius, assign rider (now correctly scoped by store_id)

**Store Owner (owner@checkstar.co.za):**
- Same as manager + `/admin/staff` hire/revoke, `/admin/banners`, `/operations`, `/operations/analytics`, `/operations/audit-logs`, `/account/dispatch`

**Logistics Officer (logistics@checkstar.co.za):**
- `/admin/inventory`, `/admin/orders`, `/account/dispatch`, `/operations` map/metrics/alerts/event feed

**Developer (dev@checkstar.co.za):**
- `/admin/dashboard` → Overview stats + Store Management + Catalog Management (now 9 links: products, categories, specials, stores, users, riders, recipes, community, careers) + Operations (live ops, analytics, audit-logs, dispatch, health)
- Every link must resolve — test each:
  - `/admin/products` CRUD
  - `/admin/categories` CRUD
  - `/admin/specials` CRUD
  - `/admin/stores` CRUD
  - `/admin/users` role update
  - `/admin/riders` store assignment
  - `/admin/recipes` — JSON ingredients array e.g. `[{"name":"Spinach","amount":"1 bunch"}]`
  - `/admin/community` — gallery/csr
  - `/admin/careers` — full_time/part_time/contract
  - `/admin/banners` CRUD
  - `/admin/messages` inbox, mark-read on open, reply
  - `/admin/staff` roster RBAC, owner protection, hire validation, 409 handling
  - `/operations` — live map, metrics, alerts, event feed
  - `/operations/analytics` — sales, products, riders
  - `/operations/audit-logs` — searchable
  - `/account/dispatch` — dispatch/reassign with validation
  - `/admin/health` — system health card

### Terminal 3 — Mobile Expo tunnel

```powershell
cd mobile

npm install

# .env or app.json: EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8000/api
# For tunnel, use your machine's LAN IP, not localhost, so phone can reach backend
# e.g. EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api

npx expo start --tunnel
# scan QR with Expo Go
# Test same customer flow: browse, cart, checkout (saved-address gate), place, orders, rider flow
```

**Mobile specific checks (from a98153a polish + 6bfcd75 tracking):**
- Checkout saved-address gate: if user has addresses, shows them; must select one before placing
- Rider toast: after claim, shows toast
- Cart storeProductId normalization: cart items keep storeProductId
- Product detail availability: shows if out of stock at nearest store
- **Live tracking mandatory**: in `OrderDetailScreen`, when order status is confirmed/preparing/out_for_delivery, `LiveDeliveryMap` appears (store pin, delivery dot, rider orange dot with LIVE badge, pulse animation, stale detection). Polls `fetchOrderRiderLocation` every 5s, fetches `fetchRouteGeometry` if geometry not provided, so OSRM route shows even without prop. Test by placing order as customer, then as rider `thabo@...` claim it and keep app open — rider location updates every 30s via `useRiderLocationUpdates`, customer map should move.

## 4. Troubleshooting for local agent

- **Backend 500**: check `storage/logs/laravel.log`, ensure `APP_KEY` set, `database.sqlite` exists and writable, `php artisan migrate:fresh --seed` rerun
- **CORS**: `config/cors.php` should allow `http://localhost:3000` and `exp://*`; `SANCTUM_STATEFUL_DOMAINS` includes `localhost:3000`
- **Auth 401**: ensure `php artisan serve` running, `NEXT_PUBLIC_API_URL` points to `/api`, and frontend does `getCsrfCookie` before login (handled in `api.ts` with XSRF token + 20s timeout)
- **Add to Cart disabled when fulfillment can find alt store**: fixed in `StoreFulfillmentService` + frontend availability logic — should now find alternative store within radius if primary out of stock
- **403 dead-ends**: all dashboard links now real; if you see 403, check user role vs route middleware in `routes/api.php`
- **Expo tunnel can't reach backend**: use LAN IP in `EXPO_PUBLIC_API_URL`, ensure Windows Firewall allows port 8000, both phone and PC on same WiFi if not using tunnel, or use `npx expo start --tunnel --host`

## 5. What to do next after pull

1. Pull branch as above
2. Run backend tests: `cd backend && php artisan test --filter=DispatchPolicyTest` — should pass now (store_id fix)
3. Run frontend tests: `cd frontend && npm run test -- --run` — expect 240 pass (33 files, includes 9 new synonym/fuzzy tests)
4. Run mobile tests: `cd mobile && npm test` — expect 611 pass
5. Start 3 terminals and run manual E2E checklist above, **especially**:
   - Customer order → tracking map appears in `/account/orders/[id]` + full page `/account/orders/[id]/tracking`
   - Rider app open with active delivery → customer map rider dot moves (poll 5s, rider sends 30s)
   - Recipe page `/recipes/classic-sa-braai` thumbnails + test SA synonyms
6. If any new admin page missing or 403, check `AdminDashboardClient.tsx` roles and backend `role:developer` middleware
7. For WebSocket real-time upgrade (optional future): backend needs `laravel/reverb` or Pusher, `broadcasting.php`, `RiderLocationUpdated` event, frontend `laravel-echo` + `pusher-js` subscribing to `order.{id}.rider-location` — current polling is production-ready and works without extra infra

---

**End of handoff. Branch ready for manual Windows testing.**
