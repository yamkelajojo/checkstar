<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

class ManualDispatchTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;
    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Durban Central',
            'slug' => 'durban-central',
            'address' => '1 Smith Street',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'phone' => '+27 31 000 0000',
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'delivery_radius_km' => 50,
            'is_active' => true,
        ]);

        $this->manager = $this->makeStaffUser('manager@example.com', UserRole::StoreManager, $this->store->id);
    }

    private function makeStaffUser(string $email, UserRole $role, ?int $storeId = null): User
    {
        $user = User::create([
            'name' => ucfirst($role->value),
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => $role,
            'phone' => '+27 72 000 0000',
            'is_active' => true,
        ]);

        if ($storeId !== null) {
            StoreStaff::create(['user_id' => $user->id, 'store_id' => $storeId, 'role' => StaffRole::StoreManager]);
        }

        return $user;
    }

    private function makeConfirmedOrder(User $customer): Order
    {
        return Order::create([
            'order_number' => 'CS-TEST-' . strtoupper(Str::random(8)),
            'customer_id' => $customer->id,
            'store_id' => null,
            'status' => OrderStatus::Confirmed,
            'payment_status' => PaymentStatus::Pending,
            'delivery_address' => '1 Test Street, Durban',
            'delivery_latitude' => -29.8587,
            'delivery_longitude' => 31.0218,
            'subtotal' => 50,
            'delivery_fee' => 0,
            'total' => 50,
        ]);
    }

    private function makeRider(string $email, ?int $storeId = null, bool $available = true): Rider
    {
        $user = User::create([
            'name' => 'Rider ' . $email,
            'email' => $email,
            'password' => Hash::make('password123'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

        return Rider::create([
            'user_id' => $user->id,
            'store_id' => $storeId ?? $this->store->id,
            'is_available' => $available,
            'vehicle_type' => 'motorbike',
            'max_radius_km' => 50,
        ]);
    }

    public function test_manager_can_list_pending_dispatch_orders_for_their_store(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $this->makeConfirmedOrder($customer);

        $this->actingAs($this->manager)
            ->getJson('/api/store/dispatch/pending')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_manager_can_manually_dispatch_order_to_specific_rider(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->makeConfirmedOrder($customer);
        $rider = $this->makeRider('dispatch-rider@example.com');

        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$order->id}/dispatch", ['rider_id' => $rider->id])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'preparing')
            ->assertJsonPath('data.rider_id', $rider->id);
    }

    public function test_dispatch_rejects_rider_from_another_store(): void
    {
        $otherStore = Store::create([
            'name' => 'Umhlanga',
            'slug' => 'umhlanga',
            'address' => '45 Beach Rd',
            'city' => 'Umhlanga',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4319',
            'phone' => '+27 31 555 0200',
            'latitude' => -29.86,
            'longitude' => 31.02,
            'delivery_radius_km' => 5,
            'is_active' => true,
        ]);

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->makeConfirmedOrder($customer);
        $outsider = $this->makeRider('outsider@example.com', $otherStore->id);

        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$order->id}/dispatch", ['rider_id' => $outsider->id])
            ->assertStatus(409)
            ->assertJson(['reason' => 'rider_not_eligible']);
    }

    public function test_manager_can_reassign_already_claimed_order(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->makeConfirmedOrder($customer);
        $first = $this->makeRider('first@example.com');
        $second = $this->makeRider('second@example.com');

        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$order->id}/dispatch", ['rider_id' => $first->id])
            ->assertStatus(200);

        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$order->id}/reassign", ['rider_id' => $second->id])
            ->assertStatus(200)
            ->assertJsonPath('data.rider_id', $second->id);

        $this->assertDatabaseHas('order_activity_logs', [
            'order_id' => $order->id,
            'event_type' => 'rider_assigned',
        ]);
    }

    public function test_developer_requires_explicit_store_id(): void
    {
        $developer = User::create([
            'name' => 'Dev',
            'email' => 'dev@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Developer,
            'is_active' => true,
        ]);

        $this->actingAs($developer)
            ->getJson('/api/store/dispatch/pending')
            ->assertStatus(500);
    }
}
