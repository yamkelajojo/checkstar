<?php

namespace App\Services;

use App\Models\Rider;
use App\Models\Store;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;

class DispatchPolicy
{
    public function eligibleStores(float $customerLat, float $customerLng): Collection
    {
        return Store::where('is_active', true)
            ->get()
            ->map(fn (Store $store) => [
                'store' => $store,
                'distance_km' => GeoUtils::haversineDistance(
                    $customerLat, $customerLng,
                    (float) $store->latitude, (float) $store->longitude
                ),
            ])
            ->filter(fn (array $sd) => $sd['distance_km'] <= (float) $sd['store']->delivery_radius_km)
            ->sortBy('distance_km')
            ->values();
    }

    public function eligibleRider(Store $store, float $distance): ?Rider
    {
        return Rider::where('store_id', $store->id)
            ->where('is_available', true)
            ->where('max_radius_km', '>=', $distance)
            ->whereNull('suspended_at')
            ->first();
    }

    public function maxFallbackStores(): int
    {
        return Config::get('dispatch.max_fallback_stores', 3);
    }

    public function maxAttempts(): int
    {
        return Config::get('dispatch.max_attempts', 5);
    }

    public function retryIntervalSeconds(): int
    {
        return (int) Config::get('dispatch.retry_interval_seconds', 60);
    }

    public function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        return GeoUtils::haversineDistance($lat1, $lng1, $lat2, $lng2);
    }
}
