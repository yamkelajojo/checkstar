<?php

namespace Tests\Unit;

use App\Services\DispatchSuggestionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DispatchSuggestionServiceTest extends TestCase
{
    use RefreshDatabase;

    private DispatchSuggestionService $service;

    private int $storeId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DispatchSuggestionService;

        $this->storeId = DB::table('stores')->insertGetId([
            'name' => 'Test Store '.uniqid(),
            'slug' => 'test-store',
            'address' => '123 Test St',
            'city' => 'Durban',
            'province' => 'KZN',
            'postal_code' => '4001',
            'phone' => '0311234567',
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'delivery_radius_km' => 10,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createRider(array $overrides = []): int
    {
        return DB::table('riders')->insertGetId(array_merge([
            'user_id' => DB::table('users')->insertGetId([
                'name' => 'Rider',
                'email' => uniqid('rider').'@test.com',
                'password' => bcrypt('password'),
                'role' => 'rider',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]),
            'store_id' => $this->storeId,
            'is_available' => true,
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'max_radius_km' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }

    private function createOrder(array $overrides = []): int
    {
        return DB::table('orders')->insertGetId(array_merge([
            'order_number' => 'ORD-'.uniqid(),
            'customer_id' => DB::table('users')->insertGetId([
                'name' => 'Customer',
                'email' => uniqid('cust').'@test.com',
                'password' => bcrypt('password'),
                'role' => 'customer',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]),
            'store_id' => $this->storeId,
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'subtotal' => 50,
            'delivery_fee' => 10,
            'total' => 60,
            'delivery_latitude' => -29.8600,
            'delivery_longitude' => 31.0200,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }

    public function test_suspended_riders_excluded(): void
    {
        $orderId = $this->createOrder();
        $this->createRider(['is_available' => true, 'suspended_at' => now()]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNull($suggestion->nearest_rider);
    }

    public function test_available_riders_included(): void
    {
        $orderId = $this->createOrder();
        $riderId = $this->createRider(['is_available' => true, 'suspended_at' => null]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNotNull($suggestion->nearest_rider);
        $this->assertEquals($riderId, $suggestion->nearest_rider->id);
    }

    public function test_unavailable_riders_excluded(): void
    {
        $orderId = $this->createOrder();
        $this->createRider(['is_available' => false, 'suspended_at' => null]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNull($suggestion->nearest_rider);
    }

    public function test_returns_null_for_nonexistent_order(): void
    {
        $result = $this->service->getSuggestion(99999);

        $this->assertNull($result);
    }

    public function test_returns_null_when_no_delivery_coords(): void
    {
        $orderId = $this->createOrder([
            'delivery_latitude' => null,
            'delivery_longitude' => null,
        ]);

        $suggestion = $this->service->getSuggestion($orderId);

        $this->assertNull($suggestion->nearest_rider);
    }
}
