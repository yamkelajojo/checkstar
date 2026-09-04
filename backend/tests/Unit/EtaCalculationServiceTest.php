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
use App\Services\EtaCalculationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class EtaCalculationServiceTest extends TestCase
{
    use RefreshDatabase;

    private EtaCalculationService $service;

    private Rider $rider;

    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new EtaCalculationService;

        $user = User::create([
            'name' => 'Rider One',
            'email' => 'rider@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

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

        $this->rider = Rider::create([
            'user_id' => $user->id,
            'store_id' => $this->store->id,
            'is_available' => true,
            'max_radius_km' => 10,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);
    }

    private function createOrderWithRider(Rider $rider): Order
    {
        $customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        return Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'rider_id' => $rider->id,
            'store_id' => $this->store->id,
            'status' => OrderStatus::OutForDelivery,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 100,
            'delivery_fee' => 10,
            'total' => 110,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);
    }

    public function test_calculate_returns_null_when_no_rider(): void
    {
        $customer = User::create([
            'name' => 'Customer',
            'email' => 'c@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => $customer->id,
            'rider_id' => null,
            'store_id' => $this->store->id,
            'status' => OrderStatus::Confirmed,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100,
            'delivery_fee' => 10,
            'total' => 110,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
        ]);

        $result = $this->service->calculateForOrder($order);

        $this->assertNull($result);
    }

    public function test_calculate_returns_null_when_no_delivery_coords(): void
    {
        $order = $this->createOrderWithRider($this->rider);
        $order->update(['delivery_latitude' => null, 'delivery_longitude' => null]);

        $result = $this->service->calculateForOrder($order);

        $this->assertNull($result);
    }

    public function test_calculate_returns_null_when_no_rider_location(): void
    {
        $order = $this->createOrderWithRider($this->rider);

        $result = $this->service->calculateForOrder($order);

        $this->assertNull($result);
    }

    public function test_calculate_returns_null_when_gps_stale(): void
    {
        $order = $this->createOrderWithRider($this->rider);

        RiderLocation::create([
            'rider_id' => $this->rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now()->subSeconds(120),
        ]);

        $result = $this->service->calculateForOrder($order);

        $this->assertNull($result);
    }

    public function test_calculate_returns_eta_from_haversine_when_osrm_unavailable(): void
    {
        config(['routing.osrm_base_url' => null]);

        $order = $this->createOrderWithRider($this->rider);

        RiderLocation::create([
            'rider_id' => $this->rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now(),
        ]);

        $result = $this->service->calculateForOrder($order);

        $this->assertNotNull($result);
        $this->assertArrayHasKey('eta_seconds', $result);
        $this->assertArrayHasKey('distance_meters', $result);
        $this->assertEquals('haversine', $result['source']);
        $this->assertGreaterThan(0, $result['eta_seconds']);
        $this->assertGreaterThan(0, $result['distance_meters']);
    }

    public function test_calculate_uses_osrm_when_available(): void
    {
        config(['routing.osrm_base_url' => 'https://router.project-osrm.org']);

        Http::fake([
            '*/route/*' => Http::response([
                'routes' => [[
                    'duration' => 180,
                ]],
            ]),
        ]);

        $order = $this->createOrderWithRider($this->rider);

        RiderLocation::create([
            'rider_id' => $this->rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now(),
        ]);

        $result = $this->service->calculateForOrder($order);

        $this->assertNotNull($result);
        $this->assertEquals('osrm', $result['source']);
        $this->assertEquals(180, $result['eta_seconds']);
    }

    public function test_calculate_updates_order_eta_fields(): void
    {
        config(['routing.osrm_base_url' => null]);

        $order = $this->createOrderWithRider($this->rider);

        RiderLocation::create([
            'rider_id' => $this->rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now(),
        ]);

        $this->service->calculateForOrder($order);

        $fresh = $order->fresh();
        $this->assertNotNull($fresh->eta_seconds);
        $this->assertNotNull($fresh->eta_updated_at);
    }

    public function test_needs_recalculation_true_when_no_eta_updated_at(): void
    {
        $order = $this->createOrderWithRider($this->rider);
        $order->update(['eta_updated_at' => null]);

        $result = $this->service->needsRecalculation($order);

        $this->assertTrue($result);
    }

    public function test_needs_recalculation_true_when_rider_moved_far(): void
    {
        $order = $this->createOrderWithRider($this->rider);
        $order->update(['eta_updated_at' => now()]);

        RiderLocation::create([
            'rider_id' => $this->rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now(),
        ]);

        $order->update([
            'delivery_latitude' => -29.9000,
            'delivery_longitude' => 31.1000,
        ]);

        $result = $this->service->needsRecalculation($order);

        $this->assertTrue($result);
    }

    public function test_needs_recalculation_false_when_rider_close(): void
    {
        $order = $this->createOrderWithRider($this->rider);
        $order->update(['eta_updated_at' => now()]);

        RiderLocation::create([
            'rider_id' => $this->rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now(),
        ]);

        $order->update([
            'delivery_latitude' => -29.8591,
            'delivery_longitude' => 31.0216,
        ]);

        $result = $this->service->needsRecalculation($order);

        $this->assertFalse($result);
    }

    public function test_needs_recalculation_false_when_no_rider_location(): void
    {
        $order = $this->createOrderWithRider($this->rider);
        $order->update(['eta_updated_at' => now()]);

        $result = $this->service->needsRecalculation($order);

        $this->assertFalse($result);
    }

    public function test_osrm_failure_falls_back_to_haversine(): void
    {
        config(['routing.osrm_base_url' => 'https://router.project-osrm.org']);

        Http::fake([
            '*/route/*' => Http::response(null, 500),
        ]);

        $order = $this->createOrderWithRider($this->rider);

        RiderLocation::create([
            'rider_id' => $this->rider->id,
            'latitude' => -29.8590,
            'longitude' => 31.0215,
            'recorded_at' => now(),
        ]);

        $result = $this->service->calculateForOrder($order);

        $this->assertNotNull($result);
        $this->assertEquals('haversine', $result['source']);
    }
}
