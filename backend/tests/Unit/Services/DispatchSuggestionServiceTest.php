<?php

namespace Tests\Unit\Services;

use App\Services\DispatchSuggestionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DispatchSuggestionServiceTest extends TestCase
{
    use RefreshDatabase;

    private DispatchSuggestionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DispatchSuggestionService;
    }

    private function createStore(array $overrides = []): int
    {
        static $num = 0;
        $num++;

        return DB::table('stores')->insertGetId(array_merge([
            'name' => 'Store '.$num,
            'slug' => 'store-'.$num,
            'address' => '123 Main St',
            'city' => 'Durban',
            'province' => 'KZN',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.02,
            'delivery_radius_km' => 10,
            'phone' => '+2731000000'.$num,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }

    private function createCustomer(int $storeId): int
    {
        static $num = 0;
        $num++;

        return DB::table('users')->insertGetId([
            'name' => 'Customer '.$num,
            'email' => 'cust'.$num.'@example.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createRider(int $storeId, array $overrides = []): int
    {
        static $num = 0;
        $num++;
        $userId = DB::table('users')->insertGetId([
            'name' => 'Rider '.$num,
            'email' => 'rider'.$num.'@example.com',
            'password' => bcrypt('password'),
            'role' => 'rider',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('riders')->insertGetId(array_merge([
            'user_id' => $userId,
            'store_id' => $storeId,
            'vehicle_type' => 'Motorbike',
            'is_available' => true,
            'max_radius_km' => 15.00,
            'latitude' => -29.86,
            'longitude' => 31.01,
            'total_deliveries' => 0,
            'average_rating' => 5.00,
            'xp' => 0,
            'level' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }

    private function createOrder(int $customerId, int $storeId, array $overrides = []): int
    {
        static $num = 0;
        $num++;

        return DB::table('orders')->insertGetId(array_merge([
            'order_number' => 'ORD-'.str_pad($num, 4, '0', STR_PAD_LEFT),
            'customer_id' => $customerId,
            'store_id' => $storeId,
            'status' => 'pending',
            'payment_status' => 'pending',
            'subtotal' => 350.00,
            'delivery_fee' => 50.00,
            'total' => 400.00,
            'delivery_latitude' => -29.87,
            'delivery_longitude' => 31.03,
            'delivery_address' => '456 Delivery St',
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }

    public function test_returns_nearest_rider_by_distance(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer($storeId);
        $orderId = $this->createOrder($customerId, $storeId);

        // Rider close to order delivery location (-29.87, 31.03)
        $nearRiderId = $this->createRider($storeId, [
            'latitude' => -29.871,
            'longitude' => 31.031,
        ]);

        // Rider far from order
        $farRiderId = $this->createRider($storeId, [
            'latitude' => -29.90,
            'longitude' => 31.10,
        ]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNotNull($suggestion);
        $this->assertEquals($nearRiderId, $suggestion->nearest_rider->id);
    }

    public function test_excludes_unavailable_riders(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer($storeId);
        $orderId = $this->createOrder($customerId, $storeId);

        $this->createRider($storeId, [
            'is_available' => false,
            'latitude' => -29.871,
            'longitude' => 31.031,
        ]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNull($suggestion->nearest_rider);
    }

    public function test_excludes_riders_with_insufficient_radius(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer($storeId);
        // Order far from store
        $orderId = $this->createOrder($customerId, $storeId, [
            'delivery_latitude' => -29.95,
            'delivery_longitude' => 31.15,
        ]);

        // Rider with small radius
        $this->createRider($storeId, [
            'max_radius_km' => 2.00,
            'latitude' => -29.86,
            'longitude' => 31.01,
        ]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNull($suggestion->nearest_rider);
    }

    public function test_returns_alternative_riders(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer($storeId);
        $orderId = $this->createOrder($customerId, $storeId);

        $this->createRider($storeId, ['latitude' => -29.871, 'longitude' => 31.031]);
        $this->createRider($storeId, ['latitude' => -29.872, 'longitude' => 31.032]);
        $this->createRider($storeId, ['latitude' => -29.873, 'longitude' => 31.033]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNotNull($suggestion->nearest_rider);
        $this->assertNotEmpty($suggestion->alternative_riders);
        $this->assertLessThanOrEqual(3, count($suggestion->alternative_riders));
    }

    public function test_returns_order_details(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer($storeId);
        $orderId = $this->createOrder($customerId, $storeId);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNotNull($suggestion->order);
        $this->assertEquals($orderId, $suggestion->order->id);
    }

    public function test_returns_null_for_nonexistent_order(): void
    {
        $suggestion = $this->service->getSuggestion(99999);

        $this->assertNull($suggestion);
    }

    public function test_distance_is_calculated_correctly(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer($storeId);
        $orderId = $this->createOrder($customerId, $storeId);

        $riderId = $this->createRider($storeId, [
            'latitude' => -29.871,
            'longitude' => 31.031,
        ]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNotNull($suggestion->nearest_rider);
        $this->assertGreaterThan(0, $suggestion->nearest_rider->distance_meters);
        $this->assertLessThan(5000, $suggestion->nearest_rider->distance_meters);
    }
}
