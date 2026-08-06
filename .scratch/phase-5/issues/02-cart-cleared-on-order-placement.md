# 02 — Cart cleared on order placement

**Status:** ready-for-agent

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

When a Customer places an order, their saved server-side cart is emptied as part of the same atomic transaction — order creation, item creation, activity log, auto-confirm, dispatch, and cart clearing all commit or roll back together. If placement fails, the cart is untouched.

After a successful placement, a subsequent `GET /api/cart` returns an empty list. The Customer is never shown the same items again after checkout.

## Acceptance criteria

- [ ] `OrderIntake::place()` deletes the Customer's `cart_items` inside the existing transaction
- [ ] Feature test: placing an order leaves `GET /api/cart` empty
- [ ] Feature test: a failed placement (e.g. invalid product) rolls back without modifying the cart
- [ ] `php vendor/bin/phpunit` green

## Blocked by

- Blocked by #01 (Land the P0 order-flow fixes)

## User stories covered

2
