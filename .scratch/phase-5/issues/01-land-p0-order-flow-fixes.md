# 01 — Land the P0 order-flow fixes

**Status:** ready-for-agent

## Parent

#00 Harden the Order Flow (`.scratch/phase-5/issues/00-harden-order-flow.md`)

## What to build

The uncommitted working-tree fixes that make checkout work end-to-end, verified and committed to `feat/mobile-app`:

- `orders.store_id` made nullable via a new migration (fixes the 500 on every order placement).
- `OrderIntake::place()` wrapped in a database transaction.
- Inline ownership guards (403) on `show`/`cancel`/`confirmDelivery`.
- Frontend API wrappers unwrap the `{data: ...}` envelope on `getOrder`/`placeOrder`/`cancelOrder`/`confirmDelivery`; `getCart` shape corrected.
- Checkout payload sends `delivery_latitude`/`delivery_longitude` (geolocation with Durban fallback) and requires a delivery address.
- `GET /api/products?per_page=` pagination (default 20, cap 100) with `api.getAllProducts` + `useAllProducts`.

A Customer can place an order from the cart, see a confirmation page, and browse the full catalogue.

## Acceptance criteria

- [ ] `php vendor/bin/phpunit` is green (incl. `OrderPlacementTest`, `ProductIndexTest`)
- [ ] `npx vitest run` is green (incl. `api-getAllProducts.test.ts`)
- [ ] `npx tsc --noEmit` shows only the pre-existing `StoresClient.tsx:36` error
- [ ] Changes are committed to `feat/mobile-app` with a clear message

## Blocked by

None - can start immediately

## User stories covered

1, 3, 11
