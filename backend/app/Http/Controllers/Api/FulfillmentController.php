<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\StoreFulfillmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FulfillmentController extends Controller
{
    public function __construct(
        private StoreFulfillmentService $fulfillmentService,
    ) {}

    /**
     * Validate if a cart can be fulfilled from a single store.
     *
     * POST /api/fulfillment/validate
     * Body: { items: [{product_id, quantity}], latitude, longitude }
     */
    public function validate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:8',
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $result = $this->fulfillmentService->resolve(
            $validated['items'],
            (float) $validated['latitude'],
            (float) $validated['longitude'],
        );

        $status = $result->success ? 200 : 422;

        return response()->json($result->toArray(), $status);
    }

    /**
     * Get the nearest store that can fulfill a cart (for display purposes).
     *
     * GET /api/fulfillment/nearest-store?latitude=...&longitude=...
     */
    public function nearestStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        // For display purposes, just return the nearest active store
        // This doesn't validate cart - just finds nearest store
        $customerLat = (float) $validated['latitude'];
        $customerLng = (float) $validated['longitude'];

        // Use dispatch policy to get eligible stores by distance
        $eligibleStores = app(\App\Services\DispatchPolicy::class)
            ->eligibleStores($customerLat, $customerLng);

        if ($eligibleStores->isEmpty()) {
            return response()->json([
                'store' => null,
                'message' => 'No stores within delivery range of your location',
            ], 404);
        }

        $nearest = $eligibleStores->first();
        $store = $nearest['store'];

        return response()->json([
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'address' => $store->address,
                'city' => $store->city,
                'phone' => $store->phone,
                'latitude' => (float) $store->latitude,
                'longitude' => (float) $store->longitude,
                'delivery_radius_km' => (float) $store->delivery_radius_km,
                'distance_km' => round($nearest['distance_km'], 2),
            ],
        ]);
    }
}