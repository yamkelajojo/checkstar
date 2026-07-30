# 08 — Rider Onboarding & Dashboard

**What to build:** Someone can register as a Rider (name, email, password, phone, vehicle type, mock banking fields). They log into a Rider dashboard showing their assigned store, availability toggle (green/red with pulsing dot), and a list of available claimable orders at their store. The Rider can toggle availability on/off at any time.

**Blocked by:** 01 — Store Finder, 03 — Customer Auth

**Status:** ready-for-agent

- [ ] `riders` table migration (user_id FK, store_id FK, vehicle_type, is_available, banking_details JSON, total_deliveries, average_rating, xp, level)
- [ ] Extended registration flow for Rider role (extra fields)
- [ ] Rider dashboard page — store info, availability toggle, pending orders list
- [ ] Availability toggle API + UI (motion layout animation, pulsing dot)
- [ ] Seeder with 2-3 demo Riders per store
- [ ] Vitest API tests + Playwright e2e (register Rider → toggle availability)
