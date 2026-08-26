<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rider;
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
        $rider = $request->user()->rider;
        abort_unless($rider, 403, 'Rider profile not found');

        // Show orders either assigned to rider's store OR retrying/unassigned but within delivery radius
        $orders = Order::whereIn('status', [OrderStatus::Confirmed, OrderStatus::Retrying])
            ->whereNull('rider_id')
            ->with('items')
            ->get()
            ->filter(function (Order $order) use ($rider) {
                // Directly assigned to rider's store
                if ($order->store_id !== null) {
                    return $order->store_id === $rider->store_id;
                }
                // Retrying / unassigned: check if rider's store is eligible for delivery location
                if ($order->delivery_latitude === null || $order->delivery_longitude === null) {
                    return false;
                }
                $eligible = $this->dispatchPolicy->eligibleStores((float) $order->delivery_latitude, (float) $order->delivery_longitude);
                return $eligible->contains(fn ($sd) => $sd['store']->id === $rider->store_id);
            })
            ->values();

        return response()->json(['data' => $orders]);
    }

    public function claim(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);
        $claimed = $this->riderOrderService->claim($rider, $orderId);

        if (!$claimed) {
            return response()->json(['message' => 'Order already claimed or unavailable'], 409);
        }

        return response()->json(['data' => $claimed->load('items', 'store')]);
    }

    public function activeDeliveries(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);

        $orders = Order::where('rider_id', $rider->id)
            ->whereIn('status', [
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
        $this->riderOrderService->markItemsBought($rider, $orderId);

        return response()->json(['message' => 'Items marked as bought']);
    }

    public function outForDelivery(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);
        $order = $this->riderOrderService->advanceStatus($rider, $orderId, OrderStatus::OutForDelivery);

        return response()->json(['data' => $order]);
    }

    public function delivered(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);
        $order = $this->riderOrderService->advanceStatus($rider, $orderId, OrderStatus::Delivered);

        return response()->json(['data' => $order]);
    }

    public function toggleAvailability(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);
        $rider->is_available = !$rider->is_available;
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

    public function history(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);
        $orders = Order::where('rider_id', $rider->id)
            ->where('status', OrderStatus::Delivered)
            ->with('items', 'store')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }
}
