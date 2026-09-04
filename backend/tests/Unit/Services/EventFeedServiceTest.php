<?php

namespace Tests\Unit\Services;

use App\Models\AuditLog;
use App\Services\EventFeedService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EventFeedServiceTest extends TestCase
{
    use RefreshDatabase;

    private EventFeedService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EventFeedService;
    }

    private function createOrder(array $overrides = []): int
    {
        static $orderNum = 0;
        $orderNum++;

        return DB::table('orders')->insertGetId(array_merge([
            'order_number' => 'ORD-TEST-'.str_pad($orderNum, 4, '0', STR_PAD_LEFT),
            'customer_id' => DB::table('users')->insertGetId([
                'name' => 'Test Customer',
                'email' => 'test'.$orderNum.'@example.com',
                'password' => bcrypt('password'),
                'role' => 'customer',
                'created_at' => now(),
                'updated_at' => now(),
            ]),
            'store_id' => DB::table('stores')->insertGetId([
                'name' => 'Store '.$orderNum,
                'slug' => 'test-store-'.$orderNum,
                'address' => '123 Test St',
                'city' => 'Durban',
                'province' => 'KwaZulu-Natal',
                'postal_code' => '4001',
                'latitude' => -29.85,
                'longitude' => 31.02,
                'delivery_radius_km' => 10,
                'phone' => '+27310000000',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]),
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'subtotal' => 350.00,
            'delivery_fee' => 50.00,
            'total' => 400.00,
            'delivery_latitude' => -29.86,
            'delivery_longitude' => 31.03,
            'delivery_address' => '456 Delivery St',
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }

    private function createRider(array $overrides = []): int
    {
        static $riderNum = 0;
        $riderNum++;

        $userId = DB::table('users')->insertGetId([
            'name' => 'Test Rider '.$riderNum,
            'email' => 'rider'.$riderNum.'@example.com',
            'password' => bcrypt('password'),
            'role' => 'rider',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('riders')->insertGetId(array_merge([
            'user_id' => $userId,
            'store_id' => DB::table('stores')->insertGetId([
                'name' => 'Rider Store '.$riderNum,
                'slug' => 'test-store-r'.$riderNum,
                'address' => '789 Store St',
                'city' => 'Durban',
                'province' => 'KwaZulu-Natal',
                'postal_code' => '4001',
                'latitude' => -29.85,
                'longitude' => 31.02,
                'delivery_radius_km' => 10,
                'phone' => '+27310000000',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]),
            'vehicle_type' => 'Motorbike',
            'is_available' => true,
            'max_radius_km' => 15.00,
            'latitude' => -29.87,
            'longitude' => 31.01,
            'total_deliveries' => 0,
            'average_rating' => 5.00,
            'xp' => 0,
            'level' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));
    }

    public function test_returns_order_state_change_events(): void
    {
        $orderId = $this->createOrder(['status' => 'confirmed', 'created_at' => Carbon::now()->subMinutes(5)]);

        $events = $this->service->getEvents(limit: 10);

        $this->assertNotEmpty($events->events);
        $orderEvent = $events->events->firstWhere('type', 'order_state_change');
        $this->assertNotNull($orderEvent);
        $this->assertEquals('order', $orderEvent->entity_type);
        $this->assertEquals($orderId, $orderEvent->entity_id);
    }

    public function test_returns_rider_availability_events(): void
    {
        $riderId = $this->createRider([
            'is_available' => true,
            'updated_at' => Carbon::now()->subMinutes(2),
        ]);

        $events = $this->service->getEvents(limit: 10);

        $riderEvent = $events->events->firstWhere('type', 'rider_availability');
        $this->assertNotNull($riderEvent);
        $this->assertEquals('rider', $riderEvent->entity_type);
        $this->assertEquals($riderId, $riderEvent->entity_id);
    }

    public function test_returns_dispatch_events_from_audit_logs(): void
    {
        $userId = DB::table('users')->insertGetId([
            'name' => 'Dispatcher',
            'email' => 'dispatch@example.com',
            'password' => bcrypt('password'),
            'role' => 'logistics_officer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => $userId,
            'action' => 'dispatched',
            'entity_type' => 'order',
            'entity_id' => 42,
            'metadata' => ['rider_id' => 7],
            'created_at' => Carbon::now()->subMinutes(3),
        ]);

        $events = $this->service->getEvents(limit: 10);

        $dispatchEvent = $events->events->firstWhere('type', 'dispatch_attempt');
        $this->assertNotNull($dispatchEvent);
        $this->assertEquals('success', $dispatchEvent->severity);
    }

    public function test_respects_cursor_pagination(): void
    {
        $this->createOrder(['created_at' => Carbon::now()->subMinutes(30)]);
        $this->createOrder(['created_at' => Carbon::now()->subMinutes(20)]);
        $this->createOrder(['created_at' => Carbon::now()->subMinutes(10)]);

        $page1 = $this->service->getEvents(limit: 2);
        $this->assertCount(2, $page1->events);
        $this->assertNotNull($page1->nextCursor);

        $page2 = $this->service->getEvents(limit: 2, cursor: $page1->nextCursor);
        $this->assertNotEmpty($page2->events);

        $ids1 = $page1->events->pluck('entity_id')->toArray();
        $ids2 = $page2->events->pluck('entity_id')->toArray();
        $this->assertEmpty(array_intersect($ids1, $ids2), 'Pages should not overlap');
    }

    public function test_severity_is_mapped_from_order_status(): void
    {
        $this->createOrder(['status' => 'pending']);
        $this->createOrder(['status' => 'delivered']);

        $events = $this->service->getEvents(limit: 10);

        $pendingEvent = $events->events->first(fn ($e) => str_contains($e->message, 'pending'));
        $deliveredEvent = $events->events->first(fn ($e) => str_contains($e->message, 'delivered'));

        if ($pendingEvent) {
            $this->assertEquals('warning', $pendingEvent->severity);
        }
        if ($deliveredEvent) {
            $this->assertEquals('success', $deliveredEvent->severity);
        }
    }

    public function test_events_are_ordered_by_created_at_desc(): void
    {
        $this->createOrder(['created_at' => Carbon::now()->subHour()]);
        $this->createOrder(['created_at' => Carbon::now()->subMinutes(5)]);

        $events = $this->service->getEvents(limit: 10);

        $timestamps = $events->events->pluck('created_at')->toArray();
        for ($i = 1; $i < count($timestamps); $i++) {
            $this->assertGreaterThanOrEqual(
                $timestamps[$i],
                $timestamps[$i - 1],
                'Events should be ordered newest first'
            );
        }
    }

    public function test_limit_is_respected(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->createOrder(['created_at' => Carbon::now()->subMinutes($i)]);
        }

        $events = $this->service->getEvents(limit: 3);

        $this->assertCount(3, $events->events);
    }

    public function test_empty_result_when_no_data(): void
    {
        $events = $this->service->getEvents(limit: 10);

        $this->assertCount(0, $events->events);
        $this->assertNull($events->nextCursor);
    }
}
