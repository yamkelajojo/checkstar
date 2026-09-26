# Checkstar Admin Dashboard Polish Plan

Based on user testing feedback, here are the issues to address:

## Issues Identified

### 1. Images not appearing in Inventory tab
- **File**: `frontend/src/app/(admin)/admin/inventory/InventoryClient.tsx` (lines 240-246)
- **Problem**: Product images use `<img src={product.image} />` but `product.image` may be a relative path needing a full URL, or the backend may not be returning images for store-scoped inventory queries.
- **Finding**: Product images exist in `checkers_images/` directory at repo root (e.g., `checkers_69e71b302de6_Simply Great Butternut Beetroot & Feta Salad 250g.webp`). These are likely served via Laravel storage or CDN. The API probably returns a filename or relative path that needs a base URL prepended.

### 2. Cannot see products of an order in Orders tab (Manager view)
- **File**: `frontend/src/app/(admin)/admin/orders/StoreOrdersClient.tsx` (lines 292-307)
- **Problem**: Order items ARE rendered in the order card, but the user (logged in as Manager) says they cannot see them. The API response for store-orders does NOT include `items` for non-developer roles (confirmed via Network tab).
- **Fix needed**: Backend API must include order items with product snapshots for store-scoped queries, not just developer role.

### 3. Search icon button on order card navigates to wrong page
- **File**: `frontend/src/app/(admin)/admin/orders/StoreOrdersClient.tsx` (lines 282-288)
- **Problem**: The `<Search />` icon wrapped in a Link goes to `/account/orders/${order.id}` (customer-facing order detail), not an admin order detail view. User wants this removed entirely and products shown inline.
- **Decision**: Create new admin order detail page at `/admin/orders/[id]` with full order details. Remove the Search icon link.

### 4. Web app is slow - performance concerns
- **Frontend**: React Query (TanStack Query) with client-side fetching for all admin pages. Many parallel queries on dashboard (products, categories, stores, specials, recipes, contact messages, health, store orders, pending dispatch, inventory).
- **Backend**: Laravel with default cache store = `database` (not Redis). Redis is configured but not enabled by default (`CACHE_STORE=database`).
- **Operations page**: Refetches metrics every 30s, alerts every 60s.
- No SSR caching, no HTTP caching headers visible, no image optimization config found.
- **Decision**: Enable Redis caching on backend (`CACHE_STORE=redis`) AND add `staleTime` to React Query hooks to reduce redundant refetches.

### 5. `base.toFixed is not a function` error in Sales (Specials) tab
- **File**: `frontend/src/app/(admin)/admin/specials/SpecialsAdminClient.tsx` (line 360)
- **Problem**: `const base = p.sale_price != null && Number(p.sale_price) < p.price ? p.sale_price : p.price` - if `p.price` is a string, `base` becomes a string and `.toFixed(2)` fails.
- **Decision**: Audit all similar `.toFixed()` patterns across the codebase and fix them.

### 6. Audit Logs tab has no back navigation
- **File**: `frontend/src/app/(dashboard)/operations/audit-logs/AuditLogsClient.tsx`
- **Problem**: No back button/Link to return to Operations overview.
- **Decision**: Add back button linking to `/admin/dashboard`.

### 7. Map not working in Live Operations
- **File**: `frontend/src/components/MapContainer.tsx` + `MapContainer.css`
- **Problem**: Uses Leaflet with OpenStreetMap tiles. The map container has `height: 100%` but parent may not have explicit height. CSS sets `.MapContainer { height: 100%; background: #090B10 }` - if parent has no height, map collapses. Also, Leaflet's default marker icons may not load without explicit icon configuration.
- **Decision**: Switch to **Mapbox GL JS** with access token. Better tiles, traffic data, geocoding, and more reliable rendering. Need to add `MAPBOX_ACCESS_TOKEN` env var. Mobile app will need separate implementation (react-native-mapbox-gl or similar).

### 8. Edit Banner form needs UX/design improvements
- **File**: `frontend/src/app/(admin)/admin/banners/BannersClient.tsx` (BannerForm component, lines 163-318)
- **Problems**:
  - Inputs lack proper labels/associations
  - Color picker UX could be improved
  - Slide editor accordion pattern may be confusing
  - No visual hierarchy between sections
  - Typography could follow Apple's design principles more closely
- **Decision**: Redesign with all improvements — visual polish (Apple-style typography/spacing), accessibility (proper labels, ARIA, keyboard nav), workflow efficiency (fewer clicks, better slide management). Research references in `.opensrc` and web for best-in-class banner editors.

### 9. Dashboard Home 'No Store linked' card not centered
- **File**: `frontend/src/app/(admin)/admin/dashboard/AdminDashboardClient.tsx` (lines 85-103)
- **Problem**: EmptyState component renders in a container but may not be centered horizontally within the max-w-5xl container.
- **Decision**: Add horizontal centering (flex justify-center) to the parent container.

---

## Investigation Needed (Questions for User)

Before implementing fixes, I need to clarify some decisions:

---

### Issue 1: Inventory Images
**Q1**: What is the expected format of `product.image` in the API response for store inventory? Is it a full URL, a relative path (e.g., `/images/products/xyz.webp`), or a filename that needs a CDN prefix? The current code uses it directly as `src`.

---

### Issue 2: Order Items for Manager
**Q2**: When logged in as Store Manager, does the `/api/admin/store-orders` endpoint return `items` on each order? Or is that only included for developer role? We need to verify the API response shape for different roles.

---

### Issue 3: Search Icon Removal
**Q3**: You want the Search icon button removed entirely from the order card in the Admin Orders page. Should we also add a proper "View Order Details" action that goes to an admin-specific order detail page (which may need to be created), or is inline display of items sufficient?

---

### Issue 4: Performance
**Q4**: For performance improvements, which approach do you prefer?
- **A**: Enable Redis caching on backend (change `CACHE_STORE=redis`) + add HTTP caching headers
- **B**: Add React Query `staleTime` to reduce refetches + implement server-side caching
- **C**: Both A and B
- **D**: Something else (e.g., pagination, virtualization, suspense boundaries)

Also: Should we add a loading skeleton that's more granular, or is the current skeleton approach acceptable once caching is in place?

---

### Issue 5: base.toFixed Bug
**Q5**: The fix is straightforward: ensure `base` is a number before calling `.toFixed(2)`. Should we also fix similar patterns elsewhere in the codebase, or only this specific instance?

---

### Issue 6: Audit Logs Back Button
**Q6**: Should the back button go to `/operations` (the Operations overview page) or somewhere else?

---

### Issue 7: Map Not Working
**Q7**: The Live Operations map uses Leaflet + OpenStreetMap (free). You mentioned map functionality is "crucial" and needed for both web and mobile. Do you want to:
- **A**: Fix the current Leaflet implementation (container height, tile loading)
- **B**: Switch to a different provider (Mapbox, Google Maps) with API keys
- **C**: Keep Leaflet but add fallback/error handling for tile failures

Also: The mobile app likely needs its own map implementation (react-native-maps or similar).

---

### Issue 8: Banner Form Design
**Q8**: For the Banner form redesign, do you have a specific design reference or should I:
- Research Apple's design principles for forms
- Look at examples in `C:\Users\Acer\.opensrc` (mentioned as having UI libraries)
- Search the web for best-in-class banner/promo editors

What's the priority: visual polish, accessibility, or workflow efficiency (e.g., fewer clicks to create a banner)?

---

### Issue 9: No Store Linked Card Alignment
**Q9**: The EmptyState in the Staff Dashboard (when no store is linked) should be centered. Should it be:
- **A**: Centered within the `max-w-5xl` container (horizontal only)
- **B**: Centered both horizontally and vertically (flex center in viewport)
- **C**: Something else

---

## Next Steps

Once you answer these questions, I'll create a detailed implementation plan with file changes and start executing fixes.