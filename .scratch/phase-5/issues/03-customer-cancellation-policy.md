# 03 — Customer cancellation policy

**Status:** ready-for-agent

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

A Customer can only cancel an order while it is `pending`, `confirmed`, or `preparing`. Trying to cancel an `out_for_delivery` or `delivered` order is rejected with a clear conflict response — never a 500.

A new `OrderCancellationPolicy` encapsulates the rule (actor-scoped), resolving the conflict between issue 07 ("only if pending") and CONTEXT.md ("cancellable from most states" for internal operations). The `OrderStateMachine` itself is unchanged.

The web UI already hides the cancel button outside the cancellable states; this slice makes the API enforce the same rule server-side. A Customer who attempts cancellation mid-delivery (e.g. via the API) gets a clean rejection.

## Acceptance criteria

- [ ] `OrderCancellationPolicy` encodes customer-cancellable statuses: `pending`, `confirmed`, `preparing`
- [ ] `POST /api/orders/{id}/cancel` returns a conflict response (not 500) for non-cancellable statuses
- [ ] Cancellation still works for `pending`/`confirmed`/`preparing` orders
- [ ] Unit tests for the policy (each status × owner/non-owner)
- [ ] Feature tests for cancel success and cancel-conflict; `php vendor/bin/phpunit` green

## Blocked by

- Blocked by #01 (Land the P0 order-flow fixes)

## User stories covered

6, 7, 12
