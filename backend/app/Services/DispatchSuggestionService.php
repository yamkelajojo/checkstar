<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Store;
use Illuminate\Support\Facades\DB;

class DispatchSuggestionService
{
    /**
     * Average motorbike delivery speed in metres per second (~30 km/h),
     * shared with EtaCalculationService via config so both ETA surfaces
     * stay consistent.
     */
    private const AVG_SPEED_MPS = 8.33;

    public function getSuggestion(int $orderId, ?Store $contextStore = null): ?object
    {
        $order = DB::table('orders')
            ->where('id', $orderId)
            ->first();

        if (! $order) {
            return null;
        }

        // Store scoping: operators may only see suggestions for their own
        // store's orders (prevents cross-store data leakage).
        if ($contextStore !== null && (int) $order->store_id !== (int) $contextStore->id) {
            return null;
        }

        $customerLat = $order->delivery_latitude;
        $customerLng = $order->delivery_longitude;

        if (! $customerLat || ! $customerLng) {
            return (object) [
                'order' => $this->mapOrder($order),
                'nearest_rider' => null,
                'alternative_riders' => [],
            ];
        }

        $riders = DB::table('riders')
            ->where('is_available', true)
            ->whereNull('suspended_at')
            ->where('store_id', $order->store_id)
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->get()
            ->map(function ($rider) use ($customerLat, $customerLng) {
                $distance = GeoUtils::haversineDistance(
                    $rider->latitude, $rider->longitude,
                    $customerLat, $customerLng
                ) * 1000;
                $rider->distance_meters = $distance;
                $rider->eta_seconds = max(60, (int) ceil($distance / self::AVG_SPEED_MPS));

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
            'name' => 'Rider #'.$rider->id,
            'distance_meters' => (int) $rider->distance_meters,
            'eta_seconds' => $rider->eta_seconds,
            'latitude' => $rider->latitude,
            'longitude' => $rider->longitude,
        ];
    }
}
