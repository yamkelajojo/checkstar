<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BehavioralTrackingService;
use App\Services\TrackingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TrackingController extends Controller
{
    protected BehavioralTrackingService $tracking;
    protected TrackingService $userTracking;

    public function __construct(BehavioralTrackingService $tracking, TrackingService $userTracking)
    {
        $this->tracking = $tracking;
        $this->userTracking = $userTracking;
    }

    public function view(Request $request): JsonResponse
    {
        $this->tracking->capture('long_view', [
            'product_id' => $request->input('product_id'),
            'duration_ms' => $request->input('duration_ms'),
        ]);
        return response()->json(['status' => 'captured']);
    }

    public function search(Request $request): JsonResponse
    {
        $this->tracking->capture('search', [
            'query' => $request->input('query'),
        ]);
        return response()->json(['status' => 'captured']);
    }

    public function contact(Request $request): JsonResponse
    {
        $this->tracking->capture('contact', [
            'product_id' => $request->input('product_id'),
        ]);
        return response()->json(['status' => 'captured']);
    }

    public function storeEvent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_type' => 'required|string|in:product_view,search,add_to_cart,remove_from_cart,checkout',
            'product_id' => 'nullable|integer|exists:products,id',
            'search_query' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        $customerId = $request->user()->id;

        $event = $this->userTracking->store(
            $customerId,
            $validated['event_type'],
            $validated['product_id'] ?? null,
            $validated['search_query'] ?? null,
            $validated['metadata'] ?? []
        );

        if (!$event) {
            return response()->json(['error' => 'Failed to store event'], 500);
        }

        return response()->json(['success' => true]);
    }

    public function storeBatch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'events' => 'required|array|max:50',
            'events.*.event_type' => 'required|string|in:product_view,search,add_to_cart,remove_from_cart,checkout',
            'events.*.product_id' => 'nullable|integer|exists:products,id',
            'events.*.search_query' => 'nullable|string|max:255',
            'events.*.metadata' => 'nullable|array',
        ]);

        $customerId = $request->user()->id;
        $stored = $this->userTracking->storeBatch($customerId, $validated['events']);

        return response()->json(['success' => true, 'stored' => $stored]);
    }
}
