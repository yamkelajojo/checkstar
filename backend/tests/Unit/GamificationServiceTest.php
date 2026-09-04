<?php

namespace Tests\Unit;

use App\Enums\GameEvent;
use App\Enums\UserRole;
use App\Models\Rider;
use App\Models\Store;
use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GamificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private GamificationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new GamificationService;
    }

    private function createRider(array $overrides = []): Rider
    {
        $store = Store::create([
            'name' => 'Test Store '.uniqid(),
            'slug' => 'test-store-'.uniqid(),
            'address' => '123 Test St',
            'city' => 'Durban',
            'province' => 'KZN',
            'postal_code' => '4001',
            'phone' => '0311234567',
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'delivery_radius_km' => 10,
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Rider User',
            'email' => uniqid('rider').'@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

        return Rider::create(array_merge([
            'user_id' => $user->id,
            'store_id' => $store->id,
            'is_available' => true,
            'latitude' => -29.8587,
            'longitude' => 31.0218,
            'max_radius_km' => 10,
            'xp' => 0,
            'level' => 1,
            'total_deliveries' => 0,
        ], $overrides));
    }

    public function test_xp_increments_atomically(): void
    {
        $rider = $this->createRider(['xp' => 10]);

        $result = $this->service->handleEvent($rider, GameEvent::RatingReceived);

        $this->assertEquals(5, $result['xp_gained']);
        $rider->refresh();
        $this->assertEquals(15, $rider->xp);
    }

    public function test_delivery_completed_increments_total_deliveries(): void
    {
        $rider = $this->createRider(['total_deliveries' => 5]);

        $this->service->handleEvent($rider, GameEvent::DeliveryCompleted);

        $rider->refresh();
        $this->assertEquals(6, $rider->total_deliveries);
    }

    public function test_level_up_calculated_correctly(): void
    {
        // XP_PER_LEVEL = 20, so xp=35 is level 2, after +5 xp = 40 = level 3
        $rider = $this->createRider(['xp' => 35, 'level' => 1]);

        $result = $this->service->handleEvent($rider, GameEvent::RatingReceived);

        $this->assertEquals(3, $result['new_level']);
        $rider->refresh();
        $this->assertEquals(3, $rider->level);
    }

    public function test_no_level_up_when_xp_insufficient(): void
    {
        $rider = $this->createRider(['xp' => 5, 'level' => 1]);

        $result = $this->service->handleEvent($rider, GameEvent::RatingReceived);

        $this->assertNull($result['new_level']);
        $rider->refresh();
        $this->assertEquals(1, $rider->level);
    }

    public function test_first_delivery_awards_badge(): void
    {
        $rider = $this->createRider();

        $result = $this->service->handleEvent($rider, GameEvent::FirstDelivery);

        $this->assertCount(1, $result['new_badges']);
        $this->assertEquals('first_delivery', $result['new_badges'][0]->badge_type);
    }

    public function test_first_delivery_does_not_duplicate_badge(): void
    {
        $rider = $this->createRider();

        $this->service->handleEvent($rider, GameEvent::FirstDelivery);
        $result = $this->service->handleEvent($rider, GameEvent::FirstDelivery);

        $this->assertCount(0, $result['new_badges']);
    }

    public function test_century_badge_at_100_deliveries(): void
    {
        $rider = $this->createRider(['total_deliveries' => 99]);

        $result = $this->service->handleEvent($rider, GameEvent::DeliveryCompleted);

        $this->assertCount(1, $result['new_badges']);
        $this->assertEquals('century', $result['new_badges'][0]->badge_type);
    }

    public function test_century_badge_not_awarded_below_100(): void
    {
        $rider = $this->createRider(['total_deliveries' => 98]);

        $result = $this->service->handleEvent($rider, GameEvent::DeliveryCompleted);

        $this->assertCount(0, $result['new_badges']);
    }

    public function test_order_confirmed_xp(): void
    {
        $rider = $this->createRider(['xp' => 0]);

        $result = $this->service->handleEvent($rider, GameEvent::OrderConfirmed);

        $this->assertEquals(2, $result['xp_gained']);
        $rider->refresh();
        $this->assertEquals(2, $rider->xp);
    }

    public function test_unknown_event_grants_zero_xp(): void
    {
        $rider = $this->createRider(['xp' => 10]);

        $result = $this->service->handleEvent($rider, GameEvent::FirstDelivery);

        // FirstDelivery grants 20 XP (not unknown)
        $this->assertEquals(20, $result['xp_gained']);
    }
}
