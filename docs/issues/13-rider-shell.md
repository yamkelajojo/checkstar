## What to build

The Rider shell in the same Expo project: real (non-mocked) role-gated tooling for claiming and fulfilling Orders, with lighter polish than the Customer app (Customer-first priority).

## Acceptance criteria

- [ ] Root picks the Rider shell by session role from the login response (separate from the Customer 4-tab shell); rider endpoints are real, no mocks.
- [ ] Availability toggle → `POST /rider/toggle-availability` (on/off).
- [ ] Claim list from `GET /rider/available-orders` (claimable Orders at the Rider's store); claim with one tap via `POST /rider/claim/{order}` (first-claim-wins, backend atomic).
- [ ] Claim-lost UX: on 409, glass toast "Already claimed by another Rider" (`warning` haptic, amber/danger tint), drop that Order from the local claim list, invalidate/refetch `available-orders`. No navigation.
- [ ] Rider Order detail: items to buy at the Store, customer address + delivery notes; mark items bought via `POST /rider/items-bought/{order}` (decrements stock).
- [ ] `POST /rider/out-for-delivery/{order}` then `POST /rider/delivered/{order}` to advance the timeline.
- [ ] Earnings/stats: `GET /rider/stats` (deliveries, average rating, XP) and `GET /rider/history`.
- [ ] Claim/status local notification taps deep-nav to rider order detail.
- [ ] Rider registration (vehicle, banking, availability) reachable from Onboarding "I'm a Rider" and from a Rider sign-in path; a Rider who wants to shop uses a separate Customer account.

## Blocked by

- Blocked by Slice 8 (auth)
