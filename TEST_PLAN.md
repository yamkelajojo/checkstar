# Test Plan — V-model SDLC / STLC

How verification is organised for the Checkstar monorepo (web + Laravel API +
mobile). This document is the test-level map of the V-model: every
requirement/acceptance criterion on the left is traced to a test artifact on
the right. The STLC phases (plan → design → implement → execute → report →
retire) run per iteration; this file is the plan + report index.

## V-model traceability

| V-left (specification) | V-right (verification) | Artifacts |
|---|---|---|
| Business need: customers order groceries for delivery | Acceptance / E2E journeys | `mobile/src/features/*/customer-journey-e2e.test.tsx`, `checkout-flow-integration-e2e.test.tsx`, `rider-full-flow-e2e.test.ts`, `full-customer-journey-e2e.test.tsx` |
| System behaviour: order lifecycle (Pending→Confirmed→…→Delivered/Cancelled), payment states, dispatch & claims | System tests (API as contract) | `backend/tests/Feature/OrderPlacementTest`, `ManualDispatchTest`, `OrderClaimTest` (unit+concurrency), `DeliveryConfirmationTest`, `ReconcileReservationsTest` |
| System behaviour: multi-tenancy — store staff only ever see their store | System-level isolation tests | `AuditLogScopingTest`, `StoreOrderApiTest`, `BannerTenantGuardTest`, `ManualDispatchTest` |
| System behaviour: financial history is immutable against admin deletes | DB-constraint + integration tests | `HistoryCascadeGuardsTest`, `MigrationRollbackTest`, RESTRICT FK migration (`2026_09_05_000001`) proven on the MySQL CI leg |
| Integration contracts: HTTP envelopes, status codes, pagination bounds | Integration / contract tests | `FavoritesApiTest`, `StoreOrderApiTest`, `ProfileApiTest`, `PublicCatalogueTest`, `RecommendationsEndpointTest`, `SpecialsEndpointTest`, `frontend/src/lib/__tests__/api.test.ts`, `mobile/src/lib/__tests__/apiClient.test.ts` |
| Component design: pricing cascade, state machines, policies, cart rules | Unit tests | `PricingServiceTest`, `OrderStateMachineTest`, `PaymentStateMachineTest`, `OrderPolicyTest`, `OrderCartPolicyTest`, `frontend/src/__tests__/cart-store.test.ts`, `mobile/src/features/checkout/__tests__/model.test.ts` |
| UI/UX requirements: forms, flows, a11y | Component tests + a11y audits | `frontend/src/app/(account)/account/profile/__tests__/ProfileClient.test.tsx`, `OrderConfirmation.test.tsx`, `mobile accessibility-audit/verification.test.ts`, `token-consistency.test.ts` |
| Operational requirements: reservations stay honest, retry chain terminates | Scheduled-job tests + ops dashboards | `ReconcileReservationsTest`, `DispatchServiceTest`, scheduler entries in `routes/console.php` |

## STLC per iteration (what actually happens each round)

1. **Plan** — pick the riskiest unverified requirement (seams first:
   multi-tenancy, money, state, history).
2. **Design** — write the failing test that encodes the *correct* contract
   (TDD red). Tests that pass against wrong behaviour are rewritten, never
   trusted (e.g. the delivery-confirmation test that pinned a crash).
3. **Implement** — minimal fix to make red green; no mock-silencing.
4. **Execute** — local: php-parser gate, `vitest`, `tsc`, `jest`, `tsc`
   (mobile). Remote: GitHub Actions — PHP 8.2/8.3/8.4, MySQL 8 (engine FK /
   CHECK semantics), Frontend (typecheck+lint+vitest+next build), Mobile
   (typecheck+SDK pin+jest). All six must be green; diagnostics commits are
   harvested and deleted on failure.
5. **Report** — findings and coverage deltas are recorded in `REMEDIATION.md`
   (per-finding) and this file (level map).
6. **Retire** — obsolete tests are deleted with the behaviour they pinned;
   misleading coverage is rewritten to pin the corrected contract.

## Standing verification rules

- Backend tests run on SQLite **and** MySQL 8; engine-specific semantics
  (CHECK constraints, FK actions, JSON key order, int/float identity) are
  only trusted when the MySQL leg is green.
- No test may be skipped, weakened or mocked into green to force a pass.
- Every production-code fix lands in the same commit as the test that
  demonstrates it (TDD pairing), or references the existing test that covers it.
- Contract changes must update **all three clients'** expectations (web
  `lib/api.ts`, mobile `apiClient.ts`, backend `tests/**`) in one round.

## Coverage snapshot (round 4)

- Backend: ~400 tests / ~950 assertions per leg (was ~341 before round 4).
- Frontend: 109 vitest tests (was 98), `tsc` clean, `next build` green.
- Mobile: 63 jest suites, `tsc` clean, SDK pin verified.
