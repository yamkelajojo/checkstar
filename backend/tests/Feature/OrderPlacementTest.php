<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
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

class OrderPlacementTest extends TestCase
{
    use RefreshDatabase;

    private const LAT = '-29.8587';

    private const LNG = '31.0218';

    private function makeCustomer(): User
    {
        return User::create([
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'phone' => '+27 72 123 4567',
            'is_active' => true,
        ]);
    }

    private function makeStore(): Store
    {
        return Store::create([
            'name' => 'Durban Central',
            'slug' => 'durban-central',
            'address' => '1 Smith Street',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'phone' => '+27 31 000 0000',
            'latitude' => self::LAT,
            'longitude' => self::LNG,
            'delivery_radius_km' => 50,
            'is_active' => true,
        ]);
    }

    private function makeRider(Store $store): Rider
    {
        $user = User::create([
            'name' => 'Test Rider',
            'email' => 'rider@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Rider,
            'phone' => '+27 76 123 4567',
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
        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Coca-Cola 2L',
            'slug' => 'coca-cola-2l',
            'unit' => 'each',
            'price' => 22.00,
            'is_active' => true,
        ]);
    }

    private function makeOrder(User $customer, string $status = 'pending'): Order
    {
        return Order::create([
            'order_number' => 'CS-TEST-'.strtoupper(Str::random(8)),
            'customer_id' => $customer->id,
            'store_id' => $this->makeStore()->id,
            'status' => $status,
            'payment_status' => 'pending',
            'delivery_address' => '1 Test Street, Durban',
            'subtotal' => 0,
            'delivery_fee' => 0,
            'total' => 0,
        ]);
    }

    public function test_customer_can_place_an_order(): void
    {
        $store = $this->makeStore();
        $this->makeRider($store);
        $product = $this->makeProduct();
        StoreProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock_quantity' => 10,
            'is_available' => true,
        ]);
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'delivery_address' => '1 Test Street, Durban',
            'delivery_latitude' => self::LAT,
            'delivery_longitude' => self::LNG,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['order_number', 'items'], 'dispatch' => ['status']])
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.status', 'preparing')
            ->assertJsonPath('data.rider_id', $store->riders()->first()->id)
            ->assertJsonPath('data.store_id', $store->id)
            ->assertJsonPath('dispatch.status', 'assigned')
            ->assertJsonPath('dispatch.rider_id', $store->riders()->first()->id)
            ->assertJsonPath('dispatch.store_id', $store->id)
            ->assertJsonPath('dispatch.rider_name', 'Test Rider')
            ->assertJsonPath('dispatch.store_name', 'Durban Central');

        // Money contract: the JSON carries exact integer-cents mirrors of the
        // decimal columns — the mobile app prices in cents and renders zero
        // without them. (2 x R22.00 = R44.00 = 4400c, no delivery fee.)
        $response->assertJsonPath('data.subtotal_cents', 4400)
            ->assertJsonPath('data.delivery_fee_cents', 0)
            ->assertJsonPath('data.total_cents', 4400)
            ->assertJsonPath('data.items.0.unit_price_cents', 2200)
            ->assertJsonPath('data.items.0.total_price_cents', 4400);
    }

    public function test_order_with_no_available_rider_enters_retrying_and_keeps_cart(): void
    {
        Queue::fake();

        $store = $this->makeStore();
        $product = $this->makeProduct();
        StoreProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock_quantity' => 10,
            'is_available' => true,
        ]);
        $customer = $this->makeCustomer();
        $customer->cartItems()->create(['product_id' => $product->id, 'quantity' => 1]);

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'delivery_address' => '1 Test Street, Durban',
            'delivery_latitude' => self::LAT,
            'delivery_longitude' => self::LNG,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('dispatch.status', 'retrying')
            ->assertJsonPath('data.status', 'retrying');

        Queue::assertPushed(RetryDispatch::class);

        // Keep-on-cancel decision (#04): the cart survives so the Customer can re-checkout.
        $this->actingAs($customer)
            ->getJson('/api/cart')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_order_defaults_to_cash_on_delivery(): void
    {
        $store = $this->makeStore();
        $this->makeRider($store);
        $product = $this->makeProduct();
        StoreProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock_quantity' => 10,
            'is_available' => true,
        ]);
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'delivery_address' => '1 Test Street, Durban',
            'delivery_latitude' => self::LAT,
            'delivery_longitude' => self::LNG,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.payment_method', 'cash_on_delivery');
    }

    public function test_placing_an_order_clears_the_server_cart(): void
    {
        $store = $this->makeStore();
        $this->makeRider($store);
        $product = $this->makeProduct();
        StoreProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock_quantity' => 10,
            'is_available' => true,
        ]);
        $customer = $this->makeCustomer();
        $customer->cartItems()->create(['product_id' => $product->id, 'quantity' => 2]);

        $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'delivery_address' => '1 Test Street, Durban',
            'delivery_latitude' => self::LAT,
            'delivery_longitude' => self::LNG,
        ])->assertStatus(201);

        $this->actingAs($customer)
            ->getJson('/api/cart')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_failed_placement_leaves_server_cart_intact(): void
    {
        $product = $this->makeProduct();
        $customer = $this->makeCustomer();
        $customer->cartItems()->create(['product_id' => $product->id, 'quantity' => 2]);

        $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => 999999, 'quantity' => 1]],
            'delivery_address' => '1 Test Street, Durban',
            'delivery_latitude' => self::LAT,
            'delivery_longitude' => self::LNG,
        ])->assertStatus(422);

        $this->actingAs($customer)
            ->getJson('/api/cart')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_order_requires_delivery_coordinates(): void
    {
        $product = $this->makeProduct();
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'delivery_address' => '1 Test Street, Durban',
        ]);

        $response->assertStatus(422);
    }

    public function test_customer_can_view_own_order(): void
    {
        $customer = $this->makeCustomer();
        $order = $this->makeOrder($customer);

        $this->actingAs($customer)
            ->getJson("/api/orders/{$order->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $order->id);
    }

    public function test_customer_cannot_view_others_order(): void
    {
        $owner = $this->makeCustomer();
        $intruder = User::create([
            'name' => 'Intruder',
            'email' => 'intruder@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'phone' => '+27 72 999 9999',
            'is_active' => true,
        ]);
        $order = $this->makeOrder($owner);

        $this->actingAs($intruder)
            ->getJson("/api/orders/{$order->id}")
            ->assertStatus(403);
    }

    public function test_customer_can_cancel_own_order(): void
    {
        $customer = $this->makeCustomer();
        $order = $this->makeOrder($customer);

        $this->actingAs($customer)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_customer_cannot_cancel_others_order(): void
    {
        $owner = $this->makeCustomer();
        $intruder = User::create([
            'name' => 'Intruder',
            'email' => 'intruder@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'phone' => '+27 72 999 9999',
            'is_active' => true,
        ]);
        $order = $this->makeOrder($owner);

        $this->actingAs($intruder)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(403);
    }

    public function test_customer_cannot_cancel_out_for_delivery_order(): void
    {
        $customer = $this->makeCustomer();
        $order = $this->makeOrder($customer, OrderStatus::OutForDelivery->value);

        $this->actingAs($customer)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(409)
            ->assertJson(['reason' => 'order_not_cancellable']);
    }

    public function test_customer_can_confirm_own_delivery(): void
    {
        $customer = $this->makeCustomer();
        $order = $this->makeOrder($customer, OrderStatus::OutForDelivery->value);

        $this->actingAs($customer)
            ->postJson("/api/orders/{$order->id}/confirm")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'delivered')
            ->assertJsonPath('data.payment_status', 'paid');
    }

    public function test_customer_cannot_confirm_others_order(): void
    {
        $owner = $this->makeCustomer();
        $intruder = User::create([
            'name' => 'Intruder',
            'email' => 'intruder@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'phone' => '+27 72 999 9999',
            'is_active' => true,
        ]);
        $order = $this->makeOrder($owner, OrderStatus::OutForDelivery->value);

        $this->actingAs($intruder)
            ->postJson("/api/orders/{$order->id}/confirm")
            ->assertStatus(403);
    }
}
