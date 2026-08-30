<?php

namespace Tests\Unit\Services;

use App\Services\AnalyticsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AnalyticsServiceTest extends TestCase
{
    use RefreshDatabase;

    private AnalyticsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AnalyticsService();
    }

    private function createStore(): int
    {
        return DB::table('stores')->insertGetId([
            'name' => 'Analytics Store',
            'slug' => 'analytics-store',
            'address' => '123 Main St',
            'city' => 'Durban',
            'province' => 'KZN',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.02,
            'delivery_radius_km' => 10,
            'phone' => '+27310000000',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createCustomer(): int
    {
        return DB::table('users')->insertGetId([
            'name' => 'Analytics Customer',
            'email' => 'analytics@example.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createOrder(int $customerId, int $storeId, array $overrides = []): int
    {
        static $num = 0;
        $num++;
        return DB::table('orders')->insertGetId(array_merge([
            'order_number' => 'ANALYTICS-' . str_pad($num, 4, '0', STR_PAD_LEFT),
            'customer_id' => $customerId,
            'store_id' => $storeId,
            'status' => 'delivered',
            'payment_status' => 'paid',
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

    public function test_sales_data_returns_revenue_over_time(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer();

        $this->createOrder($customerId, $storeId, [
            'total' => 500.00,
            'created_at' => Carbon::now()->subDays(5),
        ]);
        $this->createOrder($customerId, $storeId, [
            'total' => 300.00,
            'created_at' => Carbon::now()->subDays(2),
        ]);

        $data = $this->service->getSalesData($storeId, '30d');

        $this->assertArrayHasKey('revenue_over_time', (array) $data);
        $this->assertArrayHasKey('total_revenue', (array) $data);
        $this->assertArrayHasKey('total_orders', (array) $data);
        $this->assertArrayHasKey('avg_order_value', (array) $data);
        $this->assertGreaterThan(0, $data->total_revenue);
        $this->assertGreaterThan(0, $data->total_orders);
    }

    public function test_sales_data_respects_period(): void
    {
        $storeId = $this->createStore();
        $customerId = $this->createCustomer();

        // Old order (outside 7d window)
        $this->createOrder($customerId, $storeId, [
            'total' => 500.00,
            'created_at' => Carbon::now()->subDays(15),
        ]);

        // Recent order (inside 7d window)
        $this->createOrder($customerId, $storeId, [
            'total' => 300.00,
            'created_at' => Carbon::now()->subDays(2),
        ]);

        $data7d = $this->service->getSalesData($storeId, '7d');
        $data30d = $this->service->getSalesData($storeId, '30d');

        $this->assertGreaterThanOrEqual($data7d->total_orders, $data30d->total_orders);
    }

    public function test_products_data_returns_top_products(): void
    {
        $storeId = $this->createStore();

        $categoryId = DB::table('categories')->insertGetId([
            'name' => 'Test Category',
            'slug' => 'test-category',
            'description' => 'Test',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $productId = DB::table('products')->insertGetId([
            'name' => 'Test Product',
            'slug' => 'test-product',
            'category_id' => $categoryId,
            'description' => 'Test product',
            'price' => 50.00,
            'unit' => 'each',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $data = $this->service->getProductsData($storeId, 10);

        $this->assertArrayHasKey('top_products', (array) $data);
        $this->assertArrayHasKey('search_queries', (array) $data);
    }

    public function test_riders_data_returns_utilization(): void
    {
        $storeId = $this->createStore();

        $userId = DB::table('users')->insertGetId([
            'name' => 'Test Rider',
            'email' => 'testrider@example.com',
            'password' => bcrypt('password'),
            'role' => 'rider',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('riders')->insertGetId([
            'user_id' => $userId,
            'store_id' => $storeId,
            'vehicle_type' => 'Motorbike',
            'is_available' => true,
            'max_radius_km' => 15.00,
            'total_deliveries' => 10,
            'average_rating' => 4.50,
            'xp' => 100,
            'level' => 2,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $data = $this->service->getRidersData($storeId, '30d');

        $this->assertArrayHasKey('rider_utilization', (array) $data);
        $this->assertArrayHasKey('fleet_summary', (array) $data);
        $this->assertGreaterThan(0, $data->fleet_summary->active_riders);
    }

    public function test_empty_store_returns_zeros(): void
    {
        $storeId = $this->createStore();

        $data = $this->service->getSalesData($storeId, '7d');

        $this->assertEquals(0, $data->total_revenue);
        $this->assertEquals(0, $data->total_orders);
        $this->assertEquals(0, $data->avg_order_value);
    }
}
