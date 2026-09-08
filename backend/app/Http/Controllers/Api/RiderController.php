<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rider;
use App\Models\RiderLocation;
use App\Services\DispatchPolicy;
use App\Services\RiderOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    private RiderOrderService $riderOrderService;

    private DispatchPolicy $dispatchPolicy;

    public function __construct(RiderOrderService $riderOrderService, DispatchPolicy $dispatchPolicy)
    {
        $this->riderOrderService = $riderOrderService;
        $this->dispatchPolicy = $dispatchPolicy;
    }

    private function getRider(Request $request): Rider
    {
        $rider = $request->user()->rider;
        abort_unless($rider, 403, 'Rider profile not found');

        return $rider;
    }

    public function availableOrders(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);

        $orders = Order::whereIn('status', [OrderStatus::Confirmed, OrderStatus::Retrying])
            ->whereNull('rider_id')
            // Pickup orders are collected by the customer — never rider work.
            ->where('fulfilment_method', 'delivery')
            ->with('items', 'store')
            ->when($rider->store_id, function ($query) use ($rider) {
                $query->where(function ($q) use ($rider) {
                    $q->where('store_id', $rider->store_id)
                        ->orWhere(function ($q2) {
                            $q2->whereNull('store_id')
                                ->whereNotNull('delivery_latitude')
                                ->whereNotNull('delivery_longitude');
                        });
                });
            })
            ->orderBy('created_at')
            ->get();

        // Filter by dispatch policy in PHP
        $filtered = $orders->filter(function (Order $order) use ($rider) {
            if ($order->store_id !== null) {
                return $order->store_id === $rider->store_id;
            }
            if ($order->delivery_latitude === null || $order->delivery_longitude === null) {
                return false;
            }
            $eligible = $this->dispatchPolicy->eligibleStores((float) $order->delivery_latitude, (float) $order->delivery_longitude);

            return $eligible->contains(fn ($sd) => $sd['store']->id === $rider->store_id);
        })->values();

        return response()->json(['data' => $filtered]);
    }

    public function claim(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);
        $claimed = $this->riderOrderService->claim($rider, $orderId);

        if (! $claimed) {
            return response()->json(['message' => 'Order already claimed or unavailable'], 409);
        }

        return response()->json(['data' => $claimed->load('items', 'store')]);
    }

    public function activeDeliveries(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);

        $orders = Order::where('rider_id', $rider->id)
            ->whereIn('status', [
                OrderStatus::Confirmed->value,
                OrderStatus::Preparing->value,
                OrderStatus::OutForDelivery->value,
            ])
            ->with('items', 'store')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function itemsBought(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);

        $validated = $request->validate([
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'integer',
        ]);

        try {
            $order = $this->riderOrderService->markItemsBought($rider, $orderId, $validated['item_ids']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $order]);
    }

    public function outForDelivery(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);

        try {
            $order = $this->riderOrderService->advanceStatus($rider, $orderId, OrderStatus::OutForDelivery);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $order]);
    }

    public function delivered(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);

        try {
            $order = $this->riderOrderService->advanceStatus($rider, $orderId, OrderStatus::Delivered);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['data' => $order]);
    }

    public function toggleAvailability(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);
        $rider->is_available = ! $rider->is_available;
        $rider->save();

        return response()->json(['data' => $rider]);
    }

    public function stats(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);
        $badges = $rider->badges()->get();

        return response()->json([
            'data' => [
                'xp' => $rider->xp,
                'level' => $rider->level,
                'total_deliveries' => $rider->total_deliveries,
                'average_rating' => $rider->average_rating,
                'badges' => $badges,
            ],
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);
        $rider->load('store:id,name,slug');

        return response()->json([
            'data' => [
                'id' => $rider->id,
                'user_id' => $rider->user_id,
                'store_id' => $rider->store_id,
                'vehicle_type' => $rider->vehicle_type,
                'license_plate' => $rider->license_plate,
                'is_available' => $rider->is_available,
                'max_radius_km' => $rider->max_radius_km,
                'banking_details' => $rider->banking_details,
                'xp' => $rider->xp,
                'level' => $rider->level,
                'total_deliveries' => $rider->total_deliveries,
                'average_rating' => $rider->average_rating,
                'store' => $rider->store,
                'created_at' => $rider->created_at,
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);
        $orders = Order::where('rider_id', $rider->id)
            ->where('status', OrderStatus::Delivered)
            ->with('items', 'store')
            ->orderByDesc('created_at')
            ->paginate(20);

        return response()->json($orders);
    }

    public function updateLocation(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);

        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        RiderLocation::updateOrCreate(
            ['rider_id' => $rider->id],
            [
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'recorded_at' => now(),
            ]
        );

        return response()->json(['message' => 'Location updated']);
    }
}
