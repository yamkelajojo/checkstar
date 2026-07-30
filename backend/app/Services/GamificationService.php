<?php

namespace App\Services;

use App\Enums\BadgeType;
use App\Enums\GameEvent;
use App\Models\Rider;
use App\Models\RiderBadge;

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

        $rider->xp += $xpGained;

        $newLevel = null;
        $expectedLevel = (int) floor($rider->xp / self::XP_PER_LEVEL) + 1;
        if ($expectedLevel > $rider->level) {
            $newLevel = $expectedLevel;
            $rider->level = $expectedLevel;
        }

        $newBadges = [];
        if ($event === GameEvent::FirstDelivery) {
            $badge = $this->awardBadge($rider, BadgeType::FirstDelivery);
            if ($badge) {
                $newBadges[] = $badge;
            }
        }

        if ($rider->total_deliveries >= 100) {
            $badge = $this->awardBadge($rider, BadgeType::Century);
            if ($badge) {
                $newBadges[] = $badge;
            }
        }

        $rider->save();

        return [
            'xp_gained' => $xpGained,
            'new_level' => $newLevel,
            'new_badges' => $newBadges,
        ];
    }

    private function awardBadge(Rider $rider, BadgeType $badgeType): ?RiderBadge
    {
        $exists = RiderBadge::where('rider_id', $rider->id)
            ->where('badge_type', $badgeType->value)
            ->exists();

        if ($exists) {
            return null;
        }

        return RiderBadge::create([
            'rider_id' => $rider->id,
            'badge_type' => $badgeType->value,
            'awarded_at' => now(),
        ]);
    }
}
