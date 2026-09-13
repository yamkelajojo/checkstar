<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Store;
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
            'order_number' => 'CS-TEST-'.strtoupper(Str::random(8)),
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
            'name' => 'Rider '.$email,
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

    public function test_operations_assign_rejects_order_from_another_store(): void
    {
        // Store B's confirmed order; our manager belongs to Store A
        $storeB = Store::create([
            'name' => 'Overport',
            'slug' => 'overport',
            'address' => '99 Cannon Avenue',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4092',
            'phone' => '+27 31 000 0002',
            'latitude' => -29.9,
            'longitude' => 31.0,
            'delivery_radius_km' => 50,
            'is_active' => true,
        ]);

        $customer = User::create([
            'name' => 'Customer',
            'email' => 'cust@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $orderB = $this->makeConfirmedOrder($customer);
        $orderB->store_id = $storeB->id;
        $orderB->save();

        $riderA = $this->makeRider('rider-a@example.com');

        // A Store A operator must not be able to grab Store B's pending order
        $response = $this->actingAs($this->manager)
            ->postJson('/api/operations/assign-rider', [
                'order_id' => $orderB->id,
                'rider_id' => $riderA->id,
                'store_id' => $this->store->id,
            ]);

        $response->assertStatus(422);
        $this->assertNull($orderB->fresh()->rider_id);
        $this->assertNotSame($this->store->id, $orderB->fresh()->store_id);
    }

    public function test_operations_suggestion_hides_other_stores_orders(): void
    {
        $storeB = Store::create([
            'name' => 'Phoenix',
            'slug' => 'phoenix',
            'address' => '1 Phoenix Hwy',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4068',
            'phone' => '+27 31 000 0003',
            'latitude' => -29.7,
            'longitude' => 31.0,
            'delivery_radius_km' => 50,
            'is_active' => true,
        ]);

        $customer = User::create([
            'name' => 'Customer 2',
            'email' => 'cust2@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $orderB = $this->makeConfirmedOrder($customer);
        $orderB->store_id = $storeB->id;
        $orderB->save();

        $response = $this->actingAs($this->manager)
            ->getJson("/api/operations/dispatch-suggestion/{$orderB->id}");

        $response->assertStatus(404);
    }

    public function test_dispatch_allows_rider_from_another_store(): void
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
            ->assertStatus(200)
            ->assertJsonPath('data.rider_id', $outsider->id);
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

    public function test_dispatch_rejects_rider_with_deactivated_account(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $order = $this->makeConfirmedOrder($customer);
        $rider = $this->makeRider('deactivated@example.com');

        // Auto-dispatch skips deactivated rider users (their endpoints 403,
        // so orders would strand) — manual dispatch must enforce the same.
        User::where('email', 'deactivated@example.com')->update(['is_active' => false]);

        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$order->id}/dispatch", ['rider_id' => $rider->id])
            ->assertStatus(409)
            ->assertJsonPath('reason', 'rider_not_eligible');

        $this->assertNull($order->fresh()->rider_id);
    }

    public function test_reassign_rejects_rider_already_at_concurrent_cap(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $orderA = $this->makeConfirmedOrder($customer);
        $orderB = $this->makeConfirmedOrder($customer);
        $busy = $this->makeRider('busy@example.com');
        $other = $this->makeRider('other@example.com');

        // busy rider now holds 1 active order — the default cap.
        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$orderA->id}/dispatch", ['rider_id' => $busy->id])
            ->assertStatus(200);
        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$orderB->id}/dispatch", ['rider_id' => $other->id])
            ->assertStatus(200);

        // Reassigning order B to the capped rider would push them past the
        // cap that auto-dispatch and claims respect.
        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$orderB->id}/reassign", ['rider_id' => $busy->id])
            ->assertStatus(409)
            ->assertJsonPath('reason', 'rider_at_capacity');

        $this->assertSame($other->id, $orderB->fresh()->rider_id);
    }

    public function test_pending_list_applies_exact_radius_within_the_search_box(): void
    {
        $customer = User::factory()->create(['role' => UserRole::Customer]);

        $near = $this->makeConfirmedOrder($customer); // at store coordinates

        $this->store->update(['delivery_radius_km' => 5]);
        // 5 km radius: box is ~ +/-0.045 lat / +/-0.0519 lng; a diagonal-corner
        // order ~5.7 km away sits inside the box but outside the radius.
        $diagonal = $this->makeConfirmedOrder($customer);
        $diagonal->update(['delivery_latitude' => -29.8587 + 0.036, 'delivery_longitude' => 31.0218 + 0.0417]);

        $pending = $this->actingAs($this->manager)
            ->getJson('/api/store/dispatch/pending')
            ->assertStatus(200)
            ->json('data');

        $ids = collect($pending)->pluck('id');
        $this->assertTrue($ids->contains($near->id));
        $this->assertFalse($ids->contains($diagonal->id));
    }

    public function test_reassign_rejects_order_from_different_store(): void
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
        $first = $this->makeRider('first@example.com');
        $second = $this->makeRider('second@example.com');

        // Dispatch to first rider (in manager's store)
        $this->actingAs($this->manager)
            ->postJson("/api/store/orders/{$order->id}/dispatch", ['rider_id' => $first->id])
            ->assertStatus(200);

        // Reassign from different store should 404 (order not found in that store)
        $managerAtOtherStore = $this->makeStaffUser('other@example.com', UserRole::StoreManager, $otherStore->id);
        $this->actingAs($managerAtOtherStore)
            ->postJson("/api/store/orders/{$order->id}/reassign", ['rider_id' => $second->id])
            ->assertStatus(404);
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
            ->assertStatus(403);
    }
}
