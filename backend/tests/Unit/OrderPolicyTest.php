<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use App\Policies\OrderPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPolicyTest extends TestCase
{
    use RefreshDatabase;

    private OrderPolicy $policy;

    private User $owner;

    private User $intruder;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new OrderPolicy;

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

        $this->owner = User::create([
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $this->intruder = User::create([
            'name' => 'Intruder',
            'email' => 'intruder@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-OP-001',
            'customer_id' => $this->owner->id,
            'store_id' => $store->id,
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
        ]);
    }

    public function test_customer_can_view_own_order(): void
    {
        $this->assertTrue($this->policy->view($this->owner, $this->order));
    }

    public function test_customer_cannot_view_others_order(): void
    {
        $this->assertFalse($this->policy->view($this->intruder, $this->order));
    }

    public function test_customer_can_confirm_delivery_of_own_order(): void
    {
        $this->assertTrue($this->policy->confirmDelivery($this->owner, $this->order));
    }

    public function test_customer_cannot_confirm_delivery_of_others_order(): void
    {
        $this->assertFalse($this->policy->confirmDelivery($this->intruder, $this->order));
    }

    public function test_customer_can_review_own_order(): void
    {
        $this->assertTrue($this->policy->review($this->owner, $this->order));
    }

    public function test_customer_cannot_review_others_order(): void
    {
        $this->assertFalse($this->policy->review($this->intruder, $this->order));
    }

    public function test_customer_can_cancel_own_order(): void
    {
        $this->assertTrue($this->policy->cancel($this->owner, $this->order));
    }

    public function test_customer_cannot_cancel_others_order(): void
    {
        $this->assertFalse($this->policy->cancel($this->intruder, $this->order));
    }
}
