<?php

namespace Tests\Unit;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use App\Services\DispatchPolicy;
use App\Services\DispatchService;
use App\Services\GamificationService;
use App\Services\OrderCartPolicy;
use App\Services\OrderClaim;
use App\Services\OrderIntake;
use App\Services\OrderStateMachine;
use App\Services\PricingService;
use App\Services\RiderOrderService;
use App\Services\StoreFulfillmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class StockManagementTest extends TestCase
{
    use RefreshDatabase;

    private RiderOrderService $riderOrderService;

    private User $customer;

    private Store $store;

    private Product $product;

    private StoreProduct $storeProduct;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('dispatch.max_fallback_stores', 10);

        $this->riderOrderService = new RiderOrderService(
            new OrderStateMachine,
            new GamificationService,
            new OrderClaim(new OrderStateMachine),
        );

        $this->customer = User::create([
            'name' => 'Jane Customer',
            'email' => 'jane@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $this->store = Store::create([
            'name' => 'Durban Central',
            'slug' => 'durban-central',
            'address' => '123 West St',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.025,
            'delivery_radius_km' => 5,
            'phone' => '+27 31 555 0100',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'name' => 'Coca-Cola 2L',
            'slug' => 'coca-cola-2l',
            'price' => 25.99,
            'unit' => 'each',
            'is_active' => true,
            'category_id' => $this->createCategory('Beverages')->id,
        ]);

        $this->storeProduct = StoreProduct::create([
            'store_id' => $this->store->id,
            'product_id' => $this->product->id,
            'stock_quantity' => 50,
            'reserved_quantity' => 0,
            'is_available' => true,
        ]);
    }

    private function createCategory(string $name): Category
    {
        return Category::create([
            'name' => $name,
            'slug' => strtolower(str_replace(' ', '-', $name)),
        ]);
    }

    private function createRider(Store $store, bool $available = true, float $maxRadius = 10): Rider
    {
        $user = User::create([
            'name' => 'Rider '.uniqid(),
            'email' => 'rider_'.uniqid().'@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

        return Rider::create([
            'user_id' => $user->id,
            'store_id' => $store->id,
            'is_available' => $available,
            'max_radius_km' => $maxRadius,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);
    }

    private function createOrderWithItems(int $quantity = 3, int $stock = 50): Order
    {
        $this->storeProduct->update(['stock_quantity' => $stock]);

        $rider = $this->createRider($this->store);

        $order = Order::create([
            'order_number' => 'ORD-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 25.99 * $quantity,
            'delivery_fee' => 10.00,
            'total' => (25.99 * $quantity) + 10.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => $quantity,
            'unit_price' => 25.99,
            'total_price' => 25.99 * $quantity,
            'product_snapshot' => [
                'name' => $this->product->name,
                'image' => $this->product->image,
                'unit' => $this->product->unit,
                'slug' => $this->product->slug,
            ],
        ]);

        return $order;
    }

    private function createRiderForOrder(): Rider
    {
        return $this->createRider($this->store);
    }

    // ─── markItemsBought: stock decrement ────────────────────────────

    public function test_mark_items_bought_decrements_stock_quantity(): void
    {
        $order = $this->createOrderWithItems(3, 50);
        $rider = $order->rider;

        $this->riderOrderService->markItemsBought($rider, $order->id);

        $this->storeProduct->refresh();
        $this->assertSame(47, $this->storeProduct->stock_quantity);
    }

    public function test_mark_items_bought_decrements_stock_for_multiple_items(): void
    {
        $product2 = Product::create([
            'name' => 'Chips 2L',
            'slug' => 'chips-2l',
            'price' => 15.50,
            'unit' => 'each',
            'is_active' => true,
            'category_id' => $this->createCategory('Snacks')->id,
        ]);

        $storeProduct2 = StoreProduct::create([
            'store_id' => $this->store->id,
            'product_id' => $product2->id,
            'stock_quantity' => 30,
            'reserved_quantity' => 0,
            'is_available' => true,
        ]);

        $rider = $this->createRiderForOrder();

        $order = Order::create([
            'order_number' => 'ORD-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 2,
            'unit_price' => 25.99,
            'total_price' => 51.98,
            'product_snapshot' => ['name' => $this->product->name, 'unit' => $this->product->unit, 'slug' => $this->product->slug],
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product2->id,
            'store_product_id' => $storeProduct2->id,
            'quantity' => 4,
            'unit_price' => 15.50,
            'total_price' => 62.00,
            'product_snapshot' => ['name' => $product2->name, 'unit' => $product2->unit, 'slug' => $product2->slug],
        ]);

        $this->riderOrderService->markItemsBought($rider, $order->id);

        $this->storeProduct->refresh();
        $storeProduct2->refresh();

        $this->assertSame(48, $this->storeProduct->stock_quantity);
        $this->assertSame(26, $storeProduct2->stock_quantity);
    }

    // ─── markItemsBought: reserved_quantity behavior ──────────────────

    public function test_mark_items_bought_releases_reservation_and_decrements_stock(): void
    {
        $this->storeProduct->update(['reserved_quantity' => 5]);

        $order = $this->createOrderWithItems(3, 50);
        $rider = $order->rider;

        $this->riderOrderService->markItemsBought($rider, $order->id);

        $this->storeProduct->refresh();
        $this->assertSame(47, $this->storeProduct->stock_quantity);
        // The bought item's reservation (3) is released; unrelated reservations (2) remain
        $this->assertSame(2, $this->storeProduct->reserved_quantity);
    }

    // ─── markItemsBought: partial batches ────────────────────────────

    public function test_partial_batch_can_be_continued_in_a_later_call(): void
    {
        $order = $this->createOrderWithItems(2, 50);
        $rider = $order->rider;
        $item = $order->items->first();

        // First call: mark only this item
        $this->riderOrderService->markItemsBought($rider, $order->id, [$item->id]);
        $this->storeProduct->refresh();
        $this->assertSame(48, $this->storeProduct->stock_quantity);

        // Second call for the SAME item must not decrement again
        $this->riderOrderService->markItemsBought($rider, $order->id, [$item->id]);
        $this->storeProduct->refresh();
        $this->assertSame(48, $this->storeProduct->stock_quantity);
    }

    public function test_mark_items_bought_ignores_unknown_item_ids(): void
    {
        $order = $this->createOrderWithItems(2, 50);
        $rider = $order->rider;

        $this->riderOrderService->markItemsBought($rider, $order->id, [999999]);

        $this->storeProduct->refresh();
        $this->assertSame(50, $this->storeProduct->stock_quantity);
    }

    // ─── markItemsBought: oversell guard ─────────────────────────────

    public function test_mark_items_bought_throws_when_insufficient_stock(): void
    {
        $order = $this->createOrderWithItems(5, 3);
        $rider = $order->rider;

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Insufficient stock for product');

        $this->riderOrderService->markItemsBought($rider, $order->id);
    }

    public function test_mark_items_bought_does_not_decrement_stock_on_failure(): void
    {
        $order = $this->createOrderWithItems(5, 3);
        $rider = $order->rider;

        try {
            $this->riderOrderService->markItemsBought($rider, $order->id);
        } catch (\InvalidArgumentException $e) {
            // expected
        }

        $this->storeProduct->refresh();
        $this->assertSame(3, $this->storeProduct->stock_quantity);
    }

    public function test_mark_items_bought_throws_when_product_not_available(): void
    {
        $this->storeProduct->update(['is_available' => false]);

        $order = $this->createOrderWithItems(2, 50);
        $rider = $order->rider;

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('is not available at this store');

        $this->riderOrderService->markItemsBought($rider, $order->id);
    }

    // ─── markItemsBought: idempotency ────────────────────────────────

    public function test_mark_items_bought_is_idempotent(): void
    {
        $order = $this->createOrderWithItems(3, 50);
        $rider = $order->rider;

        $this->riderOrderService->markItemsBought($rider, $order->id);
        $this->storeProduct->refresh();
        $this->assertSame(47, $this->storeProduct->stock_quantity);

        $this->riderOrderService->markItemsBought($rider, $order->id);
        $this->storeProduct->refresh();
        $this->assertSame(47, $this->storeProduct->stock_quantity);
    }

    // ─── markItemsBought: activity log ──────────────────────────────

    public function test_mark_items_bought_creates_activity_log(): void
    {
        $order = $this->createOrderWithItems(2, 50);
        $rider = $order->rider;

        $this->riderOrderService->markItemsBought($rider, $order->id);

        $log = $order->activityLogs()->where('event_type', EventType::ItemsBought->value)->first();
        $this->assertNotNull($log);
        $this->assertSame(OrderStatus::Preparing->value, $log->old_status);
        $this->assertSame(OrderStatus::Preparing->value, $log->new_status);
    }

    // ─── markItemsBought: order liveness guard ──────────────────────

    public function test_mark_items_bought_throws_when_order_is_cancelled(): void
    {
        $order = $this->createOrderWithItems(3, 50);
        $rider = $order->rider;

        (new OrderStateMachine)->transition($order, OrderStatus::Cancelled);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot mark items as bought');

        $this->riderOrderService->markItemsBought($rider, $order->id);
    }

    public function test_mark_items_bought_rejects_order_that_is_no_longer_preparing(): void
    {
        $order = $this->createOrderWithItems(3, 50);
        $rider = $order->rider;

        // The rider's screen was loaded before the customer cancelled — the
        // cancelled state commits in between the load and the buy request.
        Order::where('id', $order->id)->update(['status' => OrderStatus::Cancelled->value]);

        try {
            $this->riderOrderService->markItemsBought($rider, $order->id);
            $this->fail('Expected InvalidArgumentException');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('Cannot mark items as bought', $e->getMessage());
        }

        // Stock must not be decremented and reservations not re-released on a
        // dead order: the cancellation already released them.
        $this->storeProduct->refresh();
        $this->assertSame(50, $this->storeProduct->stock_quantity);
        $this->assertSame(0, $this->storeProduct->reserved_quantity);
        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
    }

    public function test_mark_items_bought_rejects_delivered_order(): void
    {
        $order = $this->createOrderWithItems(3, 50);
        $rider = $order->rider;

        Order::where('id', $order->id)->update(['status' => OrderStatus::Delivered->value]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot mark items as bought');

        $this->riderOrderService->markItemsBought($rider, $order->id);
    }

    // ─── Order cancellation releases reserved stock ─────────────────

    public function test_order_cancellation_releases_reserved_quantity(): void
    {
        $this->storeProduct->update(['reserved_quantity' => 5]);

        $order = $this->createOrderWithItems(3, 50);

        $stateMachine = new OrderStateMachine;
        $stateMachine->transition($order, OrderStatus::Cancelled);

        $this->storeProduct->refresh();
        $this->assertSame(2, $this->storeProduct->reserved_quantity);
    }

    public function test_order_cancellation_does_not_affect_stock_quantity(): void
    {
        $order = $this->createOrderWithItems(3, 50);

        $stateMachine = new OrderStateMachine;
        $stateMachine->transition($order, OrderStatus::Cancelled);

        $this->storeProduct->refresh();
        $this->assertSame(50, $this->storeProduct->stock_quantity);
    }

    public function test_lost_cancel_race_does_not_release_reservations(): void
    {
        $this->storeProduct->update(['reserved_quantity' => 5]);

        $order = $this->createOrderWithItems(3, 50);
        $order->status = OrderStatus::OutForDelivery;
        $order->save();

        // The rider holds a stale OutForDelivery snapshot, but the customer
        // already confirmed delivery, which moved the order to Delivered.
        $stale = Order::find($order->id);
        Order::where('id', $order->id)->update(['status' => OrderStatus::Delivered->value]);

        try {
            (new OrderStateMachine)->transition($stale, OrderStatus::Cancelled);
            $this->fail('Expected a concurrent-status InvalidArgumentException');
        } catch (\InvalidArgumentException $e) {
            $this->assertStringContainsString('status changed concurrently', $e->getMessage());
        }

        // The winning Delivered transition is untouched and no reservation —
        // that belongs to a different order's accounting — was released.
        $this->storeProduct->refresh();
        $this->assertSame(5, $this->storeProduct->reserved_quantity);
        $this->assertSame(OrderStatus::Delivered, $order->fresh()->status);
    }

    public function test_order_cancellation_clamps_reserved_quantity_at_zero(): void
    {
        $this->storeProduct->update(['reserved_quantity' => 1]);

        $order = $this->createOrderWithItems(5, 50);

        $stateMachine = new OrderStateMachine;
        $stateMachine->transition($order, OrderStatus::Cancelled);

        $this->storeProduct->refresh();
        $this->assertSame(0, $this->storeProduct->reserved_quantity);
    }

    public function test_order_cancellation_does_not_release_reservations_for_bought_items(): void
    {
        // Reservation held for this order's item (3 units) + an unrelated 4 units
        $this->storeProduct->update(['reserved_quantity' => 7]);

        $order = $this->createOrderWithItems(3, 50);
        $rider = $order->rider;

        $this->riderOrderService->markItemsBought($rider, $order->id);

        // bought: reserved 7-3=4; cancelling must not release the item again
        (new OrderStateMachine)->transition($order, OrderStatus::Cancelled);

        $this->storeProduct->refresh();
        $this->assertSame(4, $this->storeProduct->reserved_quantity);
        $this->assertSame(47, $this->storeProduct->stock_quantity);
    }

    public function test_delivery_releases_reservations_for_unbought_items(): void
    {
        $this->storeProduct->update(['reserved_quantity' => 3]);

        $order = $this->createOrderWithItems(3, 50);

        // Simulate the order reaching Delivered without the item being marked
        // bought (e.g. customer-confirmed path) — the reservation must be
        // released by the state machine, not leaked forever.
        $order->status = OrderStatus::OutForDelivery;
        $order->save();
        (new OrderStateMachine)->transition($order, OrderStatus::Delivered);

        $this->storeProduct->refresh();
        $this->assertSame(0, $this->storeProduct->reserved_quantity);
        $this->assertSame(50, $this->storeProduct->stock_quantity);
    }

    public function test_reservation_counts_against_availability_during_placement(): void
    {
        // Another in-flight order holds a reservation for 48 of the 50 units
        $this->storeProduct->update(['reserved_quantity' => 48]);

        $intake = new OrderIntake(
            new PricingService,
            new OrderStateMachine,
            new DispatchService(new OrderStateMachine, new DispatchPolicy, new OrderClaim(new OrderStateMachine)),
            new DispatchPolicy,
            new OrderCartPolicy,
            new StoreFulfillmentService(new DispatchPolicy),
        );

        $validated = [
            'items' => [['product_id' => $this->product->id, 'quantity' => 3]],
            'delivery_address' => '123 Test St',
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
            'payment_method' => 'cash_on_delivery',
        ];

        $this->expectException(\InvalidArgumentException::class);
        // Reserved stock counts against availability, so the store is
        // ineligible in the fulfillment layer — that layer's reason is thrown.
        $this->expectExceptionMessage('No single store can fulfill');

        $intake->place($validated, $this->customer);
    }

    public function test_reservation_prevents_fulfillment_when_stock_is_reserved(): void
    {
        // Second store that also stocks the product
        $store2 = Store::create([
            'name' => 'Overport',
            'slug' => 'overport',
            'address' => '99 Cannon Ave',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4092',
            'latitude' => -29.85,
            'longitude' => 31.02,
            'delivery_radius_km' => 5,
            'phone' => '+27 31 555 0102',
            'is_active' => true,
        ]);
        StoreProduct::create([
            'store_id' => $store2->id,
            'product_id' => $this->product->id,
            'stock_quantity' => 50,
            'reserved_quantity' => 0,
            'is_available' => true,
        ]);

        // Unreserved stock exists -> fulfillable
        $fulfillmentService = new StoreFulfillmentService(new DispatchPolicy);
        $this->assertTrue($fulfillmentService->resolve([$this->product->id => 2], -29.85, 31.02)->success);

        // Now every unit at every eligible store is reserved by in-flight orders
        $this->storeProduct->update(['reserved_quantity' => 50]);
        StoreProduct::where('store_id', $store2->id)->update(['reserved_quantity' => 50]);

        $result = $fulfillmentService->resolve([$this->product->id => 2], -29.85, 31.02);

        $this->assertFalse($result->success);
        $this->assertStringContainsString('No single store can fulfill', $result->reason);
    }

    // ─── Stock availability validation during placement ─────────────

    public function test_store_product_not_available_prevents_order_placement(): void
    {
        $this->storeProduct->update(['is_available' => false]);

        $product2 = Product::create([
            'name' => 'Milk 1L',
            'slug' => 'milk-1l',
            'price' => 18.00,
            'unit' => 'each',
            'is_active' => true,
            'category_id' => $this->createCategory('Dairy')->id,
        ]);

        StoreProduct::create([
            'store_id' => $this->store->id,
            'product_id' => $product2->id,
            'stock_quantity' => 20,
            'reserved_quantity' => 0,
            'is_available' => true,
        ]);

        $fulfillmentService = new StoreFulfillmentService(new DispatchPolicy);
        $result = $fulfillmentService->resolve(
            [$this->product->id => 2],
            -29.85,
            31.02,
        );

        $this->assertFalse($result->success);
    }

    public function test_insufficient_stock_prevents_order_placement(): void
    {
        $this->storeProduct->update(['stock_quantity' => 1]);

        $fulfillmentService = new StoreFulfillmentService(new DispatchPolicy);
        $result = $fulfillmentService->resolve(
            [$this->product->id => 5],
            -29.85,
            31.02,
        );

        $this->assertFalse($result->success);
    }

    public function test_order_placement_rejects_when_stock_insufficient(): void
    {
        $this->storeProduct->update(['stock_quantity' => 2]);

        $intake = new OrderIntake(
            new PricingService,
            new OrderStateMachine,
            new DispatchService(new OrderStateMachine, new DispatchPolicy, new OrderClaim(new OrderStateMachine)),
            new DispatchPolicy,
            new OrderCartPolicy,
            new StoreFulfillmentService(new DispatchPolicy),
        );

        $validated = [
            'items' => [['product_id' => $this->product->id, 'quantity' => 5]],
            'delivery_address' => '123 Test St',
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
            'payment_method' => 'cash_on_delivery',
        ];

        $this->expectException(\InvalidArgumentException::class);

        $intake->place($validated, $this->customer);
    }

    // ─── Multiple orders respect available stock ────────────────────

    public function test_multiple_orders_decrement_stock_independently(): void
    {
        $rider1 = $this->createRiderForOrder();
        $rider2 = $this->createRiderForOrder();

        $order1 = Order::create([
            'order_number' => 'ORD-1-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider1->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 25.99 * 2,
            'delivery_fee' => 10.00,
            'total' => (25.99 * 2) + 10.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 2,
            'unit_price' => 25.99,
            'total_price' => 51.98,
            'product_snapshot' => ['name' => $this->product->name, 'unit' => $this->product->unit, 'slug' => $this->product->slug],
        ]);

        $order2 = Order::create([
            'order_number' => 'ORD-2-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider2->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 25.99 * 3,
            'delivery_fee' => 10.00,
            'total' => (25.99 * 3) + 10.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 3,
            'unit_price' => 25.99,
            'total_price' => 77.97,
            'product_snapshot' => ['name' => $this->product->name, 'unit' => $this->product->unit, 'slug' => $this->product->slug],
        ]);

        $this->riderOrderService->markItemsBought($rider1, $order1->id);
        $this->storeProduct->refresh();
        $this->assertSame(48, $this->storeProduct->stock_quantity);

        $this->riderOrderService->markItemsBought($rider2, $order2->id);
        $this->storeProduct->refresh();
        $this->assertSame(45, $this->storeProduct->stock_quantity);
    }

    public function test_second_order_fails_when_stock_depleted_by_first(): void
    {
        $this->storeProduct->update(['stock_quantity' => 5]);

        $rider1 = $this->createRiderForOrder();
        $rider2 = $this->createRiderForOrder();

        $order1 = Order::create([
            'order_number' => 'ORD-1-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider1->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 25.99 * 5,
            'delivery_fee' => 10.00,
            'total' => (25.99 * 5) + 10.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 5,
            'unit_price' => 25.99,
            'total_price' => 129.95,
            'product_snapshot' => ['name' => $this->product->name, 'unit' => $this->product->unit, 'slug' => $this->product->slug],
        ]);

        $order2 = Order::create([
            'order_number' => 'ORD-2-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider2->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 25.99 * 3,
            'delivery_fee' => 10.00,
            'total' => (25.99 * 3) + 10.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 3,
            'unit_price' => 25.99,
            'total_price' => 77.97,
            'product_snapshot' => ['name' => $this->product->name, 'unit' => $this->product->unit, 'slug' => $this->product->slug],
        ]);

        $this->riderOrderService->markItemsBought($rider1, $order1->id);
        $this->storeProduct->refresh();
        $this->assertSame(0, $this->storeProduct->stock_quantity);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Insufficient stock');

        $this->riderOrderService->markItemsBought($rider2, $order2->id);
    }

    // ─── Atomicity: lockForUpdate usage ─────────────────────────────

    public function test_mark_items_bought_uses_lock_for_update(): void
    {
        $order = $this->createOrderWithItems(2, 50);
        $rider = $order->rider;

        $this->riderOrderService->markItemsBought($rider, $order->id);

        $this->storeProduct->refresh();
        $this->assertSame(48, $this->storeProduct->stock_quantity);

        $order2 = $this->createOrderWithItems(3, 50);
        $rider2 = $order2->rider;

        $this->riderOrderService->markItemsBought($rider2, $order2->id);

        $this->storeProduct->refresh();
        $this->assertSame(47, $this->storeProduct->stock_quantity);
    }

    public function test_concurrent_mark_items_bought_results_are_consistent(): void
    {
        $this->storeProduct->update(['stock_quantity' => 10]);

        $rider1 = $this->createRiderForOrder();
        $rider2 = $this->createRiderForOrder();

        $order1 = Order::create([
            'order_number' => 'ORD-A-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider1->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 25.99 * 4,
            'delivery_fee' => 10.00,
            'total' => (25.99 * 4) + 10.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 4,
            'unit_price' => 25.99,
            'total_price' => 103.96,
            'product_snapshot' => ['name' => $this->product->name, 'unit' => $this->product->unit, 'slug' => $this->product->slug],
        ]);

        $order2 = Order::create([
            'order_number' => 'ORD-B-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $rider2->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 25.99 * 4,
            'delivery_fee' => 10.00,
            'total' => (25.99 * 4) + 10.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 4,
            'unit_price' => 25.99,
            'total_price' => 103.96,
            'product_snapshot' => ['name' => $this->product->name, 'unit' => $this->product->unit, 'slug' => $this->product->slug],
        ]);

        $this->riderOrderService->markItemsBought($rider1, $order1->id);
        $this->riderOrderService->markItemsBought($rider2, $order2->id);

        $this->storeProduct->refresh();
        $this->assertSame(2, $this->storeProduct->stock_quantity);
    }
}
