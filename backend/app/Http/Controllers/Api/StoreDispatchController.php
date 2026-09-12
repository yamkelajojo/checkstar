<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rider;
use App\Services\ManualDispatch;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreDispatchController extends Controller
{
    public function __construct(
        private ManualDispatch $manualDispatch,
        private StoreContext $storeContext,
    ) {}

    public function pending(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->query('store_id') !== null ? (int) $request->query('store_id') : null);

        return response()->json(['data' => $this->manualDispatch->pendingForStore($store)]);
    }

    public function riders(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->query('store_id') !== null ? (int) $request->query('store_id') : null);

        $riders = Rider::where('store_id', $store->id)
            ->where('is_available', true)
            ->whereNull('suspended_at')
            ->with('user:id,name,email,is_active')
            ->get()
            ->filter(fn (Rider $r) => $r->user && $r->user->is_active)
            ->values();

        return response()->json(['data' => $riders]);
    }

    public function dispatch(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rider_id' => 'required|exists:riders,id',
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        $store = $this->storeContext->resolve($request->user(), $validated['store_id'] ?? null);
        $order = Order::findOrFail($id);

        if ($order->store_id !== null && $order->store_id !== $store->id) {
            return response()->json(['message' => 'Order does not belong to this store', 'reason' => 'wrong_store'], 403);
        }

        $rider = Rider::findOrFail($validated['rider_id']);
        if ((int) $rider->store_id !== (int) $store->id) {
            return response()->json(['message' => 'Rider does not belong to this store', 'reason' => 'rider_wrong_store'], 403);
        }

        $result = $this->manualDispatch->dispatchToRider($order, $rider, $store);

        if (is_array($result)) {
            return response()->json(['message' => 'Cannot dispatch order', 'reason' => $result['reason']], 409);
        }

        if (! $result->claimed) {
            return response()->json(['message' => 'Order already claimed', 'reason' => 'order_already_claimed'], 409);
        }

        return response()->json(['data' => $result->order->fresh()->load('items', 'rider.user', 'store')]);
    }

    public function reassign(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rider_id' => 'required|exists:riders,id',
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        $store = $this->storeContext->resolve($request->user(), $validated['store_id'] ?? null);
        $order = Order::where('id', $id)->where('store_id', $store->id)->firstOrFail();

        $result = $this->manualDispatch->reassign($order, Rider::findOrFail($validated['rider_id']));

        if (is_array($result)) {
            return response()->json(['message' => 'Cannot reassign order', 'reason' => $result['reason']], 409);
        }

        return response()->json(['data' => $result->load('items', 'rider.user', 'store')]);
    }
}
