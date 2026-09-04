<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Rider;
use App\Models\RiderLocation;
use App\Models\Store;
use App\Models\User;
use App\Services\MapLayersService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MapLayersServiceTest extends TestCase
{
    use RefreshDatabase;

    private MapLayersService $service;

    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new MapLayersService;

        $this->store = Store::create([
            'name' => 'Test Store',
            'slug' => 'test-store',
            'city' => 'Durban',
            'province' => 'KZN',
            'postal_code' => '4001',
            'address' => '123 Test St',
            'phone' => '0311234567',
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'delivery_radius_km' => 10,
            'is_active' => true,
        ]);
    }

    private function createUser(string $email): User
    {
        return User::create([
            'name' => 'User',
            'email' => $email,
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);
    }

    public function test_cluster_points_groups_nearby_points(): void
    {
        $points = [
            [-29.8587, 31.0218],
            [-29.8588, 31.0219],
            [-29.8700, 31.0300],
        ];

        $result = $this->service->clusterPoints($points, precision: 2);

        $this->assertCount(2, $result);

        $counts = array_column($result, 'count');
        $this->assertContains(2, $counts);
        $this->assertContains(1, $counts);
    }

    public function test_cluster_points_returns_lat_lng_count(): void
    {
        $points = [
            [-29.8587, 31.0218],
            [-29.8588, 31.0219],
        ];

        $result = $this->service->clusterPoints($points, precision: 2);

        $this->assertCount(1, $result);
        $this->assertArrayHasKey('lat', $result[0]);
        $this->assertArrayHasKey('lng', $result[0]);
        $this->assertArrayHasKey('count', $result[0]);
        $this->assertEquals(2, $result[0]['count']);
    }

    public function test_cluster_points_averages_coordinates(): void
    {
        $points = [
            [-29.8587, 31.0218],
            [-29.8589, 31.0220],
        ];

        $result = $this->service->clusterPoints($points, precision: 2);

        $this->assertCount(1, $result);
        $this->assertEqualsWithDelta(-29.8588, $result[0]['lat'], 0.0001);
        $this->assertEqualsWithDelta(31.0219, $result[0]['lng'], 0.0001);
    }

    public function test_cluster_points_empty_input(): void
    {
        $result = $this->service->clusterPoints([]);

        $this->assertCount(0, $result);
    }

    public function test_get_layers_returns_traffic_routes_demand(): void
    {
        $result = $this->service->getLayers($this->store);

        $this->assertArrayHasKey('traffic', $result);
        $this->assertArrayHasKey('routes', $result);
        $this->assertArrayHasKey('demand', $result);
        $this->assertIsArray($result['traffic']);
        $this->assertIsArray($result['routes']);
        $this->assertIsArray($result['demand']);
    }

    public function test_traffic_includes_recent_orders(): void
    {
        $customer = $this->createUser('c1@test.com');
        Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 50,
            'delivery_fee' => 10,
            'total' => 60,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);

        $result = $this->service->getLayers($this->store);

        $this->assertNotEmpty($result['traffic']);
    }

    public function test_routes_includes_active_delivery_riders(): void
    {
        $customer = $this->createUser('c2@test.com');
        $user = User::create([
            'name' => 'Rider',
            'email' => 'rider@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);
        $rider = Rider::create([
            'user_id' => $user->id,
            'store_id' => $this->store->id,
            'is_available' => true,
            'max_radius_km' => 10,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);

        Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'rider_id' => $rider->id,
            'store_id' => $this->store->id,
            'status' => OrderStatus::OutForDelivery,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 50,
            'delivery_fee' => 10,
            'total' => 60,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);

        RiderLocation::create([
            'rider_id' => $rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now(),
        ]);

        $result = $this->service->getLayers($this->store);

        $this->assertNotEmpty($result['routes']);
        $this->assertEquals($rider->id, $result['routes'][0]['rider_id']);
    }

    public function test_routes_empty_when_no_active_deliveries(): void
    {
        $result = $this->service->getLayers($this->store);

        $this->assertEmpty($result['routes']);
    }

    public function test_demand_includes_orders_from_last_7_days(): void
    {
        $customer = $this->createUser('c3@test.com');
        Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'store_id' => $this->store->id,
            'status' => OrderStatus::Delivered,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 50,
            'delivery_fee' => 10,
            'total' => 60,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);

        $result = $this->service->getLayers($this->store);

        $this->assertNotEmpty($result['demand']);
    }
}
