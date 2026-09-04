<?php

namespace Tests\Unit;

use App\Enums\UserRole;
use App\Models\Rider;
use App\Models\Store;
use App\Models\User;
use App\Services\DispatchPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class DispatchPolicyTest extends TestCase
{
    use RefreshDatabase;

    private DispatchPolicy $policy;

    private Store $storeCentral;

    private Store $storeUmhlanga;

    protected function setUp(): void
    {
        parent::setUp();

        $this->policy = new DispatchPolicy;

        $this->storeCentral = Store::create([
            'name' => 'Durban Central',
            'slug' => 'durban-central',
            'address' => '123 West St',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.025,
            'delivery_radius_km' => 5,
            'phone' => '+27 31 555 0100',
            'is_active' => true,
        ]);

        $this->storeUmhlanga = Store::create([
            'name' => 'Umhlanga',
            'slug' => 'umhlanga',
            'address' => '45 Beach Rd',
            'city' => 'Umhlanga',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4319',
            'latitude' => -29.86,
            'longitude' => 31.02,
            'delivery_radius_km' => 5,
            'phone' => '+27 31 555 0200',
            'is_active' => true,
        ]);
    }

    private function createRider(
        Store $store,
        bool $available = true,
        float $maxRadius = 10,
        ?\DateTimeInterface $suspendedAt = null,
    ): Rider {
        $user = User::create([
            'name' => 'Rider '.uniqid(),
            'email' => 'rider_'.uniqid().'@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

        return Rider::create([
            'user_id' => $user->id,
            'store_id' => $store->id,
            'is_available' => $available,
            'max_radius_km' => $maxRadius,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
            'suspended_at' => $suspendedAt,
        ]);
    }

    // ── eligibleStores ──────────────────────────────────────────────

    public function test_eligible_stores_returns_stores_within_delivery_radius(): void
    {
        $customerLat = -29.85;
        $customerLng = 31.025;

        $results = $this->policy->eligibleStores($customerLat, $customerLng);

        $this->assertCount(2, $results);
        $storeIds = $results->pluck('store.id')->values()->all();
        $this->assertContains($this->storeCentral->id, $storeIds);
        $this->assertContains($this->storeUmhlanga->id, $storeIds);
    }

    public function test_eligible_stores_excludes_inactive_stores(): void
    {
        $inactive = Store::create([
            'name' => 'Inactive Store',
            'slug' => 'inactive',
            'address' => '1 Close St',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.025,
            'delivery_radius_km' => 5,
            'phone' => '+27 31 555 0999',
            'is_active' => false,
        ]);

        $results = $this->policy->eligibleStores(-29.85, 31.025);

        $this->assertCount(2, $results);
        $storeIds = $results->pluck('store.id')->values()->all();
        $this->assertNotContains($inactive->id, $storeIds);
    }

    public function test_eligible_stores_sorts_by_distance_nearest_first(): void
    {
        $customerLat = -29.85;
        $customerLng = 31.025;

        $results = $this->policy->eligibleStores($customerLat, $customerLng);

        $distances = $results->pluck('distance_km')->values()->all();
        $this->assertEqualsCanonicalizing($distances, $distances);
        $this->assertLessThanOrEqual($distances[1], $distances[0]);
    }

    public function test_eligible_stores_returns_empty_when_no_stores_within_radius(): void
    {
        $results = $this->policy->eligibleStores(-33.9, 18.4);

        $this->assertCount(0, $results);
    }

    public function test_eligible_stores_excludes_store_outside_its_own_radius(): void
    {
        $smallStore = Store::create([
            'name' => 'Tiny Store',
            'slug' => 'tiny',
            'address' => '1 Micro Ave',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.025,
            'delivery_radius_km' => 1,
            'phone' => '+27 31 555 0998',
            'is_active' => true,
        ]);

        $customerLat = -29.92;
        $customerLng = 31.10;

        $results = $this->policy->eligibleStores($customerLat, $customerLng);

        $storeIds = $results->pluck('store.id')->values()->all();
        $this->assertNotContains($smallStore->id, $storeIds);
    }

    public function test_eligible_stores_includes_distance_km_in_results(): void
    {
        $results = $this->policy->eligibleStores(-29.85, 31.025);

        foreach ($results as $entry) {
            $this->assertArrayHasKey('store', $entry);
            $this->assertArrayHasKey('distance_km', $entry);
            $this->assertInstanceOf(Store::class, $entry['store']);
            $this->assertIsFloat($entry['distance_km']);
            $this->assertGreaterThanOrEqual(0, $entry['distance_km']);
        }
    }

    public function test_eligible_stores_returns_central_as_nearest_when_customer_at_central(): void
    {
        $results = $this->policy->eligibleStores(-29.85, 31.025);

        $nearestStoreId = $results->first()['store']->id;
        $this->assertSame($this->storeCentral->id, $nearestStoreId);
        $this->assertEquals(0.0, $results->first()['distance_km'], 0.1);
    }

    // ── eligibleRider ───────────────────────────────────────────────

    public function test_eligible_rider_returns_available_rider_at_matching_store(): void
    {
        $rider = $this->createRider($this->storeCentral, true, 10);

        $result = $this->policy->eligibleRider($this->storeCentral, 2.0);

        $this->assertNotNull($result);
        $this->assertSame($rider->id, $result->id);
    }

    public function test_eligible_rider_rejects_unavailable_rider(): void
    {
        $this->createRider($this->storeCentral, false, 10);

        $result = $this->policy->eligibleRider($this->storeCentral, 2.0);

        $this->assertNull($result);
    }

    public function test_eligible_rider_rejects_suspended_rider(): void
    {
        $this->createRider($this->storeCentral, true, 10, now());

        $result = $this->policy->eligibleRider($this->storeCentral, 2.0);

        $this->assertNull($result);
    }

    public function test_eligible_rider_rejects_rider_with_insufficient_radius(): void
    {
        $this->createRider($this->storeCentral, true, 1);

        $result = $this->policy->eligibleRider($this->storeCentral, 2.0);

        $this->assertNull($result);
    }

    public function test_eligible_rider_returns_null_when_no_riders_match_store(): void
    {
        $this->createRider($this->storeUmhlanga, true, 10);

        $result = $this->policy->eligibleRider($this->storeCentral, 2.0);

        $this->assertNull($result);
    }

    public function test_eligible_rider_picks_first_available_rider(): void
    {
        $rider1 = $this->createRider($this->storeCentral, true, 10);
        $rider2 = $this->createRider($this->storeCentral, true, 10);

        $result = $this->policy->eligibleRider($this->storeCentral, 2.0);

        $this->assertNotNull($result);
        $this->assertTrue(in_array($result->id, [$rider1->id, $rider2->id]));
    }

    public function test_eligible_rider_accepts_rider_with_exact_max_radius(): void
    {
        $rider = $this->createRider($this->storeCentral, true, 5.0);

        $result = $this->policy->eligibleRider($this->storeCentral, 5.0);

        $this->assertNotNull($result);
        $this->assertSame($rider->id, $result->id);
    }

    public function test_eligible_rider_skips_available_but_suspended_before_unavailable(): void
    {
        $this->createRider($this->storeCentral, true, 10, now());
        $availableRider = $this->createRider($this->storeCentral, true, 10);

        $result = $this->policy->eligibleRider($this->storeCentral, 2.0);

        $this->assertNotNull($result);
        $this->assertSame($availableRider->id, $result->id);
    }

    // ── maxFallbackStores ──────────────────────────────────────────

    public function test_max_fallback_stores_returns_config_value(): void
    {
        Config::set('dispatch.max_fallback_stores', 7);

        $this->assertSame(7, $this->policy->maxFallbackStores());
    }

    // ── maxAttempts ─────────────────────────────────────────────────

    public function test_max_attempts_returns_config_value(): void
    {
        Config::set('dispatch.max_attempts', 8);

        $this->assertSame(8, $this->policy->maxAttempts());
    }

    // ── retryIntervalSeconds ────────────────────────────────────────

    public function test_retry_interval_seconds_returns_config_value(): void
    {
        Config::set('dispatch.retry_interval_seconds', 120);

        $this->assertSame(120, $this->policy->retryIntervalSeconds());
    }
}
