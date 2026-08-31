<?php

namespace App\Services;

use App\Models\Order;
use App\Models\RiderLocation;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EtaCalculationService
{
    private const OSRM_TIMEOUT = 2;
    private const STALE_GPS_SECONDS = 60;
    private const RECALCULATE_THRESHOLD_METERS = 200;
    private const MIN_ETA_SECONDS = 60;
    private const AVG_SPEED_MS = 8.33; // ~30 km/h average delivery speed

    public function calculateForOrder(Order $order): ?array
    {
        if (!$order->rider_id || !$order->delivery_latitude || !$order->delivery_longitude) {
            return null;
        }

        $riderLocation = RiderLocation::where('rider_id', $order->rider_id)
            ->orderByDesc('recorded_at')
            ->first();

        if (!$riderLocation) {
            return null;
        }

        $recordedAt = $riderLocation->recorded_at;
        if ($recordedAt && $recordedAt->diffInSeconds(now()) > self::STALE_GPS_SECONDS) {
            Log::debug('[EtaCalculation] Stale GPS data', [
                'rider_id' => $order->rider_id,
                'seconds_old' => $recordedAt->diffInSeconds(now()),
            ]);
            return null;
        }

        $riderLat = (float) $riderLocation->latitude;
        $riderLng = (float) $riderLocation->longitude;
        $destLat = (float) $order->delivery_latitude;
        $destLng = (float) $order->delivery_longitude;

        $distance = GeoUtils::haversineDistance($riderLat, $riderLng, $destLat, $destLng) * 1000;

        $etaFromOsrm = $this->getOsrmEta($riderLat, $riderLng, $destLat, $destLng);

        $etaSeconds = $etaFromOsrm ?? max((int) ceil($distance / self::AVG_SPEED_MS), self::MIN_ETA_SECONDS);

        $order->update([
            'eta_seconds' => $etaSeconds,
            'eta_updated_at' => now(),
        ]);

        return [
            'eta_seconds' => $etaSeconds,
            'distance_meters' => (int) $distance,
            'calculated_at' => now()->toIso8601String(),
            'source' => $etaFromOsrm !== null ? 'osrm' : 'haversine',
        ];
    }

    public function needsRecalculation(Order $order): bool
    {
        if (!$order->rider_id || !$order->eta_updated_at) {
            return true;
        }

        $riderLocation = RiderLocation::where('rider_id', $order->rider_id)
            ->orderByDesc('recorded_at')
            ->first();

        if (!$riderLocation || !$order->delivery_latitude || !$order->delivery_longitude) {
            return false;
        }

        $distance = GeoUtils::haversineDistance(
            (float) $riderLocation->latitude,
            (float) $riderLocation->longitude,
            (float) $order->delivery_latitude,
            (float) $order->delivery_longitude
        ) * 1000;

        return $distance > self::RECALCULATE_THRESHOLD_METERS;
    }

    private function getOsrmEta(float $fromLat, float $fromLng, float $toLat, float $toLng): ?int
    {
        try {
            $url = sprintf(
                '%s/route/v1/driving/%s,%s;%s,%s?overview=false',
                config('routing.osrm_base_url'),
                $fromLng,
                $fromLat,
                $toLng,
                $toLat
            );

            $response = Http::timeout(self::OSRM_TIMEOUT)->get($url);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['routes'][0]['duration'])) {
                    return (int) ceil($data['routes'][0]['duration']);
                }
            }
        } catch (\Exception $e) {
            Log::debug('[EtaCalculation] OSRM fallback', ['error' => $e->getMessage()]);
        }

        return null;
    }
}
