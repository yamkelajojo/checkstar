<?php

return [
    'retry_interval_seconds' => env('DISPATCH_RETRY_INTERVAL', 60),
    'timeout_seconds' => env('DISPATCH_TIMEOUT', 300),
    'max_fallback_stores' => env('DISPATCH_MAX_FALLBACK', 3),
    'max_attempts' => env('DISPATCH_MAX_ATTEMPTS', 5),
    'delivery_fee' => env('DISPATCH_DELIVERY_FEE', 0),
    'delivery_fee_cents' => env('DISPATCH_DELIVERY_FEE_CENTS', 0),
    // How many active (confirmed/preparing/out_for_delivery) orders one rider
    // may hold at once. 1 = one basket per trip; 0 or negative = unlimited.
    // Enforced atomically inside the order claim transaction.
    'max_concurrent_orders_per_rider' => env('DISPATCH_MAX_CONCURRENT_PER_RIDER', 1),
];
