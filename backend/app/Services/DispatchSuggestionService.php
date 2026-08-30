<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class DispatchSuggestionService
{
    private const EARTH_RADIUS_M = 6371000;

    public function getSuggestion(int $orderId): ?object
    {
        $order = DB::table('orders')
            ->where('id', $orderId)
            ->first();

        if (!$order) {
            return null;
        }

        $customerLat = $order->delivery_latitude;
        $customerLng = $order->delivery_longitude;

        if (!$customerLat || !$customerLng) {
            return (object) [
                'order' => $this->mapOrder($order),
                'nearest_rider' => null,
                'alternative_riders' => [],
            ];
        }

        $riders = DB::table('riders')
            ->where('is_available', true)
            ->where('store_id', $order->store_id)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->map(function ($rider) use ($customerLat, $customerLng) {
                $distance = $this->haversineDistance(
                    $rider->latitude, $rider->longitude,
                    $customerLat, $customerLng
                );
                $rider->distance_meters = $distance;
                $rider->eta_seconds = max(60, (int) ($distance / 250)); // ~15 km/h avg speed
                return $rider;
            })
            ->filter(fn ($rider) => $rider->distance_meters <= ($rider->max_radius_km * 1000))
            ->sortBy('distance_meters')
            ->values();

        $nearest = $riders->first();
        $alternatives = $riders->slice(1, 3)->all();

        return (object) [
            'order' => $this->mapOrder($order),
            'nearest_rider' => $nearest ? $this->mapRider($nearest) : null,
            'alternative_riders' => array_map(fn ($r) => $this->mapRider($r), $alternatives),
        ];
    }

    private function haversineDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2 +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) ** 2;

        return self::EARTH_RADIUS_M * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function mapOrder($order): object
    {
        return (object) [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'total' => $order->total,
            'delivery_address' => $order->delivery_address,
            'delivery_latitude' => $order->delivery_latitude,
            'delivery_longitude' => $order->delivery_longitude,
        ];
    }

    private function mapRider($rider): object
    {
        return (object) [
            'id' => $rider->id,
            'name' => 'Rider #' . $rider->id,
            'distance_meters' => (int) $rider->distance_meters,
            'eta_seconds' => $rider->eta_seconds,
            'latitude' => $rider->latitude,
            'longitude' => $rider->longitude,
        ];
    }
}
