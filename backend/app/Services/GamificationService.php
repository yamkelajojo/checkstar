<?php

namespace App\Services;

use App\Enums\BadgeType;
use App\Enums\GameEvent;
use App\Models\Rider;
use App\Models\RiderBadge;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class GamificationService
{
    private const XP_PER_LEVEL = 20;

    private static array $eventXp = [
        'delivery_completed' => 10,
        'order_confirmed' => 2,
        'rating_received' => 5,
        'first_delivery' => 20,
    ];

    public function handleEvent(Rider $rider, GameEvent $event, array $context = []): array
    {
        $xpGained = self::$eventXp[$event->value] ?? 0;

        // Atomic increments to prevent race conditions between concurrent reviews
        if ($xpGained > 0) {
            DB::table('riders')->where('id', $rider->id)->increment('xp', $xpGained);
        }

        if ($event === GameEvent::DeliveryCompleted) {
            DB::table('riders')->where('id', $rider->id)->increment('total_deliveries');
        }

        // Re-read fresh values after atomic increments
        $fresh = $rider->fresh();

        $newLevel = null;
        $expectedLevel = (int) floor($fresh->xp / self::XP_PER_LEVEL) + 1;
        if ($expectedLevel > $fresh->level) {
            $newLevel = $expectedLevel;
            DB::table('riders')->where('id', $fresh->id)->update(['level' => $expectedLevel]);
        }

        $newBadges = [];
        if ($event === GameEvent::FirstDelivery) {
            $badge = $this->awardBadge($fresh, BadgeType::FirstDelivery);
            if ($badge) {
                $newBadges[] = $badge;
            }
        }

        if ($event === GameEvent::DeliveryCompleted && $fresh->total_deliveries >= 100) {
            $badge = $this->awardBadge($fresh, BadgeType::Century);
            if ($badge) {
                $newBadges[] = $badge;
            }
        }

        return [
            'xp_gained' => $xpGained,
            'new_level' => $newLevel,
            'new_badges' => $newBadges,
        ];
    }

    private function awardBadge(Rider $rider, BadgeType $badgeType): ?RiderBadge
    {
        try {
            $badge = RiderBadge::firstOrCreate(
                ['rider_id' => $rider->id, 'badge_type' => $badgeType->value],
                ['awarded_at' => now()]
            );

            return $badge->wasRecentlyCreated ? $badge : null;
        } catch (QueryException $e) {
            // Concurrent insert race — badge already awarded
            return null;
        }
    }
}
