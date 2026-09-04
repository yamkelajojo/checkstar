<?php

namespace Tests\Unit;

use App\Services\RouteResult;
use App\Services\RoutingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RoutingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_mock_provider_returns_known_values(): void
    {
        Config::set('routing.provider', 'mock');

        $service = new RoutingService;
        $result = $service->calculateRoute(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertInstanceOf(RouteResult::class, $result);
        $this->assertGreaterThan(0, $result->distanceKm);
        $this->assertGreaterThan(0, $result->durationMinutes);
        $this->assertEquals('mock_fallback', $result->source);
    }

    public function test_mock_provider_returns_null_geometry(): void
    {
        Config::set('routing.provider', 'mock');

        $service = new RoutingService;
        $geometry = $service->getRouteGeometry(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertNull($geometry);
    }

    public function test_haversine_fallback_when_osrm_unavailable(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', null);

        $service = new RoutingService;
        $result = $service->calculateRoute(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertInstanceOf(RouteResult::class, $result);
        $this->assertGreaterThan(0, $result->distanceKm);
        $this->assertEquals('haversine_fallback', $result->source);
        $this->assertNull($result->geometry);
    }

    public function test_osrm_used_when_configured_and_available(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', 'https://router.project-osrm.org');

        Http::fake([
            '*/route/*' => Http::response([
                'routes' => [[
                    'distance' => 5000,
                    'duration' => 300,
                    'geometry' => 'encoded_polyline',
                ]],
            ]),
        ]);

        $service = new RoutingService;
        $result = $service->calculateRoute(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertEquals('osrm', $result->source);
        $this->assertEquals(5.0, $result->distanceKm);
        $this->assertEquals(5, $result->durationMinutes);
        $this->assertEquals('encoded_polyline', $result->geometry);
    }

    public function test_osrm_failure_falls_back_to_haversine(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', 'https://router.project-osrm.org');

        Http::fake([
            '*/route/*' => Http::response(null, 500),
        ]);

        $service = new RoutingService;
        $result = $service->calculateRoute(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertEquals('haversine_fallback', $result->source);
        $this->assertGreaterThan(0, $result->distanceKm);
    }

    public function test_osrm_timeout_falls_back_to_haversine(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', 'https://router.project-osrm.org');

        Http::fake([
            '*/route/*' => fn () => throw new ConnectionException('Timeout'),
        ]);

        $service = new RoutingService;
        $result = $service->calculateRoute(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertEquals('haversine_fallback', $result->source);
    }

    public function test_get_route_geometry_returns_null_when_osrm_unavailable(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', null);

        $service = new RoutingService;
        $geometry = $service->getRouteGeometry(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertNull($geometry);
    }

    public function test_route_result_to_array(): void
    {
        $result = new RouteResult(
            distanceKm: 5.23,
            durationMinutes: 12,
            geometry: 'encoded',
            source: 'osrm',
        );

        $array = $result->toArray();

        $this->assertEquals([
            'distance_km' => 5.23,
            'duration_minutes' => 12,
            'geometry' => 'encoded',
            'source' => 'osrm',
        ], $array);
    }

    public function test_route_result_null_geometry(): void
    {
        $result = new RouteResult(
            distanceKm: 1.0,
            durationMinutes: 5,
            geometry: null,
            source: 'haversine_fallback',
        );

        $this->assertNull($result->geometry);
        $this->assertEquals('haversine_fallback', $result->source);
    }

    public function test_custom_osrm_base_url_overrides_config(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', 'https://default-osrm.example.com');

        Http::fake([
            '*/route/*' => Http::response([
                'routes' => [[
                    'distance' => 1000,
                    'duration' => 60,
                ]],
            ]),
        ]);

        $service = new RoutingService(osrmBaseUrl: 'https://custom-osrm.example.com');
        $result = $service->calculateRoute(-29.8587, 31.0218, -29.8600, 31.0200);

        $this->assertEquals('osrm', $result->source);
    }
}
