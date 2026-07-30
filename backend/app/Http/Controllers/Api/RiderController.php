<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rider;
use App\Services\RiderOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    private RiderOrderService $riderOrderService;

    public function __construct(RiderOrderService $riderOrderService)
    {
        $this->riderOrderService = $riderOrderService;
    }

    private function getRider(Request $request): Rider
    {
        return $request->user()->rider;
    }

    public function availableOrders(Request $request): JsonResponse
    {
        $rider = $this->getRider($request);

        $orders = Order::where('store_id', $rider->store_id)
            ->where('status', OrderStatus::Confirmed)
            ->whereNull('rider_id')
            ->with('items')
            ->get();

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
