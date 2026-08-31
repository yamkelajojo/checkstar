<?php

namespace App\Services;

/**
 * Mock routing provider for development and testing.
 * Returns fixed, predictable route results so mobile UI can be
 * tested without a running OSRM server.
 */
class MockRoutingProvider
{
    public function calculateRoute(float $fromLat, float $fromLng, float $toLat, float $toLng): RouteResult
    {
        // Mock straight-line distance + fixed duration for development
        $distanceKm = $this->haversine($fromLat, $fromLng, $toLat, $toLng);
        $durationMinutes = max(5, (int) ceil(($distanceKm / 25) * 60 + 5));

        return new RouteResult(
            distanceKm: round($distanceKm, 2),
            durationMinutes: $durationMinutes,
            geometry: null,
            source: 'mock_fallback',
        );
    }

    public function getRouteGeometry(float $fromLat, float $fromLng, float $toLat, float $toLng): ?string
    {
        // Return a simple encoded polyline for mock purposes
        // In a real scenario this would come from OSRM
        return null;
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
