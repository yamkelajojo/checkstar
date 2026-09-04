<?php

namespace App\Services;

use App\Models\Order;

class ClaimResult
{
    public function __construct(
        public readonly Order $order,
        public readonly int $claimLatencyMs,
        public readonly bool $claimed,
    ) {}
}
