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
        $store = $this->storeContext->resolve($request->user());
        $storeId = $store->id;
        $orders = Order::where('store_id', $storeId)
            ->with(['items', 'rider.user', 'customer'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user());
        $order = Order::where('id', $id)->where('store_id', $store->id)->firstOrFail();

        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,preparing,out_for_delivery,delivered,cancelled',
        ]);

        $this->stateMachine->transition($order, OrderStatus::from($validated['status']), $request->user());

        return response()->json(['data' => $order->fresh()->load('items', 'rider.user')]);
    }

    public function inventory(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user());
        $items = StoreProduct::where('store_id', $store->id)
            ->with('product')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function updateInventory(Request $request, int $productId): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user());
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
