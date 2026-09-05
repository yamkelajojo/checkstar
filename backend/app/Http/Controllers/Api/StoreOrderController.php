<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\StoreProduct;
use App\Services\OrderStateMachine;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreOrderController extends Controller
{
    private OrderStateMachine $stateMachine;

    private StoreContext $storeContext;

    public function __construct(OrderStateMachine $stateMachine, StoreContext $storeContext)
    {
        $this->stateMachine = $stateMachine;
        $this->storeContext = $storeContext;
    }

    public function orders(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->query('store_id') !== null ? (int) $request->query('store_id') : null);
        $storeId = $store->id;
        $orders = Order::where('store_id', $storeId)
            ->with(['items', 'rider.user', 'customer'])
            ->orderByDesc('created_at')
            ->paginate(min(max((int) $request->input('per_page', 25), 1), 100));

        return response()->json(['data' => $orders]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id') ? (int) $request->input('store_id') : null);
        $order = Order::where('id', $id)->where('store_id', $store->id)->firstOrFail();

        $validated = $request->validate([
            // 'ready' is pickup-only: the store flags a packed pickup order so
            // the customer can come collect. Delivery orders go out_for_delivery.
            'status' => 'required|string|in:confirmed,preparing,ready,out_for_delivery,delivered,cancelled',
        ]);

        if ($validated['status'] === 'ready' && $order->fulfilment_method !== 'pickup') {
            return response()->json([
                'message' => 'Only pickup orders can be marked ready for collection',
                'reason' => 'ready_is_pickup_only',
            ], 422);
        }

        if ($validated['status'] === 'out_for_delivery' && $order->fulfilment_method !== 'delivery') {
            return response()->json([
                'message' => 'Pickup orders are collected by the customer and never go out for delivery',
                'reason' => 'delivery_is_delivery_only',
            ], 422);
        }

        try {
            $this->stateMachine->transition($order, OrderStatus::from($validated['status']), $request->user());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage(), 'reason' => 'invalid_transition'], 409);
        }

        return response()->json(['data' => $order->fresh()->load('items', 'rider.user')]);
    }

    public function inventory(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->query('store_id') !== null ? (int) $request->query('store_id') : null);
        $items = StoreProduct::where('store_id', $store->id)
            ->with('product')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function updateInventory(Request $request, int $productId): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->input('store_id') ? (int) $request->input('store_id') : null);
        $sp = StoreProduct::where('store_id', $store->id)
            ->where('product_id', $productId)
            ->firstOrFail();

        $validated = $request->validate([
            'stock_quantity' => 'nullable|integer|min:0',
            'is_available' => 'nullable|boolean',
        ]);

        if (isset($validated['stock_quantity'])) {
            $sp->stock_quantity = $validated['stock_quantity'];
        }
        if (isset($validated['is_available'])) {
            $sp->is_available = $validated['is_available'];
        }
        $sp->save();

        return response()->json(['data' => $sp->fresh()->load('product')]);
    }
}
