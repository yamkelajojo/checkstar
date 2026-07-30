<?php

namespace App\Http\Controllers\Api;

use App\Enums\EventType;
use App\Enums\GameEvent;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\Rider;
use App\Models\StoreProduct;
use App\Services\GamificationService;
use App\Services\OrderStateMachine;
use DB;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    private OrderStateMachine $stateMachine;
    private GamificationService $gamification;

    public function __construct(OrderStateMachine $stateMachine, GamificationService $gamification)
    {
        $this->stateMachine = $stateMachine;
        $this->gamification = $gamification;
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

        $claimed = DB::transaction(function () use ($orderId, $rider, $request) {
            $order = Order::where('id', $orderId)
                ->whereNull('rider_id')
                ->where('status', OrderStatus::Confirmed->value)
                ->lockForUpdate()
                ->first();

            if (!$order) {
                return null;
            }

            if ($order->store_id !== $rider->store_id) {
                return null;
            }

            $this->stateMachine->transition($order, OrderStatus::Preparing, $request->user(), [
                'rider_id' => $rider->id,
            ]);

            $order->rider_id = $rider->id;
            $order->save();

            return $order;
        });

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
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        foreach ($order->items as $item) {
            if ($item->store_product_id) {
                $sp = StoreProduct::find($item->store_product_id);
                if ($sp) {
                    $sp->decrement('stock_quantity', $item->quantity);
                }
            }
        }

        $order->activityLogs()->create([
            'event_type' => EventType::ItemsBought->value,
            'user_id' => $rider->user_id,
            'old_status' => $order->status->value,
            'new_status' => $order->status->value,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Items marked as bought']);
    }

    public function outForDelivery(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        $this->stateMachine->transition($order, OrderStatus::OutForDelivery, $request->user());

        return response()->json(['data' => $order->fresh()]);
    }

    public function delivered(Request $request, int $orderId): JsonResponse
    {
        $rider = $this->getRider($request);
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        $this->stateMachine->transition($order, OrderStatus::Delivered, $request->user());

        $this->gamification->handleEvent($rider, GameEvent::DeliveryCompleted);

        return response()->json(['data' => $order->fresh()]);
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
