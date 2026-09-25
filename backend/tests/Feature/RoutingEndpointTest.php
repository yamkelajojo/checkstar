<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * /routing/geometry must always return metrics alongside the polyline so map
 * clients can label the distance/estimate truthfully instead of hardcoding one.
 */
class RoutingEndpointTest extends TestCase
{
    use RefreshDatabase;

    private function coords(): array
    {
        return [
            'from_lat' => -29.8587,
            'from_lng' => 31.0218,
            'to_lat' => -29.8600,
            'to_lng' => 31.0200,
        ];
    }

    public function test_geometry_returns_metrics_even_when_osrm_is_unavailable(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', null);

        $response = $this->getJson('/api/routing/geometry?'.http_build_query($this->coords()));

        $response->assertOk()
            ->assertJsonPath('source', 'haversine_fallback')
            ->assertJsonPath('geometry', null);

        $this->assertArrayHasKey('distance_km', $response->json());
        $this->assertArrayHasKey('duration_minutes', $response->json());
        $this->assertGreaterThan(0, $response->json('distance_km'));
        $this->assertGreaterThan(0, $response->json('duration_minutes'));
    }

    public function test_geometry_returns_osrm_geometry_and_metrics(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', 'https://router.project-osrm.org');

        Http::fake([
            '*/route/*' => Http::response([
                'routes' => [[
                    'distance' => 4200,
                    'duration' => 600,
                    'geometry' => 'encoded_polyline',
                ]],
            ]),
        ]);

        $response = $this->getJson('/api/routing/geometry?'.http_build_query($this->coords()));

        $response->assertOk()
            ->assertJsonPath('source', 'osrm')
            ->assertJsonPath('geometry', 'encoded_polyline')
            ->assertJsonPath('distance_km', 4.2)
            ->assertJsonPath('duration_minutes', 10);
    }

    public function test_route_endpoint_shape_is_unchanged(): void
    {
        Config::set('routing.provider', 'osrm');
        Config::set('routing.osrm_base_url', null);

        $response = $this->getJson('/api/routing/route?'.http_build_query($this->coords()));

        $response->assertOk()
            ->assertJsonPath('source', 'haversine_fallback')
            ->assertJsonStructure(['distance_km', 'duration_minutes', 'geometry', 'source']);
    }

    public function test_geometry_rejects_out_of_range_coordinates(): void
    {
        $coords = $this->coords();
        $coords['from_lat'] = 999;

        $this->getJson('/api/routing/geometry?'.http_build_query($coords))->assertStatus(422);
    }
}
