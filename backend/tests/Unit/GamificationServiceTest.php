<?php

namespace Tests\Unit;

use App\Enums\BadgeType;
use App\Enums\GameEvent;
use App\Enums\UserRole;
use App\Models\Rider;
use App\Models\RiderBadge;
use App\Models\User;
use App\Services\GamificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GamificationServiceTest extends TestCase
{
    use RefreshDatabase;

    private GamificationService $service;
    private Rider $rider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new GamificationService;

        $user = User::create([
            'name' => 'Rider One',
            'email' => 'rider@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Rider,
            'is_active' => true,
        ]);

        $this->rider = Rider::create([
            'user_id' => $user->id,
            'is_available' => true,
            'max_radius_km' => 10,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);
    }

    public function test_first_delivery_increases_xp_but_no_level_up(): void
    {
        $result = $this->service->handleEvent($this->rider, GameEvent::DeliveryCompleted);

        $this->assertSame(10, $result['xp_gained']);
        $this->assertSame(10, $this->rider->fresh()->xp);
        $this->assertNull($result['new_level']);
        $this->assertEmpty($result['new_badges']);
        $this->assertSame(1, $this->rider->fresh()->level);
    }

    public function test_xp_crosses_level_up_threshold(): void
    {
        $this->rider->update(['xp' => 15, 'level' => 1]);

        $result = $this->service->handleEvent($this->rider, GameEvent::DeliveryCompleted);

        $fresh = $this->rider->fresh();
        $this->assertSame(25, $fresh->xp);
        $this->assertSame(2, $fresh->level);
        $this->assertSame(2, $result['new_level']);
    }

    public function test_multiple_level_ups_across_events(): void
    {
        $this->service->handleEvent($this->rider, GameEvent::DeliveryCompleted);
        $this->service->handleEvent($this->rider, GameEvent::DeliveryCompleted);
        $fresh = $this->rider->fresh();
        $this->assertSame(20, $fresh->xp);
        $this->assertSame(2, $fresh->level);

        $this->service->handleEvent($this->rider, GameEvent::DeliveryCompleted);
        $this->service->handleEvent($this->rider, GameEvent::DeliveryCompleted);
        $fresh = $this->rider->fresh();
        $this->assertSame(40, $fresh->xp);
        $this->assertSame(3, $fresh->level);
    }

    public function test_badge_awarded_on_first_delivery_milestone(): void
    {
        $result = $this->service->handleEvent($this->rider, GameEvent::FirstDelivery);

        $this->assertCount(1, $result['new_badges']);
        $this->assertSame(BadgeType::FirstDelivery->value, $result['new_badges'][0]->badge_type);

        $badge = RiderBadge::where('rider_id', $this->rider->id)
            ->where('badge_type', BadgeType::FirstDelivery->value)
            ->first();
        $this->assertNotNull($badge);
    }

    public function test_same_badge_not_awarded_twice(): void
    {
        $first = $this->service->handleEvent($this->rider, GameEvent::FirstDelivery);
        $this->assertCount(1, $first['new_badges']);

        $second = $this->service->handleEvent($this->rider, GameEvent::FirstDelivery);
        $this->assertEmpty($second['new_badges']);
        $this->assertCount(
            1,
            RiderBadge::where('rider_id', $this->rider->id)
                ->where('badge_type', BadgeType::FirstDelivery->value)
                ->get()
        );
    }

    public function test_century_badge_awarded_on_100_deliveries(): void
    {
        $this->rider->update(['total_deliveries' => 100, 'xp' => 0, 'level' => 1]);

        $result = $this->service->handleEvent($this->rider, GameEvent::DeliveryCompleted);

        $badgeTypes = array_map(fn ($b) => $b->badge_type, $result['new_badges']);
        $this->assertContains(BadgeType::Century->value, $badgeTypes);
    }
}
