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

        // Increment delivery count on completed delivery (not on review)
        if ($event === GameEvent::DeliveryCompleted) {
            $rider->total_deliveries = ($rider->total_deliveries ?? 0) + 1;
        }

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

        if ($event === GameEvent::DeliveryCompleted && $rider->total_deliveries >= 100) {
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
        try {
            $badge = RiderBadge::firstOrCreate(
                ['rider_id' => $rider->id, 'badge_type' => $badgeType->value],
                ['awarded_at' => now()]
            );
            return $badge->wasRecentlyCreated ? $badge : null;
        } catch (\Illuminate\Database\QueryException $e) {
            // Concurrent insert race — badge already awarded
            return null;
        }
    }
}
