# 03 — Customer Auth

**What to build:** A visitor can register as a Customer (name, email, password, phone), log in, and log out. Authenticated Customers see their profile page with their details. Unauthenticated visitors are redirected to login when visiting protected routes. Laravel Sanctum handles SPA cookie-based auth — no token management on the frontend.

**Blocked by:** 00 — Scaffold Monorepo

**Status:** ready-for-agent

- [ ] `users` table migration with `role` enum column (`customer`, `rider`, `store_manager`, `store_owner`, `logistics_officer`, `developer`)
- [ ] Register endpoint with role selection (default: customer)
- [ ] Login/logout endpoints (Sanctum SPA)
- [ ] `GET /api/me` returning current user profile
- [ ] Login page + Register page with role dropdown
- [ ] Auth context / Zustand auth store for session state
- [ ] Route protection — unauthenticated visitors redirected to login
- [ ] Profile page with edit name/email/phone
- [ ] Vitest API tests + Playwright e2e (register → login → view profile)
