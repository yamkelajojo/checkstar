<?php

namespace App\Services;

use App\Models\Rider;

class RiderStatsRecorder
{
    public function recordReview(Rider $rider, int $rating): void
    {
        $currentTotal = $rider->total_deliveries ?? 0;
        $currentAvg = (float) ($rider->average_rating ?? 0);

        $rider->average_rating = round(
            (($currentAvg * $currentTotal) + $rating) / ($currentTotal + 1),
            2
        );
        $rider->total_deliveries = $currentTotal + 1;
        $rider->save();
    }
}