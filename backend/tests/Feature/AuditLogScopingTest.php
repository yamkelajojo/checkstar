<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Audit logs are a cross-tenant leak risk: rows only carry entity_type +
 * entity_id, so store-level operators must never be able to read another
 * store's trail by id.
 */
class AuditLogScopingTest extends TestCase
{
    use RefreshDatabase;

    private Store $storeA;

    private Store $storeB;

    private User $managerA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storeA = Store::create([
            'name' => 'Store A', 'slug' => 'store-a', 'address' => 'a', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000001',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->storeB = Store::create([
            'name' => 'Store B', 'slug' => 'store-b', 'address' => 'b', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4002', 'phone' => '0310000002',
            'latitude' => -29.86, 'longitude' => 31.03, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);

        $this->managerA = $this->makeStaffManager('manager-a@example.com', $this->storeA);
    }

    private function makeStaffManager(string $email, Store $store): User
    {
        $user = User::create([
            'name' => 'Mgr', 'email' => $email, 'password' => Hash::make('password'),
            'role' => UserRole::StoreManager, 'is_active' => true,
        ]);
        StoreStaff::create(['user_id' => $user->id, 'store_id' => $store->id, 'role' => 'store_manager']);

        return $user;
    }

    private function makeOrder(Store $store, string $number): Order
    {
        return Order::create([
            'order_number' => $number,
            'customer_id' => $this->managerA->id,
            'store_id' => $store->id,
            'status' => 'confirmed',
            'payment_status' => 'pending',
            'subtotal' => 10, 'delivery_fee' => 0, 'total' => 10,
            'delivery_latitude' => -29.85, 'delivery_longitude' => 31.02,
        ]);
    }

    private function audit(string $event, string $entityType, int $entityId): AuditLog
    {
        return AuditLog::create([
            'user_id' => $this->managerA->id,
            'action' => $event,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'created_at' => now(),
        ]);
    }

    public function test_store_manager_sees_only_their_stores_audit_logs(): void
    {
        $orderA = $this->makeOrder($this->storeA, 'AUD-A-1');
        $orderB = $this->makeOrder($this->storeB, 'AUD-B-1');

        $this->audit('cancelled', 'order', $orderA->id);
        $this->audit('cancelled', 'order', $orderB->id);

        $ids = $this->actingAs($this->managerA)
            ->getJson('/api/operations/audit-logs')
            ->assertStatus(200)
            ->json('audit_logs');

        $this->assertCount(1, $ids);
        $this->assertSame('order', $ids[0]['entity_type']);
        $this->assertSame($orderA->id, $ids[0]['entity_id']);
    }

    public function test_entity_audit_endpoint_hides_cross_store_entities(): void
    {
        $orderA = $this->makeOrder($this->storeA, 'AUD-A-2');
        $orderB = $this->makeOrder($this->storeB, 'AUD-B-2');

        $this->audit('delivered', 'order', $orderA->id);
        $this->audit('delivered', 'order', $orderB->id);

        // Own store: visible.
        $this->actingAs($this->managerA)
            ->getJson("/api/operations/audit-logs/order/{$orderA->id}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'audit_logs');

        // Other store's order id: empty, not leaked.
        $this->actingAs($this->managerA)
            ->getJson("/api/operations/audit-logs/order/{$orderB->id}")
            ->assertStatus(200)
            ->assertJsonCount(0, 'audit_logs');
    }

    public function test_rider_audits_are_scoped_by_store(): void
    {
        $riderAUser = User::create(['name' => 'RA', 'email' => 'ra@example.com', 'password' => Hash::make('password'), 'role' => UserRole::Rider, 'is_active' => true]);
        $riderA = Rider::create(['user_id' => $riderAUser->id, 'store_id' => $this->storeA->id, 'is_available' => true, 'max_radius_km' => 5]);
        $riderBUser = User::create(['name' => 'RB', 'email' => 'rb@example.com', 'password' => Hash::make('password'), 'role' => UserRole::Rider, 'is_active' => true]);
        $riderB = Rider::create(['user_id' => $riderBUser->id, 'store_id' => $this->storeB->id, 'is_available' => true, 'max_radius_km' => 5]);

        $this->audit('available', 'rider', $riderA->id);
        $this->audit('available', 'rider', $riderB->id);

        $logs = $this->actingAs($this->managerA)
            ->getJson('/api/operations/audit-logs')
            ->assertStatus(200)
            ->json('audit_logs');

        $this->assertCount(1, $logs);
        $this->assertSame($riderA->id, $logs[0]['entity_id']);
    }
}
