<?php

namespace App\Services;

use App\Models\Review;
use App\Models\Rider;

class RiderStatsRecorder
{
    public function recordReview(Rider $rider, int $rating): void
    {
        // Use fresh rider with lock to avoid lost updates
        $fresh = Rider::where('id', $rider->id)->lockForUpdate()->first();
        if (! $fresh) {
            return;
        }

        // Incremental weighted average without full table scan
        // total_deliveries reflects completed deliveries, not review count — so use review count for averaging
        $reviewCount = Review::where('rider_id', $fresh->id)->count();
        // reviewCount includes the review just created, so it is already +1
        // For averaging we use prior count
        $priorCount = max(0, $reviewCount - 1);
        $currentAvg = (float) ($fresh->average_rating ?? 0);

        if ($priorCount === 0) {
            $fresh->average_rating = round((float) $rating, 2);
        } else {
            $fresh->average_rating = round(
                (($currentAvg * $priorCount) + $rating) / ($priorCount + 1),
                2
            );
        }

        $fresh->save();
        $fresh->refresh();
    }
}
