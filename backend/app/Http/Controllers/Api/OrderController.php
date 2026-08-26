<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Enums\GameEvent;
use App\Services\DeliveryConfirmation;
use App\Services\GamificationService;
use App\Services\OrderCancellationPolicy;
use App\Services\OrderIntake;
use App\Services\OrderStateMachine;
use App\Services\RiderStatsRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    private OrderStateMachine $stateMachine;
    private RiderStatsRecorder $riderStats;
    private DeliveryConfirmation $deliveryConfirmation;
    private OrderIntake $orderIntake;
    private OrderCancellationPolicy $cancellationPolicy;
    private GamificationService $gamification;

    public function __construct(OrderStateMachine $stateMachine, RiderStatsRecorder $riderStats, DeliveryConfirmation $deliveryConfirmation, OrderIntake $orderIntake, OrderCancellationPolicy $cancellationPolicy, GamificationService $gamification)
    {
        $this->stateMachine = $stateMachine;
        $this->riderStats = $riderStats;
        $this->deliveryConfirmation = $deliveryConfirmation;
        $this->orderIntake = $orderIntake;
        $this->cancellationPolicy = $cancellationPolicy;
        $this->gamification = $gamification;
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

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:8',
            'delivery_address' => 'required|string|max:500',
            'delivery_latitude' => 'required|numeric|between:-90,90',
            'delivery_longitude' => 'required|numeric|between:-180,180',
            'delivery_notes' => 'nullable|string|max:1000',
            'payment_method' => 'nullable|in:cash_on_delivery',
        ]);

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

    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $order = Order::with('rider')->findOrFail($id);

        if ($request->user()->cannot('review', $order)) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        if (!$order->rider_id) {
            return response()->json(['message' => 'No rider assigned to this order'], 422);
        }

        if ($order->status !== \App\Enums\OrderStatus::Delivered) {
            return response()->json(['message' => 'Order must be delivered before reviewing'], 422);
        }

        if ($order->review) {
            return response()->json(['message' => 'Already reviewed'], 422);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($order, $request, $validated) {
            Review::create([
                'order_id' => $order->id,
                'reviewer_id' => $request->user()->id,
                'rider_id' => $order->rider_id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            $order->rider_rating = $validated['rating'];
            $order->rider_review = $validated['comment'] ?? null;
            $order->save();

            $this->riderStats->recordReview($order->rider, $validated['rating']);
            $this->gamification->handleEvent($order->rider->fresh(), GameEvent::RatingReceived);
        });

        return response()->json(['data' => $order->fresh()], 201);
    }
}
