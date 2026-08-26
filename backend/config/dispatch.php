<?php

return [
    'retry_interval_seconds' => env('DISPATCH_RETRY_INTERVAL', 60),
    'timeout_seconds' => env('DISPATCH_TIMEOUT', 300),
    'max_fallback_stores' => env('DISPATCH_MAX_FALLBACK', 3),
    'max_attempts' => env('DISPATCH_MAX_ATTEMPTS', 5),
    'delivery_fee' => env('DISPATCH_DELIVERY_FEE', 0),
    'delivery_fee_cents' => env('DISPATCH_DELIVERY_FEE_CENTS', 0),
];
