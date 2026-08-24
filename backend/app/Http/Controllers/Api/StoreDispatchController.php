<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
    ) {
    }

    public function pending(Request $request): JsonResponse
    {
        $store = $this->storeContext->resolve($request->user(), $request->query('store_id') !== null ? (int) $request->query('store_id') : null);

        return response()->json(['data' => $this->manualDispatch->pendingForStore($store)]);
    }

    public function dispatch(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rider_id' => 'required|exists:riders,id',
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        $store = $this->storeContext->resolve($request->user(), $validated['store_id'] ?? null);
        $order = \App\Models\Order::findOrFail($id);

        $result = $this->manualDispatch->dispatchToRider($order, Rider::findOrFail($validated['rider_id']), $store);

        if (is_array($result)) {
            return response()->json(['message' => 'Cannot dispatch order', 'reason' => $result['reason']], 409);
        }

        if (!$result->claimed) {
            return response()->json(['message' => 'Order already claimed', 'reason' => 'order_already_claimed'], 409);
        }

        return response()->json(['data' => $result->order->fresh()->load('items', 'rider.user', 'store')]);
    }

    public function reassign(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rider_id' => 'required|exists:riders,id',
        ]);

        $order = \App\Models\Order::findOrFail($id);

        $result = $this->manualDispatch->reassign($order, Rider::findOrFail($validated['rider_id']));

        if (is_array($result)) {
            return response()->json(['message' => 'Cannot reassign order', 'reason' => $result['reason']], 409);
        }

        return response()->json(['data' => $result->load('items', 'rider.user', 'store')]);
    }
}
