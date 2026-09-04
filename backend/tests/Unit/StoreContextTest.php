<?php

namespace Tests\Unit;

use App\Enums\UserRole;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;
use App\Services\StoreContext;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class StoreContextTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private StoreContext $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new StoreContext;
    }

    private function createStore(array $overrides = []): Store
    {
        return Store::create(array_merge([
            'name' => $this->faker->unique()->company,
            'slug' => $this->faker->unique()->slug,
            'city' => 'Durban',
            'province' => 'KZN',
            'postal_code' => '4001',
            'address' => $this->faker->address,
            'phone' => '0311234567',
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'delivery_radius_km' => 10,
            'is_active' => true,
        ], $overrides));
    }

    public function test_developer_requires_explicit_store_id(): void
    {
        $user = User::create([
            'name' => 'Dev',
            'email' => 'dev@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Developer,
            'is_active' => true,
        ]);

        try {
            $this->service->resolve($user);
            $this->fail('Expected HttpException was not thrown');
        } catch (HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
        }
    }

    public function test_developer_with_store_id_resolves_store(): void
    {
        $user = User::create([
            'name' => 'Dev',
            'email' => 'dev@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Developer,
            'is_active' => true,
        ]);

        $store = $this->createStore();

        $result = $this->service->resolve($user, $store->id);

        $this->assertEquals($store->id, $result->id);
    }

    public function test_store_owner_resolves_their_store(): void
    {
        $user = User::create([
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::StoreOwner,
            'is_active' => true,
        ]);

        $store = $this->createStore(['owner_id' => $user->id]);

        $result = $this->service->resolve($user);

        $this->assertEquals($store->id, $result->id);
    }

    public function test_store_manager_resolves_through_staff(): void
    {
        $store = $this->createStore();

        $manager = User::create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::StoreManager,
            'is_active' => true,
        ]);

        StoreStaff::create([
            'user_id' => $manager->id,
            'store_id' => $store->id,
            'role' => 'store_manager',
        ]);

        $result = $this->service->resolve($manager);

        $this->assertEquals($store->id, $result->id);
    }

    public function test_logistics_officer_resolves_through_staff(): void
    {
        $store = $this->createStore();

        $officer = User::create([
            'name' => 'Officer',
            'email' => 'officer@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::LogisticsOfficer,
            'is_active' => true,
        ]);

        StoreStaff::create([
            'user_id' => $officer->id,
            'store_id' => $store->id,
            'role' => 'logistics_officer',
        ]);

        $result = $this->service->resolve($officer);

        $this->assertEquals($store->id, $result->id);
    }

    public function test_user_without_store_or_staff_aborts_403(): void
    {
        $user = User::create([
            'name' => 'Orphan',
            'email' => 'orphan@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::StoreManager,
            'is_active' => true,
        ]);

        try {
            $this->service->resolve($user);
            $this->fail('Expected HttpException was not thrown');
        } catch (HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
        }
    }

    public function test_store_owner_without_store_aborts_403(): void
    {
        $user = User::create([
            'name' => 'Ownerless',
            'email' => 'ownerless@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::StoreOwner,
            'is_active' => true,
        ]);

        try {
            $this->service->resolve($user);
            $this->fail('Expected HttpException was not thrown');
        } catch (HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
        }
    }

    public function test_developer_with_nonexistent_store_throws(): void
    {
        $user = User::create([
            'name' => 'Dev',
            'email' => 'dev@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Developer,
            'is_active' => true,
        ]);

        $this->expectException(ModelNotFoundException::class);

        $this->service->resolve($user, 99999);
    }
}
