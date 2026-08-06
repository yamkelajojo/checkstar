# 05 — OrderPolicy replaces inline ownership guards

**Status:** ready-for-agent

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

The four duplicated inline ownership guards (`customer_id !== user()->id` → `403 Not your order`) on `show`/`cancel`/`confirmDelivery`/`review` are centralized into a single Laravel `OrderPolicy` with `view` / `update` / `confirmDelivery` abilities, and the controller delegates to it.

External behaviour is unchanged — a Customer still gets a 403 on another Customer's order — but the guard now lives in one testable place instead of four copies of the same block.

## Acceptance criteria

- [ ] `OrderPolicy` defines `view`, `update` (cancel), and `confirmDelivery` abilities
- [ ] `OrderController` delegates ownership checks to the policy; no inline `customer_id !==` guards remain
- [ ] Existing cross-Customer 403 behaviour still covered by `OrderPlacementTest`
- [ ] Unit tests for the policy abilities; `php vendor/bin/phpunit` green

## Blocked by

- Blocked by #01 (Land the P0 order-flow fixes)

## User stories covered

10
