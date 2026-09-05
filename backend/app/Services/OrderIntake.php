<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Jobs\RetryDispatch;
use App\Models\Order;
use App\Models\Product;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderIntake
{
    private PricingService $pricingService;

    private OrderStateMachine $stateMachine;

    private DispatchService $dispatchService;

    private DispatchPolicy $dispatchPolicy;

    private OrderCartPolicy $cartPolicy;

    private StoreFulfillmentService $fulfillmentService;

    public function __construct(
        PricingService $pricingService,
        OrderStateMachine $stateMachine,
        DispatchService $dispatchService,
        DispatchPolicy $dispatchPolicy,
        OrderCartPolicy $cartPolicy,
        StoreFulfillmentService $fulfillmentService,
    ) {
        $this->pricingService = $pricingService;
        $this->stateMachine = $stateMachine;
        $this->dispatchService = $dispatchService;
        $this->dispatchPolicy = $dispatchPolicy;
        $this->cartPolicy = $cartPolicy;
        $this->fulfillmentService = $fulfillmentService;
    }

    public function place(array $validated, User $customer): OrderIntakeResult
    {
        return DB::transaction(function () use ($validated, $customer) {
            $subtotal = 0;
            $orderItems = [];

            // Consolidate duplicate product entries to enforce quantity caps
            $consolidated = [];
            foreach ($validated['items'] as $item) {
                $pid = (int) $item['product_id'];
                $consolidated[$pid] = ($consolidated[$pid] ?? 0) + (int) $item['quantity'];
            }

            foreach ($consolidated as $productId => $quantity) {
                $product = Product::with('specials')->findOrFail($productId);
                if (! $product->is_active) {
                    throw new \InvalidArgumentException("Product {$product->name} is not available");
                }
                if ($quantity > 8) {
                    throw new \InvalidArgumentException("Quantity for {$product->name} exceeds maximum of 8");
                }
                $price = $this->pricingService->effectivePrice($product, $product->specials);
                $total = $price * $quantity;
                $subtotal += $total;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'quantity' => $quantity,
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

            // Resolve fulfilment. Delivery orders resolve from the customer's
            // coordinates (nearest eligible store); pickup orders from the
            // store the customer chose (radius is irrelevant — they travel).
            $fulfilmentMethod = $validated['fulfilment_method'] ?? 'delivery';

            if ($fulfilmentMethod === 'pickup') {
                $fulfillmentResult = $this->fulfillmentService->resolveForPickup($consolidated, isset($validated['store_id']) ? (int) $validated['store_id'] : null);
            } else {
                $customerLat = (float) $validated['delivery_latitude'];
                $customerLng = (float) $validated['delivery_longitude'];
                $fulfillmentResult = $this->fulfillmentService->resolve($consolidated, $customerLat, $customerLng);
            }

            if (! $fulfillmentResult->success) {
                throw new \InvalidArgumentException($fulfillmentResult->reason ?? 'Cannot fulfill order from any store');
            }

            $fulfillmentStore = $fulfillmentResult->store;

            // The customer who collects pays no delivery fee.
            $deliveryFee = $fulfilmentMethod === 'pickup'
                ? 0.0
                : (float) config('dispatch.delivery_fee', 0);
            $total = $subtotal + $deliveryFee;

            // Retry order number generation on collision. The insert runs in a
            // nested transaction (savepoint) so a duplicate-key rollback doesn't
            // poison the outer transaction on databases like PostgreSQL where
            // any failed statement aborts the whole transaction.
            $attempts = 0;
            do {
                $orderNumber = 'CS-'.now()->format('Ymd').'-'.strtoupper(Str::random(4));
                try {
                    $order = DB::transaction(function () use ($orderNumber, $customer, $fulfillmentStore, $validated, $subtotal, $deliveryFee, $total) {
                        return Order::create([
                            'order_number' => $orderNumber,
                            'customer_id' => $customer->id,
                            'store_id' => $fulfillmentStore->id,
                            'status' => OrderStatus::Pending,
                            'payment_status' => PaymentStatus::Pending,
                            'payment_method' => $validated['payment_method'] ?? 'cash_on_delivery',
                            'fulfilment_method' => $fulfilmentMethod,
                            'delivery_address' => $fulfilmentMethod === 'delivery' ? $validated['delivery_address'] : null,
                            'delivery_latitude' => $fulfilmentMethod === 'delivery' ? $validated['delivery_latitude'] : null,
                            'delivery_longitude' => $fulfilmentMethod === 'delivery' ? $validated['delivery_longitude'] : null,
                            'delivery_notes' => $validated['delivery_notes'] ?? null,
                            'subtotal' => $subtotal,
                            'delivery_fee' => $deliveryFee,
                            'total' => $total,
                        ]);
                    });
                    break;
                } catch (QueryException $e) {
                    if (str_contains($e->getMessage(), 'order_number') && $attempts < 5) {
                        $attempts++;

                        continue;
                    }
                    throw $e;
                }
            } while (true);

            foreach ($orderItems as $oi) {
                $order->items()->create($oi);
            }

            // Validate real availability (stock minus reservations held by
            // other in-flight orders) under a row lock.
            $stockViolations = [];
            foreach ($consolidated as $productId => $quantity) {
                $sp = StoreProduct::where('store_id', $fulfillmentStore->id)
                    ->where('product_id', $productId)
                    ->lockForUpdate()
                    ->first();
                $available = $sp ? ($sp->stock_quantity - ($sp->reserved_quantity ?? 0)) : 0;
                if (! $sp || $available < $quantity) {
                    $product = Product::find($productId);
                    $stockViolations[] = ($product?->name ?? "Product #{$productId}")." (requested {$quantity}, available ".max(0, $available).')';
                }
            }
            if (! empty($stockViolations)) {
                throw new \InvalidArgumentException('Insufficient stock: '.implode('; ', $stockViolations));
            }

            $this->stateMachine->transition($order, OrderStatus::Confirmed, null, [
                'event_type' => EventType::OrderPlaced->value,
            ]);

            $dispatchedOrder = $order->fresh();

            // Pickup orders never enter the rider dispatch pipeline: the store
            // prepares the order and marks it Ready for collection (Ready →
            // Delivered closes the loop when the customer collects).
            if ($fulfilmentMethod === 'pickup') {
                if ($this->cartPolicy->shouldClearAfterPlacement($dispatchedOrder)) {
                    $customer->cartItems()->delete();
                }

                return new OrderIntakeResult(
                    order: $dispatchedOrder->fresh()->load('items'),
                    dispatchStatus: 'pickup',
                    claimLatencyMs: null,
                    riderId: null,
                    storeId: $dispatchedOrder->store_id,
                );
            }

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
