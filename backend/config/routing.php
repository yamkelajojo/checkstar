<?php

return [
    'osrm_base_url' => env('OSRM_BASE_URL'),
    'provider' => env('ROUTING_PROVIDER', 'osrm'), // 'osrm' | 'mock' | 'haversine'
];