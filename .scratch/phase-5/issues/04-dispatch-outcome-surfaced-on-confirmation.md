# 04 — Dispatch outcome surfaced on confirmation

**Status:** ready-for-agent

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

After placing an order, the Customer sees the real outcome, not an unconditional "Order Placed!" success screen.

`POST /api/orders` already computes a dispatch outcome (`dispatchStatus`, `store_id`, `rider_id`) but drops it from the response. This slice exposes it in the response envelope, and the checkout confirmation page renders the appropriate state: success with rider/store details when dispatched, a retrying state when no rider is available yet, and an honest cancelled state when dispatch exhausted all nearby stores.

The page no longer claims success for an order that dispatch has already cancelled.

## Acceptance criteria

- [ ] `POST /api/orders` response includes the dispatch outcome (status, store, rider when present)
- [ ] Confirmation page renders dispatched / retrying / cancelled states distinctly
- [ ] Feature test asserting the response contract (dispatch outcome present)
- [ ] Frontend test for the confirmation state rendering; `php vendor/bin/phpunit` and `npx vitest run` green

## Blocked by

- Blocked by #01 (Land the P0 order-flow fixes)

## User stories covered

3
