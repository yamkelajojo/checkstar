# 00 — Scaffold Monorepo

**What to build:** Both projects initialized and wired together — `backend/` (Laravel 11 API-only, Sanctum SPA auth, SQLite dev config, Redis config for cache/sessions/queues) and `frontend/` (Next.js App Router + React 19, motion/core, shadcn/ui, Zustand v5, Tailwind v3 with brand tokens, Leaflet + OpenStreetMap, Vitest + Playwright). Next.js rewrites `/api/*` to the Laravel dev server. Basic ESLint, Prettier, and `.gitignore` in place. Running `npm run dev` in each boots both.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Laravel 11 project scaffolded in `backend/` — API-only, SQLite, Sanctum installed, Redis config stubbed
- [ ] Next.js App Router project scaffolded in `frontend/` — React 19, TypeScript
- [ ] All npm packages installed: motion, shadcn/ui, Zustand 5, Tailwind v3, Leaflet, Vitest, Playwright
- [ ] Tailwind config with Checkstar brand tokens (orange `#EB6522`, Figtree/Inter fonts)
- [ ] Josh Comeau CSS reset applied
- [ ] `middleware.ts` proxies `/api/*` to Laravel backend
- [ ] Laravel health endpoint `GET /api/health` returns 200
- [ ] Vitest + Playwright configured and a smoke test passes
- [ ] All changes committed
