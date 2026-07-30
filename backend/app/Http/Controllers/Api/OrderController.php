<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Review;
use App\Services\DeliveryConfirmation;
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

    public function __construct(OrderStateMachine $stateMachine, RiderStatsRecorder $riderStats, DeliveryConfirmation $deliveryConfirmation, OrderIntake $orderIntake)
    {
        $this->stateMachine = $stateMachine;
        $this->riderStats = $riderStats;
        $this->deliveryConfirmation = $deliveryConfirmation;
        $this->orderIntake = $orderIntake;
    }

    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->with(['items', 'store', 'rider.user'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1|max:8',
            'delivery_address' => 'required|string',
            'delivery_latitude' => 'required|numeric|between:-90,90',
            'delivery_longitude' => 'required|numeric|between:-180,180',
            'delivery_notes' => 'nullable|string',
        ]);

        $result = $this->orderIntake->place($validated, $request->user());

        return response()->json(['data' => $result->order], 201);
    }

    public function show(int $id): JsonResponse
    {
        $order = Order::with(['items', 'store', 'rider.user', 'activityLogs.user', 'review'])
            ->findOrFail($id);

        return response()->json(['data' => $order]);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

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

        $confirmed = $this->deliveryConfirmation->confirm($order, $request->user());

        return response()->json(['data' => $confirmed]);
    }

    public function review(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        $order = Order::with('rider')->findOrFail($id);

        if ($order->customer_id !== $request->user()->id) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        if (!$order->rider_id) {
            return response()->json(['message' => 'No rider assigned to this order'], 422);
        }

        if ($order->review) {
            return response()->json(['message' => 'Already reviewed'], 422);
        }

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

        return response()->json(['data' => $order->fresh()], 201);
    }
}
