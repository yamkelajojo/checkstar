## What to build

Customer + Rider authentication against the live Laravel API: additive backend work (Sanctum Personal Access Tokens), register/login screens, secure token storage, session store, logout, and the 401/session-expiry flow. Web cookie/SPA auth must remain untouched.

## Acceptance criteria

- [ ] **Additive backend:** issue Sanctum Personal Access Tokens on register/login (email + password); the web cookie/SPA auth path is unchanged; existing `frontend/` flows still work.
- [ ] Register screen (name, email, password, phone) + Login screen; both email+password (no phone/OTP).
- [ ] Rider registration form: vehicle type, banking details, availability → `POST /auth/register/rider` (form reachable from Onboarding "I'm a Rider").
- [ ] Token stored in `expo-secure-store` (not async-storage); `stores/session` holds token + user + role.
- [ ] Login response loads the user's `rider`; root selects shell by role (Customer 4-tab vs Rider shell).
- [ ] Logout clears token + session only — cart draft and delivery-Store persist.
- [ ] 401 from any authenticated call (centralized in `lib/api`): clear token + session, toast "Session expired — sign in again", navigate to Auth via navigation ref; Guest browsing of public endpoints unaffected.
- [ ] API-client unit tests: Bearer header injected on authenticated calls; 401 handling clears session + toasts + navigates (mocked fetch).

## Blocked by

- Blocked by Slice 1 (scaffold + shell + theme)
