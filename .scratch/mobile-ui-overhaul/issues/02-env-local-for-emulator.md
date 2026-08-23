# 02 — Add .env.local for Android Emulator Backend Reachability

**What to build:** The Android emulator (`Pixel_3a_API_34`) can reach the local backend. Currently `API_BASE_URL = http://192.168.1.100:8000/api` is unreachable from the emulator (needs `10.0.2.2`).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Create `.env.local` (gitignored) at `mobile/.env.local` with:
  ```
  EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
  ```
- [ ] Verify `apiClient.ts:8` reads `process.env.EXPO_PUBLIC_API_URL` (already does)
- [ ] Start Metro, launch app on emulator, confirm network requests hit backend (check Metro logs for `/orders`, `/categories`, etc.)
- [ ] iPhone fleet still uses LAN IP via Expo Go — no config change needed for devices

**Notes:** Reference `mobile/src/lib/apiClient.ts:7-8` and `docs/grilling/mobile-ui-overhaul.md` Known Issues. This enables autonomous emulator verification for all subsequent tickets.