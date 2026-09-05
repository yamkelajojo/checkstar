<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Store order console: staff see only their store's orders, pagination is
 * bounded, and status updates from another store's order are impossible.
 */
class StoreOrderApiTest extends TestCase
{
    use RefreshDatabase;

    private Store $storeA;

    private Store $storeB;

    private User $managerA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storeA = Store::create([
            'name' => 'SO Store A', 'slug' => 'so-store-a', 'address' => 'a', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000007',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->storeB = Store::create([
            'name' => 'SO Store B', 'slug' => 'so-store-b', 'address' => 'b', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4002', 'phone' => '0310000008',
            'latitude' => -29.86, 'longitude' => 31.03, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);

        $this->managerA = $this->makeManager('so-manager-a@example.com', $this->storeA);
    }

    private function makeManager(string $email, Store $store): User
    {
        $user = User::create([
            'name' => 'Mgr', 'email' => $email, 'password' => bcrypt('password'),
            'role' => UserRole::StoreManager, 'is_active' => true,
        ]);
        StoreStaff::create(['user_id' => $user->id, 'store_id' => $store->id, 'role' => StaffRole::StoreManager->value]);

        return $user;
    }

    private function makeOrder(Store $store, string $number, string $status = 'pending'): Order
    {
        return Order::create([
            'order_number' => $number,
            'customer_id' => $this->managerA->id,
            'store_id' => $store->id,
            'status' => $status,
            'payment_status' => 'pending',
            'subtotal' => 10, 'delivery_fee' => 0, 'total' => 10,
        ]);
    }

    public function test_orders_are_scoped_to_the_managers_store(): void
    {
        $this->makeOrder($this->storeA, 'SO-A-1');
        $this->makeOrder($this->storeB, 'SO-B-1');

        $data = $this->actingAs($this->managerA)
            ->getJson('/api/store/orders')
            ->assertStatus(200)
            ->json('data.data');

        $this->assertCount(1, $data);
        $this->assertSame('SO-A-1', $data[0]['order_number']);
    }

    public function test_per_page_is_capped(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            $this->makeOrder($this->storeA, 'SO-C-'.$i);
        }

        $response = $this->actingAs($this->managerA)
            ->getJson('/api/store/orders?per_page=100000')
            ->assertStatus(200);

        $this->assertLessThanOrEqual(100, $response->json('data.per_page'));
    }

    public function test_status_update_on_another_stores_order_is_404(): void
    {
        $orderB = $this->makeOrder($this->storeB, 'SO-B-2', 'confirmed');

        $this->actingAs($this->managerA)
            ->patchJson("/api/store/orders/{$orderB->id}/status", ['status' => 'preparing'])
            ->assertStatus(404);

        $this->assertSame('confirmed', $orderB->fresh()->status->value);
    }

    public function test_invalid_transition_is_409(): void
    {
        $order = $this->makeOrder($this->storeA, 'SO-A-2', 'pending');

        // pending → out_for_delivery is not a valid transition.
        $this->actingAs($this->managerA)
            ->patchJson("/api/store/orders/{$order->id}/status", ['status' => 'out_for_delivery'])
            ->assertStatus(409)
            ->assertJsonPath('reason', 'invalid_transition');

        $this->assertSame('pending', $order->fresh()->status->value);
    }

    public function test_valid_transition_succeeds(): void
    {
        $order = $this->makeOrder($this->storeA, 'SO-A-3', 'pending');

        $this->actingAs($this->managerA)
            ->patchJson("/api/store/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');
    }
}
