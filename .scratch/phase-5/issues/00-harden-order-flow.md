# 00 — Harden the Order Flow

**What to build:** A Customer's checkout journey that reliably works end-to-end: placing an order never 500s, delivery coordinates are always captured, the server cart is cleared on placement, cancellation is only possible while the order is still cancellable, and Customers can only touch their own orders. Product browsing returns all products, not just the first page.

**Blocked by:** none (builds on the uncommitted P0 fixes in the working tree)

**Status:** ready-for-agent

## Problem Statement

A Customer who shops on the Checkstar web app hits a broken checkout:

- Placing an order fails outright — the backend inserts a null store assignment into a `NOT NULL` column, so every order placement 500s and the Customer never reaches the confirmation screen.
- When it does reach the server, the payload silently omits the delivery coordinates that dispatch depends on, and the frontend reads responses as if they were the order itself, showing `#undefined`.
- A Customer can cancel an order that is already out for delivery, which the store cannot stop.
- After an order is placed, the Customer's saved cart still contains the items they just bought.
- A Customer can view, cancel, or confirm delivery on another Customer's order because no ownership check exists on those endpoints.
- Browsing the catalogue only ever shows the first 20 products, because the listing is paginated but the page never requests page two.

## Solution

A Customer checks out from a non-empty cart by entering their delivery address; the browser captures delivery coordinates automatically (geolocation, falling back to a Durban default when unavailable). The order is created atomically with its items, activity log, and server-cart clearing, then confirmed and dispatched. The Customer lands on a confirmation page with the order number. They can view their order history and details, cancel only while the order is still cancellable, confirm delivery when it arrives, and rate their rider after delivery. They can never see or act on another Customer's order. Browsing shows the full catalogue across pages.

## User Stories

1. As a Customer, I want to place an order from my cart with my delivery address, so that my groceries get delivered to my home.
2. As a Customer, I want my saved cart to be empty after I place an order, so that I don't re-buy items I've already ordered.
3. As a Customer, I want to see a confirmation page with my order number and a summary, so that I know my order was accepted.
4. As a Customer, I want to view my order history sorted by date, so that I can find past orders easily.
5. As a Customer, I want to view an order's details including its items and status, so that I can track my purchase.
6. As a Customer, I want to cancel my order while it is still pending, confirmed, or being prepared, so that I can back out before it's too late.
7. As a Customer, I must NOT be able to cancel an order that is out for delivery or delivered, so that the store isn't left with a rider en route.
8. As a Customer, I want to confirm delivery when my order arrives, so that the order is marked delivered and my rider is credited.
9. As a Customer, I want to rate my rider after delivery, so that the store and other Customers know about the service.
10. As a Customer, I want to be blocked from viewing, cancelling, or confirming another Customer's order, so that my order data stays private.
11. As a Customer browsing the catalogue, I want to see all products across pages, so that nothing is hidden behind the first page.
12. As a Store Owner or Logistics Officer, I want cancelled orders to only be cancellable by policy, so that dispatch and fulfilment aren't disrupted mid-delivery.
13. As a Developer, I want to roll back the nullable-store migration safely, so that schema changes are reversible.

## Implementation Decisions

- **OrderCancellationPolicy (new).** Encapsulates who may cancel an Order and from which statuses. Customer-facing cancellation is allowed only from `pending`, `confirmed`, and `preparing`. The existing `OrderStateMachine` is left unchanged: CONTEXT.md keeps "cancellable from most states" for internal operations, and the new policy narrows the Customer's window. This resolves the conflict between issue 07 ("only if status is pending") and CONTEXT.md by scoping the rule to the actor. The controller consults the policy and returns a conflict response (not a 500) when cancellation is not allowed.
- **Server-cart clearing.** `OrderIntake::place()` deletes the Customer's `cart_items` inside its existing database transaction, so order creation, item creation, activity logging, auto-confirm, dispatch, and cart clearing are atomic. A placement that fails rolls back everything including the cart.
- **OrderPolicy (new, Laravel Policy).** Replaces the four duplicated inline ownership guards (`customer_id !== user()->id` → 403) with a single `view` / `update` / `confirmDelivery` ability set applied in the controller.
- **Migration `down()`.** Restores the original `cascadeOnDelete()` behaviour so `down()` is the true inverse of `up()` and rollback works.
- **`getAllProducts` termination.** The paginated fetch loop terminates if a page returns empty data, preventing an infinite loop; the page-1 sentinel is removed in favour of the server's `total`.
- **Dead-code removal.** Orphaned `api.getProducts` and `useProducts` (no consumers after the `useAllProducts` migration) are deleted.
- **Already implemented in the working tree (uncommitted, to be reviewed and committed with this work):**
  - `orders.store_id` made nullable via a new migration (root cause of the placement 500).
  - `OrderIntake::place()` wrapped in a database transaction.
  - Inline ownership checks on `show`, `cancel`, `confirmDelivery` (replaced by OrderPolicy above).
  - Frontend API wrappers unwrap the `{data: ...}` envelope on `getOrder`, `placeOrder`, `cancelOrder`, `confirmDelivery`; `getCart` shape corrected.
  - Checkout payload includes `delivery_latitude` / `delivery_longitude` captured via `navigator.geolocation`, with a Durban fallback constant (`-29.8587, 31.0218`) when unavailable or denied; delivery address is required.
  - `GET /api/products?per_page=` pagination (default 20, cap 100) with `api.getAllProducts` + `useAllProducts`.
- **API contracts.** `POST /api/orders` accepts `items`, `delivery_address`, `delivery_latitude`, `delivery_longitude`, `delivery_notes` and returns `201 { data: Order }` with the dispatch outcome. `POST /api/orders/{id}/cancel` returns `403` for non-owners and a conflict response when the order is no longer cancellable. `GET /api/cart` returns `{ data: CartItem[] }`.
- **Coordinate consent.** The Durban fallback is a documented product decision (required coords for dispatch). The confirmation flow should surface the fallback case rather than hiding it, so Customers know where they're ordering to.

## Testing Decisions

- **What makes a good test:** assert external behaviour only — HTTP status codes, response envelopes, and observable state changes (status transitions, cart contents, activity log rows) — never method internals or private helpers.
- **Modules tested:**
  - `OrderCancellationPolicy` — unit tests for each status × owner/non-owner combination.
  - `OrderPolicy` — unit tests for the `view` / `update` / `confirmDelivery` abilities.
  - `OrderIntake` cart clearing — Feature test asserting that placing an order empties `GET /api/cart` and that a failed placement (e.g. invalid product) rolls back without touching the cart.
  - `getAllProducts` — frontend unit tests for multi-page aggregation and termination on an empty page.
  - Controller authz — Feature tests asserting `403` for cross-Customer `show`/`cancel`/`confirmDelivery`/`review` and a conflict for cancelling a delivered or out-for-delivery order.
  - Migration — a migrate + rollback round-trip asserting the `down()` restores the foreign key with cascade delete.
- **Prior art:** `backend/tests/Feature/OrderPlacementTest.php` (happy path, coords validation, ownership matrix), `backend/tests/Feature/AuthTest.php`, `frontend/src/lib/__tests__/api-getAllProducts.test.ts`.

## Out of Scope

- Guest cart handoff and guest checkout (Guests are prompted to sign in at checkout; preserving their cart across that transition is a separate work item).
- Rider-role gating and Developer/Store admin guardrails on other endpoints.
- Payment integration (Payment Status lifecycle exists, but no real payment gateway).
- Delivery-fee calculation and dispatch-policy tuning (fallback-store thresholds, rider radius rules).
- Inventory decrement at order time (stock is decremented when the Rider marks items bought, per CONTEXT.md).
- Mobile app (Expo) parity with the web order flow.

## Further Notes

- Domain language per CONTEXT.md: Customer (not "buyer"), Order (not "purchase"), Rider (not "courier"), Dispatch, Order Intake, Store. The cancelled status and cart items use the exact terms defined there.
- The two-axis code review that produced this PRD flagged 8 standards findings and 8 spec findings; every module above maps to at least one finding.
- Current baseline: backend 46 tests green, frontend 15 tests green; `tsc --noEmit` has one pre-existing unrelated error in `StoresClient.tsx` (null non-assignable) that is not part of this work.
- The confirmation page should render dispatch outcomes gracefully — when no rider is available and all nearby Stores are exhausted, dispatch cancels the Order, so the "success" state is not guaranteed.
