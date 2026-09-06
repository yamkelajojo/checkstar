<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffManagementTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;

    private User $owner;

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

        $this->owner = User::create([
            'name' => 'Store Owner',
            'email' => 'owner@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::StoreOwner,
            'is_active' => true,
        ]);

        Store::where('id', $this->store->id)->update(['owner_id' => $this->owner->id]);
    }

    public function test_owner_can_hire_store_staff(): void
    {
        $staffUser = User::factory()->create(['role' => UserRole::Customer]);

        $this->actingAs($this->owner)
            ->postJson('/api/store/staff', [
                'user_id' => $staffUser->id,
                'role' => StaffRole::StoreManager->value,
                'store_id' => $this->store->id,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.user_id', $staffUser->id);

        $this->assertDatabaseHas('store_staff', [
            'user_id' => $staffUser->id,
            'store_id' => $this->store->id,
        ]);
    }

    public function test_owner_can_fire_store_staff(): void
    {
        $staffUser = User::factory()->create(['role' => UserRole::Customer]);
        $assignment = StoreStaff::create([
            'user_id' => $staffUser->id,
            'store_id' => $this->store->id,
            'role' => StaffRole::StoreManager,
        ]);

        $this->actingAs($this->owner)
            ->deleteJson("/api/store/staff/{$assignment->id}?store_id={$this->store->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('store_staff', ['id' => $assignment->id]);
    }

    public function test_owner_can_list_store_roster(): void
    {
        $manager = User::factory()->create(['name' => 'Sipho M', 'role' => UserRole::StoreManager]);
        StoreStaff::create([
            'user_id' => $manager->id,
            'store_id' => $this->store->id,
            'role' => StaffRole::StoreManager,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/store/staff?store_id={$this->store->id}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user.id', $manager->id)
            ->assertJsonPath('data.0.user.name', 'Sipho M')
            ->assertJsonPath('data.0.role', StaffRole::StoreManager->value)
            ->assertJsonPath('data.0.store_id', $this->store->id);
    }

    public function test_developer_can_list_store_roster(): void
    {
        $developer = User::factory()->create(['role' => UserRole::Developer]);
        $staffUser = User::factory()->create(['role' => UserRole::Customer]);
        StoreStaff::create([
            'user_id' => $staffUser->id,
            'store_id' => $this->store->id,
            'role' => StaffRole::LogisticsOfficer,
        ]);

        $this->actingAs($developer)
            ->getJson("/api/store/staff?store_id={$this->store->id}")
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_roster_is_scoped_to_one_store(): void
    {
        $otherStore = Store::create([
            'name' => 'Umhlanga',
            'slug' => 'umhlanga',
            'address' => '2 Lagoon Drive',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4320',
            'phone' => '+27 31 000 0001',
            'latitude' => -29.7261,
            'longitude' => 31.0836,
            'delivery_radius_km' => 30,
            'is_active' => true,
        ]);
        $outsider = User::factory()->create(['role' => UserRole::Customer]);
        StoreStaff::create([
            'user_id' => $outsider->id,
            'store_id' => $otherStore->id,
            'role' => StaffRole::StoreManager,
        ]);

        $this->actingAs($this->owner)
            ->getJson("/api/store/staff?store_id={$this->store->id}")
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_store_manager_cannot_list_roster(): void
    {
        $manager = User::factory()->create(['role' => UserRole::StoreManager]);
        StoreStaff::create([
            'user_id' => $manager->id,
            'store_id' => $this->store->id,
            'role' => StaffRole::StoreManager,
        ]);

        $this->actingAs($manager)
            ->getJson("/api/store/staff?store_id={$this->store->id}")
            ->assertStatus(403);
    }

    public function test_store_manager_cannot_hire_staff(): void
    {
        $manager = User::factory()->create(['role' => UserRole::StoreManager]);
        StoreStaff::create([
            'user_id' => $manager->id,
            'store_id' => $this->store->id,
            'role' => StaffRole::StoreManager,
        ]);
        $newStaff = User::factory()->create(['role' => UserRole::Customer]);

        $this->actingAs($manager)
            ->postJson('/api/store/staff', [
                'user_id' => $newStaff->id,
                'role' => StaffRole::LogisticsOfficer->value,
                'store_id' => $this->store->id,
            ])
            ->assertStatus(403);
    }
}
