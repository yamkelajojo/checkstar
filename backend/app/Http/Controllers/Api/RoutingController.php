<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RoutingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoutingController extends Controller
{
    public function __construct(
        private RoutingService $routingService,
    ) {}

    /**
     * Calculate route between two coordinates.
     *
     * GET /api/routing/route?from_lat=...&from_lng=...&to_lat=...&to_lng=...
     */
    public function route(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_lat' => 'required|numeric|between:-90,90',
            'from_lng' => 'required|numeric|between:-180,180',
            'to_lat' => 'required|numeric|between:-90,90',
            'to_lng' => 'required|numeric|between:-180,180',
        ]);

        $result = $this->routingService->calculateRoute(
            (float) $validated['from_lat'],
            (float) $validated['from_lng'],
            (float) $validated['to_lat'],
            (float) $validated['to_lng'],
        );

        return response()->json($result->toArray());
    }

    /**
     * Get route geometry (polyline) plus distance, duration and source.
     *
     * calculateRoute() already returns the geometry from the same OSRM call,
     * so one request covers both the polyline and the metrics. When OSRM is
     * unavailable the metrics still come back as a Haversine estimate with
     * geometry: null, so clients always get a usable distance/duration.
     *
     * GET /api/routing/geometry?from_lat=...&from_lng=...&to_lat=...&to_lng=...
     */
    public function geometry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from_lat' => 'required|numeric|between:-90,90',
            'from_lng' => 'required|numeric|between:-180,180',
            'to_lat' => 'required|numeric|between:-90,90',
            'to_lng' => 'required|numeric|between:-180,180',
        ]);

        $result = $this->routingService->calculateRoute(
            (float) $validated['from_lat'],
            (float) $validated['from_lng'],
            (float) $validated['to_lat'],
            (float) $validated['to_lng'],
        );

        return response()->json($result->toArray());
    }
}
