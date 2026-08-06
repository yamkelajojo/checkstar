<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Services\OrderCancellationPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCancellationPolicyTest extends TestCase
{
    use RefreshDatabase;

    private OrderCancellationPolicy $policy;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new OrderCancellationPolicy;

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
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-OCP-001',
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
        ]);
    }

    public function test_customer_can_cancel_pending_order(): void
    {
        $this->assertTrue($this->policy->customerCanCancel($this->order));
    }

    public function test_customer_can_cancel_confirmed_order(): void
    {
        $this->order->update(['status' => OrderStatus::Confirmed]);

        $this->assertTrue($this->policy->customerCanCancel($this->order->fresh()));
    }

    public function test_customer_can_cancel_preparing_order(): void
    {
        $this->order->update(['status' => OrderStatus::Preparing]);

        $this->assertTrue($this->policy->customerCanCancel($this->order->fresh()));
    }

    public function test_customer_cannot_cancel_out_for_delivery_order(): void
    {
        $this->order->update(['status' => OrderStatus::OutForDelivery]);

        $this->assertFalse($this->policy->customerCanCancel($this->order->fresh()));
    }

    public function test_customer_cannot_cancel_delivered_order(): void
    {
        $this->order->update(['status' => OrderStatus::Delivered]);

        $this->assertFalse($this->policy->customerCanCancel($this->order->fresh()));
    }

    public function test_customer_cannot_cancel_cancelled_order(): void
    {
        $this->order->update(['status' => OrderStatus::Cancelled]);

        $this->assertFalse($this->policy->customerCanCancel($this->order->fresh()));
    }
}
