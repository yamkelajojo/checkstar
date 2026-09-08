<?php

namespace Tests\Unit;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\Rider;
use App\Models\Store;
use App\Models\User;
use App\Services\DispatchPolicy;
use App\Services\DispatchService;
use App\Services\OrderClaim;
use App\Services\OrderStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class DispatchServiceTest extends TestCase
{
    use RefreshDatabase;

    private DispatchService $service;

    private User $customer;

    private Store $store1;

    private Store $store2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new DispatchService(new OrderStateMachine, new DispatchPolicy, new OrderClaim(new OrderStateMachine));

        Config::set('dispatch.max_fallback_stores', 10);

        $this->customer = User::create([
            'name' => 'Jane Customer',
            'email' => 'jane@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $this->store1 = Store::create([
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

        $this->store2 = Store::create([
            'name' => 'Umhlanga',
            'slug' => 'umhlanga',
            'address' => '45 Beach Rd',
            'city' => 'Umhlanga',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4319',
            'latitude' => -29.86,
            'longitude' => 31.02,
            'delivery_radius_km' => 5,
            'phone' => '+27 31 555 0200',
            'is_active' => true,
        ]);
    }

    private function createConfirmedOrder(?float $lat = null, ?float $lng = null, ?Store $store = null): Order
    {
        return Order::create([
            'order_number' => 'ORD-'.strtoupper(uniqid()),
            'customer_id' => $this->customer->id,
            'store_id' => $store->id ?? $this->store1->id,
            'status' => OrderStatus::Confirmed,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
            'delivery_latitude' => $lat,
            'delivery_longitude' => $lng,
        ]);
    }

    private function createRider(Store $store, bool $available = true, float $maxRadius = 10): Rider
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
            'store_id' => $store->id,
            'is_available' => $available,
            'max_radius_km' => $maxRadius,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);
    }

    public function test_cancels_order_when_delivery_coordinates_missing(): void
    {
        $order = $this->createConfirmedOrder(null, null, $this->store1);

        $result = $this->service->dispatch($order);

        $this->assertSame('cancelled', $result['status']);
        $this->assertSame('Delivery coordinates missing', $result['reason']);
        $this->assertEquals(OrderStatus::Cancelled, $order->fresh()->status);
    }

    public function test_dispatches_to_closest_store_with_available_rider(): void
    {
        $rider1 = $this->createRider($this->store1, true, 10);
        $this->createRider($this->store2, true, 10);
        $lat = -29.85;
        $lng = 31.02;
        $order = $this->createConfirmedOrder($lat, $lng, $this->store1);

        $result = $this->service->dispatch($order);

        $this->assertSame('assigned', $result['status']);
        $this->assertSame($this->store1->id, $result['store_id']);
        $this->assertSame($rider1->id, $result['rider_id']);

        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::Preparing, $fresh->status);
        $this->assertSame($rider1->id, $fresh->rider_id);
    }

    public function test_enters_retrying_when_no_riders_available(): void
    {
        $this->createRider($this->store1, false, 10);
        $this->createRider($this->store2, false, 10);
        $lat = -29.85;
        $lng = 31.02;
        $order = $this->createConfirmedOrder($lat, $lng, $this->store1);

        $result = $this->service->dispatch($order);

        $this->assertSame('retrying', $result['status']);
        $this->assertNull($result['store_id']);
        $this->assertNull($result['rider_id']);
        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::Retrying, $fresh->status);
        $this->assertSame(1, $fresh->dispatch_attempts);
    }

    public function test_dispatch_to_retrying_creates_activity_log(): void
    {
        $this->createRider($this->store1, false, 10);
        $order = $this->createConfirmedOrder(-29.85, 31.02, $this->store1);

        $this->service->dispatch($order);

        $log = OrderActivityLog::where('order_id', $order->id)
            ->where('event_type', EventType::DispatchRetrying->value)
            ->first();

        $this->assertNotNull($log);
        $this->assertSame(OrderStatus::Confirmed->value, $log->old_status);
        $this->assertSame(OrderStatus::Retrying->value, $log->new_status);
    }

    public function test_retry_assigns_rider_when_one_becomes_available(): void
    {
        $order = $this->createConfirmedOrder(-29.85, 31.02, $this->store1);
        $order->status = OrderStatus::Retrying;
        $order->save();

        $rider = $this->createRider($this->store1, true, 10);

        $result = $this->service->retry($order);

        $this->assertSame('assigned', $result['status']);
        $this->assertSame($rider->id, $result['rider_id']);
        $fresh = $order->fresh();
        $this->assertEquals(OrderStatus::Preparing, $fresh->status);
        $this->assertSame($rider->id, $fresh->rider_id);
    }

    public function test_retry_increments_attempts_while_still_no_riders(): void
    {
        $this->createRider($this->store1, false, 10);
        $order = $this->createConfirmedOrder(-29.85, 31.02, $this->store1);
        $order->status = OrderStatus::Retrying;
        $order->save();

        $result = $this->service->retry($order);

        $this->assertSame('retrying', $result['status']);
        $this->assertSame(1, $order->fresh()->dispatch_attempts);
    }

    public function test_retry_cancels_order_after_max_attempts(): void
    {
        Config::set('dispatch.max_attempts', 3);
        $this->createRider($this->store1, false, 10);
        $order = $this->createConfirmedOrder(-29.85, 31.02, $this->store1);
        $order->status = OrderStatus::Retrying;
        $order->dispatch_attempts = 3;
        $order->save();

        $result = $this->service->retry($order);

        $this->assertSame('cancelled', $result['status']);
        $this->assertEquals(OrderStatus::Cancelled, $order->fresh()->status);
    }

    public function test_retry_ignores_orders_not_retrying(): void
    {
        $order = $this->createConfirmedOrder(-29.85, 31.02, $this->store1);

        $result = $this->service->retry($order);

        $this->assertSame('skipped', $result['status']);
        $this->assertEquals(OrderStatus::Confirmed, $order->fresh()->status);
    }

    public function test_dispatch_creates_activity_log_on_cancellation(): void
    {
        $order = $this->createConfirmedOrder(null, null, $this->store1);

        $this->service->dispatch($order);

        $log = OrderActivityLog::where('order_id', $order->id)->first();
        $this->assertNotNull($log);
        $this->assertSame(EventType::Cancelled->value, $log->event_type);
        $this->assertSame(OrderStatus::Confirmed->value, $log->old_status);
        $this->assertSame(OrderStatus::Cancelled->value, $log->new_status);
        $metadata = is_string($log->metadata) ? json_decode($log->metadata, true) : $log->metadata;
        $this->assertSame('Delivery coordinates missing', $metadata['reason']);
    }

    public function test_picks_nearest_store_when_both_have_riders(): void
    {
        $rider1 = $this->createRider($this->store1, true, 10);
        $rider2 = $this->createRider($this->store2, true, 10);
        $lat = -29.85;
        $lng = 31.02;
        $order = $this->createConfirmedOrder($lat, $lng, $this->store1);

        $result = $this->service->dispatch($order);

        $this->assertSame('assigned', $result['status']);
        $this->assertSame($this->store1->id, $result['store_id']);
    }
}
