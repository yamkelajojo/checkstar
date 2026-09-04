<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Services\OrderCartPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCartPolicyTest extends TestCase
{
    use RefreshDatabase;

    private OrderCartPolicy $policy;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new OrderCartPolicy;

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
            'email' => 'cart-policy@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-OCP-001',
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => OrderStatus::Confirmed,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
        ]);
    }

    public function test_cart_is_cleared_when_order_proceeds(): void
    {
        $this->assertTrue($this->policy->shouldClearAfterPlacement($this->order));
    }

    public function test_cart_is_kept_when_dispatch_cancelled_so_customer_can_recheckout(): void
    {
        $this->order->update(['status' => OrderStatus::Cancelled]);

        $this->assertFalse($this->policy->shouldClearAfterPlacement($this->order->fresh()));
    }

    public function test_cart_is_kept_while_dispatch_is_retrying(): void
    {
        $this->order->update(['status' => OrderStatus::Retrying]);

        $this->assertFalse($this->policy->shouldClearAfterPlacement($this->order->fresh()));
    }
}
