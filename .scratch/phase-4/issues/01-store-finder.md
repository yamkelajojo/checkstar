# 01 — Store Finder

**What to build:** A visitor sees all 3 Checkstar stores on a Leaflet map with interactive markers. Below the map, animated store cards display each store's address, phone, trading hours, and delivery radius. Clicking a card focuses its marker on the map.

**Blocked by:** 00 — Scaffold Monorepo

**Status:** ready-for-agent

- [ ] `stores` table migration + Eloquent model (address, phone, trading_hours JSON, delivery_radius_km, lat, lng)
- [ ] Seeder with 3 Durban stores
- [ ] `GET /api/stores` endpoint returning all stores
- [ ] Store Finder page with Leaflet map + animated store cards (motion enter/whileHover)
- [ ] Card-marker interaction (click card → focus marker)
- [ ] Vitest API test + basic component test
