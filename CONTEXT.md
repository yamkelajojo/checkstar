# Checkstar

A Durban-based South African supermarket chain (3 physical stores) rebuilding its website and adding a grocery delivery service with motorbike couriers.

## Language

**Customer**:
A person who shops at Checkstar — either in-store or via the delivery app.
_Avoid_: Buyer, User (when referring to a shopper)

**Rider**:
A Checkstar employee who delivers orders to Customers via motorbike. Riders have an `available` status they can toggle to indicate whether they're ready to accept deliveries.
_Avoid_: Runner, Courier, Delivery person

**Store**:
A physical Checkstar retail location. Also serves as the fulfillment hub for delivery orders placed nearby. Each Store has its own inventory and a fixed delivery radius (km); the system selects the optimal Store based on Rider availability and Customer proximity, preferring the closest Store that has an available Rider. If no Rider is available at the closest Store within a configurable threshold, dispatch falls back to the next-nearest Store.
_Avoid_: Branch, Location

**Store Owner**:
The person who owns and runs a specific Checkstar store. Top operational role for a store.
_Avoid_: Boss

**Store Manager**:
Reports to the Store Owner. Manages day-to-day store operations, inventory, and staff.

**Logistics Officer**:
Monitors deliveries, Riders, and inventory flow. Can manually dispatch orders or let the system auto-dispatch via algorithm.

**Developer**:
Has full system-level access for administration and maintenance of the platform.

**Role**:
Each User has exactly one Role: `developer`, `store_owner`, `store_manager`, `logistics_officer`, `customer`, or `rider`. Registration flow differs for Customers (email + password) vs Riders (extra fields: vehicle, availability, banking). A Rider who wants to shop creates a separate Customer account.

**Order**:
A request from a Customer to purchase groceries for delivery.
_Avoid_: Cart (before checkout), Purchase

**Order Status**:
The lifecycle of an Order follows a single status field: `pending` → `confirmed` → `preparing` → `out_for_delivery` → `delivered`. Can be `cancelled` from most states. Payment has a separate Payment Status — the two statuses are independent and enforced in application logic, not database constraints. Dispatch retries automatically when no Rider is available; after all nearby Stores are exhausted, the Order is cancelled.

**Dispatch**:
The automatic system process that assigns an available Rider to a confirmed Order. Can also be triggered manually by a Logistics Officer or Store Owner. When multiple Riders see the same pending Order, the first to claim it wins — handled via atomic DB locking (`FOR UPDATE SKIP LOCKED`) to prevent double-assignment.

**Dispatch Policy**:
The rules governing Store and Rider eligibility during Dispatch. Encapsulates which Stores are within delivery range of a Customer, which Riders are available and have sufficient max_radius_km, and how many fallback Stores to try before giving up.
_Avoid_: putting these rules inline in the Dispatch orchestration code

**Payment Status**:
Tracks the financial state of an Order separately from its fulfilment status. Follows the lifecycle `pending` → `paid` → `refunded`, enforced by a dedicated state machine. The two status tracks (Order Status and Payment Status) are independent by design.
_Avoid_: Payment, Transaction (Payment Status is just the state; a Transaction is the financial record).

**Order Activity Log**:
An append-only audit trail recording every state change on an Order — who did what and when. Used for dispute resolution and operational visibility.

**Special**:
A time-bound offer that applies to products or collections of products. A product-level Special uses `sale_price`; a collection Special groups products under a themed banner (e.g. "Winter Warmers"). When a product has both its own `sale_price` and belongs to a Collection Special, the product-level `sale_price` takes priority.
_Avoid_: Promotion, Discount (when referring to the entity)

**Product**:
An individual SKU sold at Checkstar. Each Product belongs to exactly one Category and has a `unit` (e.g. "each", "kg", "2L") and optional `tags` (JSON) for secondary browsing groupings (e.g. "braai", "lunchbox"). Products are standalone — no variant hierarchy (e.g. "Coca-Cola 2L" and "Coca-Cola 330ml can" are separate Products). Stock is decremented when a Rider marks items as bought at the Store, not when the Customer places the Order.

**Order Intake**:
The module that receives validated order input from the Customer-facing controller and produces a complete Order with dispatch outcome. Owns pricing calculation (full cascade: product-level sale_price → collection special → base price), Order creation, Order auto-confirm (Pending → Confirmed), and auto-dispatch in one atomic flow. The only thing the controller must do is validate the request and hand it across this seam.
_Avoid_: putting pricing, state machine transitions, or dispatch calls directly in the Controller.

**Order Claim**:
The atomic transaction that assigns an Order to a Rider. Uses `FOR UPDATE SKIP LOCKED` to prevent double-assignment. Unconditionally sets both `rider_id` and `store_id` on the Order and syncs store-product IDs to Order Items. Has exactly two callers: auto-dispatch (via DispatchService) and manual Rider claim (via RiderOrderService). A `ClaimResult` includes the Order, claim latency in milliseconds, and whether the claim succeeded.
_Avoid_: duplicating the `lockForUpdate` + transition + assignment sequence across multiple modules.

**Store Context**:
Resolves which Store an authenticated User is acting on. For a `store_owner`, reads the User's owned Store. For `store_manager` or `logistics_officer`, resolves through StoreStaff assignment. For the `developer` role, requires an explicit `store_id` in the request. Throws if no Store can be resolved.
_Avoid_: embedding role-to-store resolution inline in Controllers.

**Delivery Confirmation**:
Coordinates the Order and Payment status transitions when a Customer confirms delivery. Atomically transitions the Order status to `Delivered` and Payment status to `Paid` inside a single database transaction, and sets `customer_confirmed_at`. If either transition rejects, both roll back and the controller receives a failure. All activity logging flows through OrderStateMachine, not inline.
_Avoid_: calling `canTransition` without executing, or creating activity log entries directly in the Controller.

**Rider Stats Recorder**:
Responds to review events by incrementally updating a Rider's stats: average rating is recomputed via an incremental weighted formula (avoiding a full table scan on every review), and total deliveries is incremented. Separate from GamificationService (which handles XP, levels, and badges) — Rider Stats Recorder owns review-triggered recalculation only.
_Avoid_: calling model methods like `recalculateStats()` directly from Controllers.
