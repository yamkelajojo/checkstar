<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Store;
use App\Models\BannerCreative;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Banners are store-scoped content. A store operator must never be able to
 * publish into (or read/mutate) another store's rotation.
 */
class BannerTenantGuardTest extends TestCase
{
    use RefreshDatabase;

    private Store $storeA;

    private Store $storeB;

    private User $ownerA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storeA = Store::create([
            'name' => 'Banner A', 'slug' => 'banner-a', 'address' => 'a', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000005',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->storeB = Store::create([
            'name' => 'Banner B', 'slug' => 'banner-b', 'address' => 'b', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4002', 'phone' => '0310000006',
            'latitude' => -29.86, 'longitude' => 31.03, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);

        $this->ownerA = $this->makeOwner('owner-a@example.com', $this->storeA);
    }

    private function makeOwner(string $email, Store $store): User
    {
        $user = User::create([
            'name' => 'Owner', 'email' => $email, 'password' => bcrypt('password'),
            'role' => UserRole::StoreOwner, 'is_active' => true,
        ]);
        StoreStaff::create(['user_id' => $user->id, 'store_id' => $store->id, 'role' => StaffRole::StoreManager->value]);

        return $user;
    }

    private function slidePayload(): array
    {
        return [[
            'title' => 'Hello',
            'bgType' => 'solid',
            'colors' => ['#ff0000'],
        ]];
    }

    public function test_owner_can_create_banner_scoped_to_their_store(): void
    {
        $this->actingAs($this->ownerA)
            ->postJson('/api/admin/banners', [
                'name' => 'Promo',
                'slides' => $this->slidePayload(),
                'status' => 'published',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.store_id', $this->storeA->id);
    }

    public function test_owner_cannot_reassign_banner_to_another_store_on_update(): void
    {
        $banner = BannerCreative::create([
            'name' => 'Promo',
            'store_id' => $this->storeA->id,
            'created_by' => $this->ownerA->id,
            'status' => 'published',
            'slides' => $this->slidePayload(),
        ]);

        $this->actingAs($this->ownerA)
            ->putJson("/api/admin/banners/{$banner->id}", [
                'store_id' => $this->storeB->id,
                'name' => 'Renamed',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.store_id', $this->storeA->id)
            ->assertJsonPath('data.name', 'Renamed');

        $this->assertSame($this->storeA->id, $banner->fresh()->store_id);
    }

    public function test_owner_cannot_touch_another_stores_banner(): void
    {
        $ownerB = $this->makeOwner('owner-b@example.com', $this->storeB);
        $bannerB = BannerCreative::create([
            'name' => 'B Promo',
            'store_id' => $this->storeB->id,
            'created_by' => $ownerB->id,
            'status' => 'published',
            'slides' => $this->slidePayload(),
        ]);

        $this->actingAs($this->ownerA)
            ->putJson("/api/admin/banners/{$bannerB->id}", ['name' => 'Hijacked'])
            ->assertStatus(403);

        $this->actingAs($this->ownerA)
            ->deleteJson("/api/admin/banners/{$bannerB->id}")
            ->assertStatus(403);

        $this->assertSame('B Promo', $bannerB->fresh()->name);
    }
}
