<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Rider;
use App\Services\AuditService;
use App\Services\DispatchSuggestionService;
use App\Services\ManualDispatch;
use App\Services\StoreContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DispatchController extends Controller
{
    public function __construct(
        private DispatchSuggestionService $dispatchSuggestionService,
        private ManualDispatch $manualDispatch,
        private AuditService $auditService,
        private StoreContext $storeContext,
    ) {
    }

    public function suggestion(int $orderId): JsonResponse
    {
        $suggestion = $this->dispatchSuggestionService->getSuggestion($orderId);

        if (!$suggestion) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        return response()->json($suggestion);
    }

    public function assignRider(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|integer|exists:orders,id',
            'rider_id' => 'required|integer|exists:riders,id',
        ]);

        $store = $this->storeContext->resolve(
            $request->user(),
            $request->input('store_id')
        );

        $order = Order::findOrFail($validated['order_id']);
        $rider = Rider::findOrFail($validated['rider_id']);

        $result = $this->manualDispatch->dispatchToRider($order, $rider, $store);

        if (is_array($result)) {
            // dispatch failed — log dispatch_failed audit event
            $this->auditService->log(
                $request->user()->id,
                'dispatch_failed',
                'order',
                $validated['order_id'],
                ['rider_id' => $validated['rider_id'], 'reason' => $result['reason']]
            );

            return response()->json(['error' => $result['reason']], 422);
        }

        if (!$result->claimed) {
            $this->auditService->log(
                $request->user()->id,
                'dispatch_failed',
                'order',
                $validated['order_id'],
                ['rider_id' => $validated['rider_id'], 'reason' => 'order_already_claimed']
            );

            return response()->json(['error' => 'Order already claimed'], 422);
        }

        $this->auditService->logOrderDispatched(
            $request->user()->id,
            $validated['order_id'],
            $validated['rider_id']
        );

        return response()->json(['success' => true, 'order' => $result->order->fresh()]);
    }
}
