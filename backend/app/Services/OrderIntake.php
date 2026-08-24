<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Jobs\RetryDispatch;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderIntake
{
    private PricingService $pricingService;
    private OrderStateMachine $stateMachine;
    private DispatchService $dispatchService;
    private DispatchPolicy $dispatchPolicy;
    private OrderCartPolicy $cartPolicy;

    public function __construct(PricingService $pricingService, OrderStateMachine $stateMachine, DispatchService $dispatchService, DispatchPolicy $dispatchPolicy, OrderCartPolicy $cartPolicy)
    {
        $this->pricingService = $pricingService;
        $this->stateMachine = $stateMachine;
        $this->dispatchService = $dispatchService;
        $this->dispatchPolicy = $dispatchPolicy;
        $this->cartPolicy = $cartPolicy;
    }

    public function place(array $validated, User $customer): OrderIntakeResult
    {
        return DB::transaction(function () use ($validated, $customer) {
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

            $order = Order::create([
                'order_number' => 'CS-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)),
                'customer_id' => $customer->id,
                'store_id' => null,
                'status' => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Pending,
                'payment_method' => $validated['payment_method'] ?? 'cash_on_delivery',
                'delivery_address' => $validated['delivery_address'],
                'delivery_latitude' => $validated['delivery_latitude'],
                'delivery_longitude' => $validated['delivery_longitude'],
                'delivery_notes' => $validated['delivery_notes'] ?? null,
                'subtotal' => $subtotal,
                'delivery_fee' => 0,
                'total' => $subtotal,
            ]);

            foreach ($orderItems as $oi) {
                $order->items()->create($oi);
            }

            $this->stateMachine->transition($order, OrderStatus::Confirmed, null, [
                'event_type' => EventType::OrderPlaced->value,
            ]);

            $dispatchedOrder = $order->fresh();
            $dispatchResult = $this->dispatchService->dispatch($dispatchedOrder);

            if ($this->cartPolicy->shouldClearAfterPlacement($dispatchedOrder)) {
                $customer->cartItems()->delete();
            }

            if ($dispatchResult['status'] === 'retrying') {
                RetryDispatch::dispatch($dispatchedOrder)
                    ->delay(now()->addSeconds($this->dispatchPolicy->retryIntervalSeconds()));
            }

            return new OrderIntakeResult(
                order: $dispatchedOrder->fresh()->load('items'),
                dispatchStatus: $dispatchResult['status'],
                claimLatencyMs: $dispatchResult['claim_latency_ms'] ?? null,
                riderId: $dispatchResult['rider_id'] ?? null,
                storeId: $dispatchResult['store_id'] ?? null,
            );
        });
    }
}