<?php

return [
    'retry_interval_seconds' => env('DISPATCH_RETRY_INTERVAL', 60),
    'timeout_seconds' => env('DISPATCH_TIMEOUT', 300),
    'max_fallback_stores' => env('DISPATCH_MAX_FALLBACK', 3),
];
