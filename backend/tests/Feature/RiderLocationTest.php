<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\RiderLocation;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RiderLocationTest extends TestCase
{
    use RefreshDatabase;

    private const LAT = '-29.8587';

    private const LNG = '31.0218';

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
            'latitude' => self::LAT,
            'longitude' => self::LNG,
        ]);
    }

    private function makeOrder(Store $store, User $customer, ?Rider $rider = null): Order
    {
        $order = Order::create([
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'rider_id' => $rider?->id,
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'status' => $rider ? OrderStatus::OutForDelivery : OrderStatus::Pending,
            'payment_status' => 'pending',
            'delivery_address' => '10 Beach Road, Durban',
            'delivery_latitude' => '-29.8600',
            'delivery_longitude' => '31.0300',
            'subtotal' => 100.00,
            'delivery_fee' => 25.00,
            'total' => 125.00,
        ]);

        $category = Category::create(['name' => 'Bread', 'slug' => 'bread']);
        $product = Product::create([
            'name' => 'White Bread',
            'slug' => 'white-bread-' . uniqid(),
            'price' => 18.99,
            'unit' => 'each',
            'category_id' => $category->id,
            'images' => [],
            'is_active' => true,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 18.99,
            'total_price' => 37.98,
            'product_snapshot' => ['name' => 'White Bread', 'unit' => 'each'],
        ]);

        return $order;
    }

    // ── GET /orders/{id}/rider-location ─────────────────────────────

    public function test_customer_can_view_rider_location_for_their_order(): void
    {
        $store = $this->makeStore();
        $customer = $this->makeCustomer();
        $rider = $this->makeRider($store);
        $order = $this->makeOrder($store, $customer, $rider);

        RiderLocation::create([
            'rider_id' => $rider->id,
            'latitude' => '-29.8550',
            'longitude' => '31.0250',
            'recorded_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($customer)
            ->getJson("/api/orders/{$order->id}/rider-location");

        $response->assertOk()->assertJsonStructure([
            'data' => ['latitude', 'longitude', 'recorded_at'],
        ]);

        $data = $response->json('data');
        $this->assertEquals(-29.8550, (float) $data['latitude']);
        $this->assertEquals(31.0250, (float) $data['longitude']);
        $this->assertNotNull($data['recorded_at']);
    }

    public function test_returns_null_when_order_has_no_rider(): void
    {
        $store = $this->makeStore();
        $customer = $this->makeCustomer();
        $order = $this->makeOrder($store, $customer);

        $response = $this->actingAs($customer)
            ->getJson("/api/orders/{$order->id}/rider-location");

        $response->assertOk()->assertJson(['data' => null]);
    }

    public function test_returns_null_when_rider_has_no_location(): void
    {
        $store = $this->makeStore();
        $customer = $this->makeCustomer();
        $rider = $this->makeRider($store);
        $order = $this->makeOrder($store, $customer, $rider);

        $response = $this->actingAs($customer)
            ->getJson("/api/orders/{$order->id}/rider-location");

        $response->assertOk()->assertJson(['data' => null]);
    }

    public function test_cannot_view_other_customers_order_rider_location(): void
    {
        $store = $this->makeStore();
        $customer = $this->makeCustomer();
        $otherCustomer = User::create([
            'name' => 'Other',
            'email' => 'other@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);
        $rider = $this->makeRider($store);
        $order = $this->makeOrder($store, $customer, $rider);

        RiderLocation::create([
            'rider_id' => $rider->id,
            'latitude' => '-29.8550',
            'longitude' => '31.0250',
            'recorded_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($otherCustomer)
            ->getJson("/api/orders/{$order->id}/rider-location");

        $response->assertForbidden();
    }

    public function test_returns_most_recent_location_when_multiple_exist(): void
    {
        $store = $this->makeStore();
        $customer = $this->makeCustomer();
        $rider = $this->makeRider($store);
        $order = $this->makeOrder($store, $customer, $rider);

        RiderLocation::create([
            'rider_id' => $rider->id,
            'latitude' => '-29.8500',
            'longitude' => '31.0200',
            'recorded_at' => Carbon::now()->subMinutes(5),
        ]);

        RiderLocation::create([
            'rider_id' => $rider->id,
            'latitude' => '-29.8555',
            'longitude' => '31.0255',
            'recorded_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($customer)
            ->getJson("/api/orders/{$order->id}/rider-location");

        $data = $response->json('data');
        $this->assertEquals(-29.8555, (float) $data['latitude']);
        $this->assertEquals(31.0255, (float) $data['longitude']);
    }

    // ── POST /rider/location ────────────────────────────────────────

    public function test_rider_can_update_location(): void
    {
        $store = $this->makeStore();
        $rider = $this->makeRider($store);

        $response = $this->actingAs($rider->user)
            ->postJson('/api/rider/location', [
                'latitude' => -29.8600,
                'longitude' => 31.0300,
            ]);

        $response->assertOk()->assertJson(['message' => 'Location updated']);

        $this->assertDatabaseHas('rider_locations', [
            'rider_id' => $rider->id,
            'latitude' => -29.8600,
            'longitude' => 31.0300,
        ]);
    }

    public function test_rider_location_update_sets_recorded_at(): void
    {
        $store = $this->makeStore();
        $rider = $this->makeRider($store);

        $this->actingAs($rider->user)
            ->postJson('/api/rider/location', [
                'latitude' => -29.8600,
                'longitude' => 31.0300,
            ]);

        $location = RiderLocation::where('rider_id', $rider->id)->first();
        $this->assertNotNull($location);
        $this->assertNotNull($location->recorded_at);
    }

    public function test_rider_location_update_overwrites_previous(): void
    {
        $store = $this->makeStore();
        $rider = $this->makeRider($store);

        $this->actingAs($rider->user)
            ->postJson('/api/rider/location', [
                'latitude' => -29.8600,
                'longitude' => 31.0300,
            ]);

        $this->actingAs($rider->user)
            ->postJson('/api/rider/location', [
                'latitude' => -29.8700,
                'longitude' => 31.0400,
            ]);

        $this->assertEquals(1, RiderLocation::where('rider_id', $rider->id)->count());

        $location = RiderLocation::where('rider_id', $rider->id)->first();
        $this->assertEquals(-29.8700, (float) $location->latitude);
    }

    public function test_non_rider_cannot_update_location(): void
    {
        $customer = $this->makeCustomer();

        $response = $this->actingAs($customer)
            ->postJson('/api/rider/location', [
                'latitude' => -29.8600,
                'longitude' => 31.0300,
            ]);

        $response->assertForbidden();
    }

    public function test_location_update_requires_valid_coordinates(): void
    {
        $store = $this->makeStore();
        $rider = $this->makeRider($store);

        $response = $this->actingAs($rider->user)
            ->postJson('/api/rider/location', [
                'latitude' => 999,
                'longitude' => 31.0300,
            ]);

        $response->assertUnprocessable();
    }
}
