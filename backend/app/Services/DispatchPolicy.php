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
        $maxConcurrent = (int) Config::get('dispatch.max_concurrent_orders_per_rider', 1);

        return Rider::where('store_id', $store->id)
            ->where('is_available', true)
            ->where('max_radius_km', '>=', $distance)
            ->whereNull('suspended_at')
            // A deactivated rider account cannot call any rider endpoint
            // (EnsureUserIsActive 403s) — never hand orders to one.
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            // Skip riders already holding their cap of active orders —
            // prevents auto-dispatch from repeatedly selecting one busy rider
            // and having every claim bounce. The authoritative cap is still
            // enforced inside the claim transaction.
            ->when($maxConcurrent >= 1, function ($query) use ($maxConcurrent) {
                $query->whereDoesntHave('orders', function ($q) use ($maxConcurrent) {
                    $q->whereIn('status', ['confirmed', 'preparing', 'out_for_delivery'])
                        ->when($maxConcurrent > 1, function ($qq) use ($maxConcurrent) {
                            $qq->groupBy('rider_id')
                                ->havingRaw('COUNT(*) >= ?', [$maxConcurrent]);
                        });
                });
            })
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
