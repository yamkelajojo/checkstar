<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

class RoutingService
{
    public function __construct(
        private ?string $osrmBaseUrl = null,
    ) {
        $this->osrmBaseUrl = $this->osrmBaseUrl ?? Config::get('routing.osrm_base_url');
    }

    /**
     * Calculate distance and duration between two coordinates.
     * Uses OSRM if configured, falls back to Haversine formula.
     */
    public function calculateRoute(float $fromLat, float $fromLng, float $toLat, float $toLng): RouteResult
    {
        $provider = Config::get('routing.provider', 'osrm');

        if ($provider === 'mock') {
            $mock = new MockRoutingProvider;

            return $mock->calculateRoute($fromLat, $fromLng, $toLat, $toLng);
        }

        if ($this->osrmBaseUrl && $provider === 'osrm') {
            try {
                return $this->fetchFromOsrm($fromLat, $fromLng, $toLat, $toLng);
            } catch (\Throwable $e) {
                // Fall back to haversine if OSRM fails
            }
        }

        // Fallback: straight-line distance with estimated duration
        $distanceKm = GeoUtils::haversineDistance($fromLat, $fromLng, $toLat, $toLng);
        $durationMinutes = $this->estimateDuration($distanceKm);

        return new RouteResult(
            distanceKm: round($distanceKm, 2),
            durationMinutes: $durationMinutes,
            geometry: null,
            source: $provider === 'haversine' ? 'haversine_fallback' : 'haversine_fallback',
        );
    }

    /**
     * Get route geometry (polyline) if available from OSRM.
     */
    public function getRouteGeometry(float $fromLat, float $fromLng, float $toLat, float $toLng): ?string
    {
        $provider = Config::get('routing.provider', 'osrm');

        if ($provider === 'mock') {
            $mock = new MockRoutingProvider;

            return $mock->getRouteGeometry($fromLat, $fromLng, $toLat, $toLng);
        }

        if (! $this->osrmBaseUrl || $provider !== 'osrm') {
            return null;
        }

        try {
            $response = Http::timeout(2)->connectTimeout(1)->get("{$this->osrmBaseUrl}/route/v1/driving/{$fromLng},{$fromLat};{$toLng},{$toLat}", [
                'overview' => 'full',
                'geometries' => 'polyline',
                'steps' => 'false',
            ]);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['routes'][0]['geometry'])) {
                    return $data['routes'][0]['geometry'];
                }
            }
        } catch (\Throwable $e) {
            // OSRM unavailable
        }

        return null;
    }

    /**
     * Fetch route from OSRM.
     */
    private function fetchFromOsrm(float $fromLat, float $fromLng, float $toLat, float $toLng): RouteResult
    {
        $response = Http::timeout(2)->connectTimeout(1)->get("{$this->osrmBaseUrl}/route/v1/driving/{$fromLng},{$fromLat};{$toLng},{$toLat}", [
            'overview' => 'full',
            'geometries' => 'polyline',
            'steps' => 'false',
        ]);

        if (! $response->successful()) {
            throw new \RuntimeException('OSRM request failed: '.$response->status());
        }

        $data = $response->json();

        if (! isset($data['routes'][0]['distance'], $data['routes'][0]['duration'])) {
            throw new \RuntimeException('Invalid OSRM response');
        }

        $distanceKm = $data['routes'][0]['distance'] / 1000; // meters to km
        $durationMinutes = ceil($data['routes'][0]['duration'] / 60); // seconds to minutes

        $geometry = $data['routes'][0]['geometry'] ?? null;

        return new RouteResult(
            distanceKm: round($distanceKm, 2),
            durationMinutes: $durationMinutes,
            geometry: $geometry,
            source: 'osrm',
        );
    }

    /**
     * Estimate delivery duration based on distance (motorbike in urban traffic).
     */
    private function estimateDuration(float $distanceKm): int
    {
        // Average motorbike speed in urban Durban: ~25 km/h
        // Add 5 minutes for pickup/dropoff
        $travelMinutes = ($distanceKm / 25) * 60;

        return (int) ceil($travelMinutes + 5);
    }
}

class RouteResult
{
    public function __construct(
        public readonly float $distanceKm,
        public readonly int $durationMinutes,
        public readonly ?string $geometry,
        public readonly string $source, // 'osrm' | 'haversine_fallback'
    ) {}

    public function toArray(): array
    {
        return [
            'distance_km' => $this->distanceKm,
            'duration_minutes' => $this->durationMinutes,
            'geometry' => $this->geometry,
            'source' => $this->source,
        ];
    }
}
