<?php

namespace App\Services;

use App\Models\Order;

class OrderIntakeResult
{
    public function __construct(
        public readonly Order $order,
        public readonly string $dispatchStatus,
        public readonly ?int $claimLatencyMs = null,
        public readonly ?int $riderId = null,
        public readonly ?int $storeId = null,
    ) {}
}
