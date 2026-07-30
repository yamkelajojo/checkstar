<?php

namespace Tests\Unit;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\Store;
use App\Models\User;
use App\Services\OrderStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class OrderStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private OrderStateMachine $machine;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->machine = new OrderStateMachine;

        $store = Store::create([
            'name' => 'Test Store',
            'slug' => 'test-store',
            'address' => '123 Main St',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.02,
            'delivery_radius_km' => 10,
            'phone' => '+27 31 555 0100',
            'is_active' => true,
        ]);

        $customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@test.com',
            'password' => bcrypt('password'),
            'role' => \App\Enums\UserRole::Customer,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-OSM-001',
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => OrderStatus::Pending,
            'payment_status' => \App\Enums\PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
        ]);
    }

    public function test_pending_to_confirmed(): void
    {
        $log = $this->machine->transition($this->order, OrderStatus::Confirmed);

        $this->assertEquals(OrderStatus::Confirmed, $this->order->fresh()->status);
        $this->assertSame(EventType::OrderConfirmed->value, $log->event_type);
        $this->assertSame(OrderStatus::Pending->value, $log->old_status);
        $this->assertSame(OrderStatus::Confirmed->value, $log->new_status);
        $this->assertSame($this->order->id, $log->order_id);
    }

    public function test_confirmed_to_preparing(): void
    {
        $this->order->update(['status' => OrderStatus::Confirmed]);

        $log = $this->machine->transition($this->order, OrderStatus::Preparing);

        $this->assertEquals(OrderStatus::Preparing, $this->order->fresh()->status);
        $this->assertSame(EventType::RiderAssigned->value, $log->event_type);
    }

    public function test_preparing_to_out_for_delivery(): void
    {
        $this->order->update(['status' => OrderStatus::Preparing]);

        $log = $this->machine->transition($this->order, OrderStatus::OutForDelivery);

        $this->assertEquals(OrderStatus::OutForDelivery, $this->order->fresh()->status);
        $this->assertSame(EventType::OutForDelivery->value, $log->event_type);
    }

    public function test_out_for_delivery_to_delivered(): void
    {
        $this->order->update(['status' => OrderStatus::OutForDelivery]);

        $log = $this->machine->transition($this->order, OrderStatus::Delivered);

        $this->assertEquals(OrderStatus::Delivered, $this->order->fresh()->status);
        $this->assertSame(EventType::Delivered->value, $log->event_type);
    }

    public function test_pending_to_cancelled(): void
    {
        $log = $this->machine->transition($this->order, OrderStatus::Cancelled);

        $this->assertEquals(OrderStatus::Cancelled, $this->order->fresh()->status);
        $this->assertSame(EventType::Cancelled->value, $log->event_type);
    }

    public function test_confirmed_to_cancelled(): void
    {
        $this->order->update(['status' => OrderStatus::Confirmed]);

        $log = $this->machine->transition($this->order, OrderStatus::Cancelled);

        $this->assertEquals(OrderStatus::Cancelled, $this->order->fresh()->status);
        $this->assertSame(EventType::Cancelled->value, $log->event_type);
    }

    public function test_out_for_delivery_to_cancelled(): void
    {
        $this->order->update(['status' => OrderStatus::OutForDelivery]);

        $log = $this->machine->transition($this->order, OrderStatus::Cancelled);

        $this->assertEquals(OrderStatus::Cancelled, $this->order->fresh()->status);
        $this->assertSame(EventType::Cancelled->value, $log->event_type);
    }

    public function test_delivered_to_preparing_throws(): void
    {
        $this->order->update(['status' => OrderStatus::Delivered]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot transition from delivered to preparing');

        $this->machine->transition($this->order, OrderStatus::Preparing);
    }

    public function test_cancelled_to_confirmed_throws(): void
    {
        $this->order->update(['status' => OrderStatus::Cancelled]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot transition from cancelled to confirmed');

        $this->machine->transition($this->order, OrderStatus::Confirmed);
    }

    public function test_same_status_transition_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Order is already in status: pending');

        $this->machine->transition($this->order, OrderStatus::Pending);
    }

    public function test_activity_log_contains_correct_data_with_actor_and_metadata(): void
    {
        $actor = User::create([
            'name' => 'Actor',
            'email' => 'actor@test.com',
            'password' => bcrypt('password'),
            'role' => \App\Enums\UserRole::StoreManager,
            'is_active' => true,
        ]);

        $log = $this->machine->transition($this->order, OrderStatus::Confirmed, $actor, ['reason' => 'verified']);

        $this->assertSame($actor->id, $log->user_id);
        $this->assertSame(['reason' => 'verified'], $log->metadata);
    }

    public function test_activity_log_persisted_in_database(): void
    {
        $this->machine->transition($this->order, OrderStatus::Confirmed);

        $logs = OrderActivityLog::where('order_id', $this->order->id)->get();

        $this->assertCount(1, $logs);
        $this->assertSame('order_confirmed', $logs[0]->event_type);
    }
}
