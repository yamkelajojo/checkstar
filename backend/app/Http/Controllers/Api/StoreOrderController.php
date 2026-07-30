<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\StoreProduct;
use App\Models\StoreStaff;
use App\Services\OrderStateMachine;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreOrderController extends Controller
{
    private function getStoreId(Request $request): int
    {
        $user = $request->user();
        $role = $user->role->value;

        if ($role === 'store_owner' && $user->store) {
            return $user->store->id;
        }

        $staff = StoreStaff::where('user_id', $user->id)->first();
        return $staff?->store_id ?? throw new \RuntimeException('No store assigned');
    }

    public function orders(Request $request): JsonResponse
    {
        $storeId = $this->getStoreId($request);
        $orders = Order::where('store_id', $storeId)
            ->with(['items', 'rider.user', 'customer'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $storeId = $this->getStoreId($request);
        $order = Order::where('id', $id)->where('store_id', $storeId)->firstOrFail();

        $validated = $request->validate([
            'status' => 'required|string|in:pending,confirmed,preparing,out_for_delivery,delivered,cancelled',
        ]);

        $stateMachine = new OrderStateMachine;
        $stateMachine->transition($order, OrderStatus::from($validated['status']), $request->user());

        return response()->json(['data' => $order->fresh()->load('items', 'rider.user')]);
    }

    public function inventory(Request $request): JsonResponse
    {
        $storeId = $this->getStoreId($request);
        $items = StoreProduct::where('store_id', $storeId)
            ->with('product')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function updateInventory(Request $request, int $productId): JsonResponse
    {
        $storeId = $this->getStoreId($request);
        $sp = StoreProduct::where('store_id', $storeId)
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
