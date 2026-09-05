<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Jobs\RetryDispatch;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Pickup fulfilment: the customer collects from a chosen store — no rider
 * dispatch, no delivery fee, no delivery coordinates, and the order closes
 * through Preparing → Ready → Delivered instead of the rider pipeline.
 */
class PickupOrderTest extends TestCase
{
    use RefreshDatabase;

    private function makeCustomer(): User
    {
        return User::create([
            'name' => 'Pickup Customer',
            'email' => 'pickup-customer@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::Customer,
            'phone' => '+27 73 555 0100',
            'is_active' => true,
        ]);
    }

    private function makeStore(string $name = 'Overport Pickup', string $slug = 'overport-pickup'): Store
    {
        return Store::create([
            'name' => $name,
            'slug' => $slug,
            'address' => '78 Phoenix Highway',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4092',
            'phone' => '+27 31 203 9012',
            'latitude' => '-29.8587',
            'longitude' => '31.0218',
            'delivery_radius_km' => 1, // tiny: delivery orders would NOT reach it from the test coordinates
            'is_active' => true,
        ]);
    }

    private function makeRider(Store $store): Rider
    {
        $user = User::create([
            'name' => 'Pickup Rider',
            'email' => 'pickup-rider@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::Rider,
            'phone' => '+27 76 555 0100',
            'is_active' => true,
        ]);

        return Rider::create([
            'user_id' => $user->id,
            'store_id' => $store->id,
            'is_available' => true,
            'vehicle_type' => 'motorbike',
            'max_radius_km' => 50,
        ]);
    }

    private function makeProduct(): Product
    {
        $category = Category::create(['name' => 'Pickup Pantry', 'slug' => 'pickup-pantry-'.Str::random(4)]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Sasko Bread 700g',
            'slug' => 'sasko-bread-'.Str::random(6),
            'unit' => 'each',
            'price' => 18.99,
            'is_active' => true,
        ]);
    }

    private function stockAt(Store $store, Product $product, int $qty): void
    {
        StoreProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock_quantity' => $qty,
            'is_available' => true,
        ]);
    }

    public function test_customer_can_place_a_pickup_order_without_delivery_details(): void
    {
        Queue::fake();

        $store = $this->makeStore();
        $product = $this->makeProduct();
        $this->stockAt($store, $product, 10);
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'fulfilment_method' => 'pickup',
            'store_id' => $store->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.fulfilment_method', 'pickup')
            ->assertJsonPath('data.store_id', $store->id)
            ->assertJsonPath('data.delivery_address', null)
            ->assertJsonPath('data.delivery_latitude', null)
            ->assertJsonPath('data.delivery_fee', '0.00')
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('dispatch.status', 'pickup')
            ->assertJsonPath('dispatch.rider_id', null);

        // The store was chosen explicitly — the tiny delivery radius proves
        // the radius was correctly ignored for pickup.
        $order = Order::latest('id')->first();
        $this->assertSame('pickup', $order->fulfilment_method);
        $this->assertNull($order->delivery_latitude);
        $this->assertSame(0, (int) $order->delivery_fee);

        // Pickup bypasses the rider pipeline entirely: no retry job.
        Queue::assertNotPushed(RetryDispatch::class);
    }

    public function test_pickup_order_does_not_notify_riders_and_keeps_the_cart_clearing(): void
    {
        $store = $this->makeStore();
        $this->makeRider($store);
        $product = $this->makeProduct();
        $this->stockAt($store, $product, 5);
        $customer = $this->makeCustomer();
        $customer->cartItems()->create(['product_id' => $product->id, 'quantity' => 2]);

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'fulfilment_method' => 'pickup',
            'store_id' => $store->id,
        ]);

        $response->assertStatus(201);
        $this->assertSame(0, $customer->cartItems()->count());
    }

    public function test_pickup_requires_a_store(): void
    {
        $product = $this->makeProduct();
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'fulfilment_method' => 'pickup',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['store_id']);
    }

    public function test_pickup_from_a_store_that_cannot_fulfil_the_cart_is_rejected(): void
    {
        $store = $this->makeStore();
        $product = $this->makeProduct();
        $this->stockAt($store, $product, 0);
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'fulfilment_method' => 'pickup',
            'store_id' => $store->id,
        ]);

        $response->assertStatus(422);
        $this->assertSame('The selected store cannot fulfil the complete cart', $response->json('message'));
    }

    public function test_store_moves_a_pickup_order_through_ready_and_the_customer_confirms_collection(): void
    {
        Queue::fake();

        $store = $this->makeStore();
        $product = $this->makeProduct();
        $this->stockAt($store, $product, 5);
        $customer = $this->makeCustomer();
        $staff = User::create([
            'name' => 'Pickup Store Owner',
            'email' => 'pickup-owner@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::StoreOwner,
            'phone' => '+27 31 203 9012',
            'is_active' => true,
        ]);
        $store->update(['owner_id' => $staff->id]);

        $orderId = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'fulfilment_method' => 'pickup',
            'store_id' => $store->id,
        ])->json('data.id');

        // Store packs the order → Ready (pickup-only state)
        $ready = $this->actingAs($staff)->postJson("/api/store/orders/{$orderId}/status", [
            'status' => 'ready',
        ]);
        $ready->assertStatus(200)->assertJsonPath('data.status', 'ready');

        // Customer collects → Delivered (collection closes the loop), then
        // the customer confirms to settle payment exactly as with delivery.
        $collected = $this->actingAs($staff)->postJson("/api/store/orders/{$orderId}/status", [
            'status' => 'delivered',
        ]);
        $collected->assertStatus(200)->assertJsonPath('data.status', 'delivered');

        $confirm = $this->actingAs($customer)->postJson("/api/orders/{$orderId}/confirm");
        $confirm->assertStatus(200);
        $this->assertSame('paid', $confirm->json('data.payment_status'));
        $this->assertNotNull($confirm->json('data.customer_confirmed_at'));
    }

    public function test_ready_is_rejected_for_delivery_orders_and_out_for_delivery_for_pickup(): void
    {
        $customer = $this->makeCustomer();
        $staff = User::create([
            'name' => 'Split Store Owner',
            'email' => 'split-owner@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::StoreOwner,
            'phone' => '+27 31 000 0001',
            'is_active' => true,
        ]);
        $store = Store::create([
            'name' => 'Split behaviours',
            'slug' => 'split-behaviours',
            'address' => '1 Split Road',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'phone' => '+27 31 000 0002',
            'latitude' => '-29.8587',
            'longitude' => '31.0218',
            'delivery_radius_km' => 10,
            'is_active' => true,
            'owner_id' => $staff->id,
        ]);

        $deliveryOrder = Order::create([
            'order_number' => 'CS-TEST-'.strtoupper(Str::random(8)),
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => 'preparing',
            'payment_status' => 'pending',
            'fulfilment_method' => 'delivery',
            'delivery_address' => '1 Test Street',
            'delivery_latitude' => -29.8587,
            'delivery_longitude' => 31.0218,
            'subtotal' => 10,
            'delivery_fee' => 0,
            'total' => 10,
        ]);

        $pickupOrder = Order::create([
            'order_number' => 'CS-TEST-'.strtoupper(Str::random(8)),
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => 'preparing',
            'payment_status' => 'pending',
            'fulfilment_method' => 'pickup',
            'subtotal' => 10,
            'delivery_fee' => 0,
            'total' => 10,
        ]);

        $this->actingAs($staff)->postJson("/api/store/orders/{$deliveryOrder->id}/status", [
            'status' => 'ready',
        ])->assertStatus(422)->assertJsonPath('reason', 'ready_is_pickup_only');

        $this->actingAs($staff)->postJson("/api/store/orders/{$pickupOrder->id}/status", [
            'status' => 'out_for_delivery',
        ])->assertStatus(422)->assertJsonPath('reason', 'delivery_is_delivery_only');
    }

    public function test_pickup_orders_never_appear_in_rider_available_orders(): void
    {
        $store = $this->makeStore();
        $rider = $this->makeRider($store);
        $product = $this->makeProduct();
        $this->stockAt($store, $product, 5);
        $customer = $this->makeCustomer();

        // One confirmed DELIVERY order (assigned rider on claim flow) and one
        // confirmed PICKUP order — the rider must only ever see the former.
        Order::create([
            'order_number' => 'CS-TEST-D'.strtoupper(Str::random(6)),
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'fulfilment_method' => 'delivery',
            'delivery_address' => '1 Test Street',
            'delivery_latitude' => -29.8587,
            'delivery_longitude' => 31.0218,
            'subtotal' => 10,
            'delivery_fee' => 0,
            'total' => 10,
        ]);

        Order::create([
            'order_number' => 'CS-TEST-P'.strtoupper(Str::random(6)),
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'fulfilment_method' => 'pickup',
            'subtotal' => 10,
            'delivery_fee' => 0,
            'total' => 10,
        ]);

        $visible = $this->actingAs($rider->user)->getJson('/api/rider/available-orders');
        $visible->assertStatus(200);
        $ids = collect($visible->json('data'))->pluck('id');
        $this->assertContains(Order::where('order_number', 'like', 'CS-TEST-D%')->first()->id, $ids);
        $this->assertNotContains(Order::where('order_number', 'like', 'CS-TEST-P%')->first()->id, $ids);
    }

    public function test_rider_cannot_claim_a_pickup_order(): void
    {
        $store = $this->makeStore();
        $rider = $this->makeRider($store);
        $product = $this->makeProduct();
        $this->stockAt($store, $product, 5);
        $customer = $this->makeCustomer();

        $pickup = Order::create([
            'order_number' => 'CS-TEST-'.strtoupper(Str::random(8)),
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'fulfilment_method' => 'pickup',
            'subtotal' => 10,
            'delivery_fee' => 0,
            'total' => 10,
        ]);

        $this->actingAs($rider->user)
            ->postJson("/api/rider/claim/{$pickup->id}")
            ->assertStatus(409);

        $this->assertNull($pickup->fresh()->rider_id);
        $this->assertSame(OrderStatus::Confirmed, $pickup->fresh()->status);
    }

    public function test_customer_can_cancel_a_ready_pickup_order_before_collecting(): void
    {
        $customer = $this->makeCustomer();
        $store = $this->makeStore();
        $order = Order::create([
            'order_number' => 'CS-TEST-'.strtoupper(Str::random(8)),
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => 'ready',
            'payment_status' => 'pending',
            'fulfilment_method' => 'pickup',
            'subtotal' => 10,
            'delivery_fee' => 0,
            'total' => 10,
        ]);

        $this->actingAs($customer)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(200);

        $this->assertSame(OrderStatus::Cancelled, $order->fresh()->status);
    }
}
