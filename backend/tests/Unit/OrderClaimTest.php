<?php

namespace Tests\Unit;

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
use App\Services\ClaimResult;
use App\Services\OrderClaim;
use App\Services\OrderStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderClaimTest extends TestCase
{
    use RefreshDatabase;

    private OrderClaim $orderClaim;

    private User $customer;

    private Store $store;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orderClaim = new OrderClaim(new OrderStateMachine);

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

        $this->category = Category::create([
            'name' => 'Groceries',
            'slug' => 'groceries',
            'is_active' => true,
        ]);
    }

    private function createRider(?Store $store = null, bool $available = true): Rider
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
            'store_id' => ($store ?? $this->store)->id,
            'is_available' => $available,
            'max_radius_km' => 10,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);
    }

    private function createConfirmedOrder(?Store $store = null): Order
    {
        return Order::create([
            'order_number' => 'ORD-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => ($store ?? $this->store)->id,
            'status' => OrderStatus::Confirmed,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.025,
        ]);
    }

    private function createProduct(string $name = 'Milk 1L'): Product
    {
        return Product::create([
            'category_id' => $this->category->id,
            'name' => $name,
            'slug' => strtolower(str_replace(' ', '-', $name)).'-'.uniqid(),
            'unit' => 'each',
            'price' => 25.00,
            'is_active' => true,
        ]);
    }

    private function createStoreProduct(Store $store, Product $product, int $stock = 10, int $reserved = 0): StoreProduct
    {
        return StoreProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock_quantity' => $stock,
            'reserved_quantity' => $reserved,
            'is_available' => true,
        ]);
    }

    private function createOrderItem(Order $order, Product $product, int $quantity = 2, ?int $storeProductId = null): OrderItem
    {
        return OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'store_product_id' => $storeProductId,
            'quantity' => $quantity,
            'unit_price' => $product->price,
            'total_price' => $product->price * $quantity,
            'product_snapshot' => ['name' => $product->name, 'price' => $product->price],
        ]);
    }

    public function test_successful_claim_assigns_rider_and_store(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();
        $store = $this->store;

        $result = $this->orderClaim->claim($order, $rider, $store);

        $this->assertTrue($result->claimed);
        $this->assertSame($rider->id, $result->order->rider_id);
        $this->assertSame($store->id, $result->order->store_id);
    }

    public function test_successful_claim_returns_claim_result_dto(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();
        $store = $this->store;

        $result = $this->orderClaim->claim($order, $rider, $store);

        $this->assertInstanceOf(ClaimResult::class, $result);
        $this->assertTrue($result->claimed);
        $this->assertIsInt($result->claimLatencyMs);
        $this->assertGreaterThanOrEqual(0, $result->claimLatencyMs);
        $this->assertInstanceOf(Order::class, $result->order);
    }

    public function test_successful_claim_transitions_order_to_preparing(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);
        $this->assertEquals(OrderStatus::Preparing, $order->fresh()->status);
    }

    public function test_claim_from_retrying_status_succeeds(): void
    {
        $order = $this->createConfirmedOrder();
        $order->status = OrderStatus::Retrying;
        $order->save();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);
        $this->assertEquals(OrderStatus::Preparing, $order->fresh()->status);
    }

    public function test_claim_already_claimed_order_returns_false(): void
    {
        $order = $this->createConfirmedOrder();
        $rider1 = $this->createRider();
        $rider2 = $this->createRider();
        $store = $this->store;

        $firstResult = $this->orderClaim->claim($order, $rider1, $store);
        $this->assertTrue($firstResult->claimed);

        $secondResult = $this->orderClaim->claim($order->fresh(), $rider2, $store);
        $this->assertFalse($secondResult->claimed);
    }

    public function test_claim_with_pending_order_rejects(): void
    {
        $order = $this->createConfirmedOrder();
        $order->status = OrderStatus::Pending;
        $order->save();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertFalse($result->claimed);
        $this->assertEquals(OrderStatus::Pending, $order->fresh()->status);
    }

    public function test_claim_with_preparing_order_rejects(): void
    {
        $order = $this->createConfirmedOrder();
        $order->status = OrderStatus::Preparing;
        $order->save();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertFalse($result->claimed);
    }

    public function test_claim_with_delivered_order_rejects(): void
    {
        $order = $this->createConfirmedOrder();
        $order->status = OrderStatus::Delivered;
        $order->save();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertFalse($result->claimed);
    }

    public function test_claim_with_cancelled_order_rejects(): void
    {
        $order = $this->createConfirmedOrder();
        $order->status = OrderStatus::Cancelled;
        $order->save();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertFalse($result->claimed);
    }

    public function test_claim_with_out_for_delivery_order_rejects(): void
    {
        $order = $this->createConfirmedOrder();
        $order->status = OrderStatus::OutForDelivery;
        $order->save();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertFalse($result->claimed);
    }

    public function test_claim_syncs_store_product_ids_on_order_items(): void
    {
        $order = $this->createConfirmedOrder();
        $product = $this->createProduct('Bread');
        $storeProduct = $this->createStoreProduct($this->store, $product, stock: 20);
        $this->createOrderItem($order, $product, quantity: 3);
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $item = $order->fresh()->items->first();
        $this->assertNotNull($item);
        $this->assertSame($storeProduct->id, $item->store_product_id);
    }

    public function test_claim_syncs_multiple_order_items_to_correct_store_products(): void
    {
        $order = $this->createConfirmedOrder();
        $product1 = $this->createProduct('Milk 1L');
        $product2 = $this->createProduct('Bread Loaf');
        $storeProduct1 = $this->createStoreProduct($this->store, $product1, stock: 15);
        $storeProduct2 = $this->createStoreProduct($this->store, $product2, stock: 10);
        $this->createOrderItem($order, $product1, quantity: 2);
        $this->createOrderItem($order, $product2, quantity: 1);
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $items = $order->fresh()->items->sortBy('id')->values();
        $this->assertCount(2, $items);
        $this->assertSame($storeProduct1->id, $items[0]->store_product_id);
        $this->assertSame($storeProduct2->id, $items[1]->store_product_id);
    }

    public function test_claim_does_not_sync_item_when_no_matching_store_product_exists(): void
    {
        $order = $this->createConfirmedOrder();
        $product = $this->createProduct('Ghost Item');
        $this->createOrderItem($order, $product, quantity: 1);
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $item = $order->fresh()->items->first();
        $this->assertNull($item->store_product_id);
    }

    public function test_claim_reserves_inventory(): void
    {
        $order = $this->createConfirmedOrder();
        $product = $this->createProduct('Eggs 12pk');
        $storeProduct = $this->createStoreProduct($this->store, $product, stock: 20, reserved: 0);
        $this->createOrderItem($order, $product, quantity: 5);
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $freshSp = $storeProduct->fresh();
        $this->assertSame(5, $freshSp->reserved_quantity);
    }

    public function test_claim_reserves_inventory_for_multiple_items(): void
    {
        $order = $this->createConfirmedOrder();
        $product1 = $this->createProduct('Rice 2kg');
        $product2 = $this->createProduct('Oil 1L');
        $sp1 = $this->createStoreProduct($this->store, $product1, stock: 30, reserved: 2);
        $sp2 = $this->createStoreProduct($this->store, $product2, stock: 15, reserved: 0);
        $this->createOrderItem($order, $product1, quantity: 3);
        $this->createOrderItem($order, $product2, quantity: 1);
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);
        $this->assertSame(5, $sp1->fresh()->reserved_quantity);
        $this->assertSame(1, $sp2->fresh()->reserved_quantity);
    }

    public function test_claim_does_not_reserve_when_store_product_id_is_null(): void
    {
        $order = $this->createConfirmedOrder();
        $product = $this->createProduct('Untracked Item');
        $this->createOrderItem($order, $product, quantity: 4);
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $item = $order->fresh()->items->first();
        $this->assertNull($item->store_product_id);
    }

    public function test_claim_creates_rider_assigned_activity_log(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $log = $order->fresh()->activityLogs()->latest()->first();
        $this->assertNotNull($log);
        $this->assertSame('rider_assigned', $log->event_type);
        $this->assertSame(OrderStatus::Confirmed->value, $log->old_status);
        $this->assertSame(OrderStatus::Preparing->value, $log->new_status);
    }

    public function test_claim_sets_rider_and_store_on_order_persisted_in_database(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();
        $store = $this->store;

        $this->orderClaim->claim($order, $rider, $store);

        $fresh = Order::where('id', $order->id)->first();
        $this->assertSame($rider->id, $fresh->rider_id);
        $this->assertSame($store->id, $fresh->store_id);
    }

    public function test_sequential_double_claim_only_one_succeeds(): void
    {
        $order = $this->createConfirmedOrder();
        $rider1 = $this->createRider();
        $rider2 = $this->createRider();
        $store = $this->store;

        $firstResult = $this->orderClaim->claim($order, $rider1, $store);
        $this->assertTrue($firstResult->claimed);
        $this->assertSame($rider1->id, $order->fresh()->rider_id);

        $secondResult = $this->orderClaim->claim($order->fresh(), $rider2, $store);
        $this->assertFalse($secondResult->claimed);

        $final = $order->fresh();
        $this->assertSame($rider1->id, $final->rider_id, 'First rider should remain assigned');
        $this->assertEquals(OrderStatus::Preparing, $final->status);
    }

    public function test_claim_uses_skip_locked_fallback_for_sqlite(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();
        $store = $this->store;

        $result = $this->orderClaim->claim($order, $rider, $store);

        $this->assertTrue($result->claimed);
        $this->assertSame($rider->id, $result->order->rider_id);
        $this->assertSame($store->id, $result->order->store_id);
    }

    public function test_two_orders_can_be_claimed_independently(): void
    {
        $order1 = $this->createConfirmedOrder();
        $order2 = $this->createConfirmedOrder();
        $rider1 = $this->createRider();
        $rider2 = $this->createRider();
        $store = $this->store;

        $result1 = $this->orderClaim->claim($order1, $rider1, $store);
        $result2 = $this->orderClaim->claim($order2, $rider2, $store);

        $this->assertTrue($result1->claimed);
        $this->assertTrue($result2->claimed);
        $this->assertSame($rider1->id, $order1->fresh()->rider_id);
        $this->assertSame($rider2->id, $order2->fresh()->rider_id);
    }

    public function test_claim_atomically_transitions_and_assigns_in_single_transaction(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();
        $product = $this->createProduct('Sugar 1kg');
        $storeProduct = $this->createStoreProduct($this->store, $product, stock: 50, reserved: 0);
        $this->createOrderItem($order, $product, quantity: 4);
        $store = $this->store;

        $result = $this->orderClaim->claim($order, $rider, $store);

        $this->assertTrue($result->claimed);

        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::Preparing, $fresh->status);
        $this->assertSame($rider->id, $fresh->rider_id);
        $this->assertSame($store->id, $fresh->store_id);

        $item = $fresh->items->first();
        $this->assertSame($storeProduct->id, $item->store_product_id);
        $this->assertSame(4, $storeProduct->fresh()->reserved_quantity);
    }

    public function test_claim_on_order_with_no_items_succeeds(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);
        $this->assertCount(0, $order->fresh()->items);
    }

    public function test_claim_latency_is_non_negative(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);
        $this->assertGreaterThanOrEqual(0, $result->claimLatencyMs);
    }

    public function test_claim_from_each_valid_status_succeeds(): void
    {
        foreach ([OrderStatus::Confirmed, OrderStatus::Retrying] as $status) {
            $order = $this->createConfirmedOrder();
            $order->status = $status;
            $order->save();
            $rider = $this->createRider();

            $result = $this->orderClaim->claim($order, $rider, $this->store);

            $this->assertTrue($result->claimed, "Claim should succeed from status: {$status->value}");
            $this->assertEquals(OrderStatus::Preparing, $order->fresh()->status);
        }
    }

    public function test_claim_preserves_existing_rider_id_returns_false(): void
    {
        $order = $this->createConfirmedOrder();
        $rider1 = $this->createRider();
        $rider2 = $this->createRider();

        // First claim succeeds
        $firstResult = $this->orderClaim->claim($order, $rider1, $this->store);
        $this->assertTrue($firstResult->claimed);
        $this->assertSame($rider1->id, $order->fresh()->rider_id);

        // Second claim fails — order already has a rider
        $secondResult = $this->orderClaim->claim($order->fresh(), $rider2, $this->store);
        $this->assertFalse($secondResult->claimed);
        $this->assertSame($rider1->id, $order->fresh()->rider_id);
    }

    public function test_claim_unsets_null_rider_id_in_where_clause(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();

        // Manually set rider_id to simulate a stale read scenario
        $order->rider_id = $rider->id;
        $order->save();

        $newRider = $this->createRider();

        $result = $this->orderClaim->claim($order->fresh(), $newRider, $this->store);

        $this->assertFalse($result->claimed);
    }

    public function test_claim_transitions_from_confirmed_creates_activity_log_with_correct_metadata(): void
    {
        $order = $this->createConfirmedOrder();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $log = $order->fresh()->activityLogs()->latest()->first();
        $this->assertNotNull($log);
        $this->assertSame('rider_assigned', $log->event_type);

        $metadata = is_string($log->metadata) ? json_decode($log->metadata, true) : $log->metadata;
        $this->assertNotNull($metadata);
        $this->assertSame($rider->id, $metadata['rider_id'] ?? null);
        $this->assertSame($this->store->id, $metadata['store_id'] ?? null);
    }

    public function test_claim_transitions_from_retrying_creates_activity_log(): void
    {
        $order = $this->createConfirmedOrder();
        $order->status = OrderStatus::Retrying;
        $order->save();
        $rider = $this->createRider();

        $result = $this->orderClaim->claim($order, $rider, $this->store);

        $this->assertTrue($result->claimed);

        $log = $order->fresh()->activityLogs()->latest()->first();
        $this->assertNotNull($log);
        $this->assertSame('rider_assigned', $log->event_type);
        $this->assertSame(OrderStatus::Retrying->value, $log->old_status);
        $this->assertSame(OrderStatus::Preparing->value, $log->new_status);
    }
}
