<?php

namespace App\Services;

use App\Models\Order;
use App\Models\RiderLocation;
use App\Models\Store;
use Illuminate\Support\Carbon;

class MapLayersService
{
    /**
     * Get all map layer data for a store.
     *
     * @return array{traffic: array, routes: array, demand: array}
     */
    public function getLayers(Store $store): array
    {
        return [
            'traffic' => $this->getTraffic($store),
            'routes' => $this->getActiveRoutes($store),
            'demand' => $this->getDemand($store),
        ];
    }

    /**
     * Traffic: order density from the last 24h, grid-clustered.
     */
    private function getTraffic(Store $store): array
    {
        $points = Order::where('store_id', $store->id)
            ->whereNotNull('delivery_latitude')
            ->whereNotNull('delivery_longitude')
            ->where('created_at', '>=', Carbon::now()->subDay())
            ->select('delivery_latitude', 'delivery_longitude')
            ->get()
            ->map(fn ($o) => [(float) $o->delivery_latitude, (float) $o->delivery_longitude])
            ->toArray();

        return $this->clusterPoints($points, precision: 2);
    }

    /**
     * Routes: active delivery rider locations.
     */
    private function getActiveRoutes(Store $store): array
    {
        $activeRiderIds = Order::where('store_id', $store->id)
            ->where('status', 'out_for_delivery')
            ->whereNotNull('rider_id')
            ->pluck('rider_id')
            ->unique();

        if ($activeRiderIds->isEmpty()) {
            return [];
        }

        return RiderLocation::whereIn('rider_id', $activeRiderIds)
            ->select('rider_id', 'latitude', 'longitude', 'recorded_at')
            ->orderBy('recorded_at', 'desc')
            ->get()
            ->unique('rider_id')
            ->map(fn ($loc) => [
                'rider_id' => $loc->rider_id,
                'lat' => (float) $loc->latitude,
                'lng' => (float) $loc->longitude,
            ])
            ->values()
            ->toArray();
    }

    /**
     * Demand: order density from the last 7 days.
     */
    private function getDemand(Store $store): array
    {
        $points = Order::where('store_id', $store->id)
            ->whereNotNull('delivery_latitude')
            ->whereNotNull('delivery_longitude')
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->select('delivery_latitude', 'delivery_longitude')
            ->get()
            ->map(fn ($o) => [(float) $o->delivery_latitude, (float) $o->delivery_longitude])
            ->toArray();

        return $this->clusterPoints($points, precision: 3);
    }

    /**
     * Cluster lat/lng points by grid cell. Returns [{lat, lng, count}].
     */
    public function clusterPoints(array $points, int $precision = 2): array
    {
        $grid = [];
        foreach ($points as [$lat, $lng]) {
            $key = round($lat, $precision) . ',' . round($lng, $precision);
            if (!isset($grid[$key])) {
                $grid[$key] = ['lat' => 0.0, 'lng' => 0.0, 'count' => 0];
            }
            $grid[$key]['lat'] += $lat;
            $grid[$key]['lng'] += $lng;
            $grid[$key]['count']++;
        }

        return array_values(array_map(fn ($cell) => [
            'lat' => $cell['lat'] / $cell['count'],
            'lng' => $cell['lng'] / $cell['count'],
            'count' => $cell['count'],
        ], $grid));
    }
}
