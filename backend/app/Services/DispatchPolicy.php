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
                'distance_km' => $this->haversine(
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

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
