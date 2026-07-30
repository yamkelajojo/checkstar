<?php

namespace App\Http\Controllers\Api;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\Rider;
use App\Services\DispatchService;
use App\Services\OrderStateMachine;
use App\Services\PricingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    private OrderStateMachine $stateMachine;
    private DispatchService $dispatchService;
    private PricingService $pricingService;

    public function __construct(OrderStateMachine $stateMachine, DispatchService $dispatchService, PricingService $pricingService)
    {
        $this->stateMachine = $stateMachine;
        $this->dispatchService = $dispatchService;
        $this->pricingService = $pricingService;
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

        $user = $request->user();
        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $price = $this->pricingService->effectivePrice($product);
            $total = $price * $item['quantity'];
            $subtotal += $total;

            $orderItems[] = [
                'product_id' => $product->id,
                'quantity' => $item['quantity'],
                'unit_price' => $price,
                'total_price' => $total,
                'product_snapshot' => json_encode([
                    'name' => $product->name,
                    'image' => $product->image,
                    'unit' => $product->unit,
                    'slug' => $product->slug,
                ]),
            ];
        }

        $deliveryFee = 0;

        $order = Order::create([
            'order_number' => 'CS-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
            'customer_id' => $user->id,
            'store_id' => null,
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
            'delivery_address' => $validated['delivery_address'],
            'delivery_latitude' => $validated['delivery_latitude'],
            'delivery_longitude' => $validated['delivery_longitude'],
            'delivery_notes' => $validated['delivery_notes'] ?? null,
            'subtotal' => $subtotal,
            'delivery_fee' => $deliveryFee,
            'total' => $subtotal + $deliveryFee,
        ]);

        foreach ($orderItems as $oi) {
            $order->items()->create($oi);
        }

        $this->stateMachine->transition($order, OrderStatus::Confirmed, null, [
            'event_type' => EventType::OrderPlaced->value,
        ]);

        $this->dispatchService->dispatch($order->fresh());

        return response()->json(['data' => $order->fresh()->load('items')], 201);
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

        $this->stateMachine->canTransition($order->status, OrderStatus::Delivered);

        $order->customer_confirmed_at = now();
        $order->payment_status = PaymentStatus::Paid;
        $order->save();

        $order->activityLogs()->create([
            'event_type' => EventType::CustomerConfirmed->value,
            'user_id' => $request->user()->id,
            'old_status' => $order->status->value,
            'new_status' => $order->status->value,
            'metadata' => json_encode(['payment_status' => PaymentStatus::Paid->value]),
            'created_at' => now(),
        ]);

        return response()->json(['data' => $order->fresh()]);
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

        $order->rider->recalculateStats();

        return response()->json(['data' => $order->fresh()], 201);
    }
}
