<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\PlaceOrderRequest;
use App\Http\Requests\ReviewRequest;
use App\Models\Order;
use App\Services\DeliveryConfirmation;
use App\Services\OrderCancellationPolicy;
use App\Services\OrderIntake;
use App\Services\OrderStateMachine;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    private OrderStateMachine $stateMachine;
    private DeliveryConfirmation $deliveryConfirmation;
    private OrderIntake $orderIntake;
    private OrderCancellationPolicy $cancellationPolicy;
    private ReviewService $reviewService;

    public function __construct(OrderStateMachine $stateMachine, DeliveryConfirmation $deliveryConfirmation, OrderIntake $orderIntake, OrderCancellationPolicy $cancellationPolicy, ReviewService $reviewService)
    {
        $this->stateMachine = $stateMachine;
        $this->deliveryConfirmation = $deliveryConfirmation;
        $this->orderIntake = $orderIntake;
        $this->cancellationPolicy = $cancellationPolicy;
        $this->reviewService = $reviewService;
    }

    public function index(Request $request): JsonResponse
    {
        $perPage = $request->has('per_page')
            ? max(1, min((int) $request->query('per_page'), 100))
            : 50;

        $paginator = $request->user()->orders()
            ->with(['items', 'store', 'rider.user'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->orderBy('created_at', $request->query('sort') === 'oldest' ? 'asc' : 'desc')
            ->paginate($perPage);

        $paginator->getCollection()->each(fn (Order $order) => $this->appendCanCancel($order));

        // Preserve wrapper shape for frontend/mobile; add pagination meta
        if ($request->has('per_page') || $request->has('page')) {
            return response()->json($paginator);
        }

        return response()->json(['data' => $paginator->items(), 'meta' => [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]]);
    }

    public function store(PlaceOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $result = $this->orderIntake->place($validated, $request->user());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            return response()->json(['message' => 'Could not place order'], 500);
        }

        $order = $result->order->load('rider.user', 'store');

        return response()->json([
            'data' => $order,
            'dispatch' => [
                'status' => $result->dispatchStatus,
                'claim_latency_ms' => $result->claimLatencyMs,
                'rider_id' => $result->riderId,
                'store_id' => $result->storeId,
                'rider_name' => $order->rider?->user?->name,
                'store_name' => $order->store?->name,
            ],
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::with(['items', 'store', 'rider.user', 'activityLogs.user', 'review'])
            ->findOrFail($id);

        if ($request->user()->cannot('view', $order)) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        $this->appendCanCancel($order);

        return response()->json(['data' => $order]);
    }

    private function appendCanCancel(Order $order): void
    {
        $order->can_cancel = $this->cancellationPolicy->customerCanCancel($order);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        if ($request->user()->cannot('cancel', $order)) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        if (!$this->cancellationPolicy->customerCanCancel($order)) {
            return response()->json([
                'message' => 'This order can no longer be cancelled',
                'reason' => 'order_not_cancellable',
                'status' => $order->status->value,
            ], 409);
        }

        $this->stateMachine->transition(
            $order,
            OrderStatus::Cancelled,
            $request->user(),
            ['reason' => $request->input('reason', 'Customer requested cancellation')]
        );

        return response()->json(['data' => $order->fresh()]);
    }

    public function confirmDelivery(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        if ($request->user()->cannot('confirmDelivery', $order)) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        try {
            $confirmed = $this->deliveryConfirmation->confirm($order, $request->user());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage(), 'reason' => 'invalid_transition'], 409);
        }

        return response()->json(['data' => $confirmed]);
    }

    public function review(ReviewRequest $request, int $id): JsonResponse
    {
        $validated = $request->validated();

        $order = Order::findOrFail($id);

        if ($request->user()->cannot('review', $order)) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        $result = $this->reviewService->submitReview(
            $request->user(),
            $id,
            $validated['rating'],
            $validated['comment'] ?? null,
        );

        if (!$result['success']) {
            return response()->json(['message' => $result['message']], 422);
        }

        return response()->json(['data' => $result['order']], 201);
    }
}
