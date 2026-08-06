<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
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

    public function __construct(PricingService $pricingService, OrderStateMachine $stateMachine, DispatchService $dispatchService)
    {
        $this->pricingService = $pricingService;
        $this->stateMachine = $stateMachine;
        $this->dispatchService = $dispatchService;
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

            $dispatchResult = $this->dispatchService->dispatch($order->fresh());

            $customer->cartItems()->delete();

            return new OrderIntakeResult(
                order: $order->fresh()->load('items'),
                dispatchStatus: $dispatchResult['status'],
                claimLatencyMs: $dispatchResult['claim_latency_ms'] ?? null,
                riderId: $dispatchResult['rider_id'] ?? null,
                storeId: $dispatchResult['store_id'] ?? null,
            );
        });
    }
}