<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\GameEvent;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;

class RiderOrderService
{
    private OrderStateMachine $stateMachine;
    private GamificationService $gamification;
    private OrderClaim $orderClaim;

    public function __construct(OrderStateMachine $stateMachine, GamificationService $gamification, OrderClaim $orderClaim)
    {
        $this->stateMachine = $stateMachine;
        $this->gamification = $gamification;
        $this->orderClaim = $orderClaim;
    }

    public function claim(Rider $rider, int $orderId): ?Order
    {
        if (!$rider->is_available || $rider->suspended_at !== null) {
            return null;
        }

        $order = Order::findOrFail($orderId);

        if ($order->rider_id !== null || !in_array($order->status, [OrderStatus::Confirmed, OrderStatus::Retrying], true)) {
            return null;
        }

        // For retrying orders store_id is null until claimed; allow any rider if order has no store
        // For confirmed orders with store_id set, enforce rider's store matches
        if ($order->store_id !== null && $order->store_id !== $rider->store_id) {
            return null;
        }

        // For null store_id (retrying/unassigned), validate rider's store is eligible for delivery location
        if ($order->store_id === null) {
            $policy = app(\App\Services\DispatchPolicy::class);
            $eligible = $policy->eligibleStores((float) $order->delivery_latitude, (float) $order->delivery_longitude);
            if (!$eligible->contains(fn ($sd) => $sd['store']->id === $rider->store_id)) {
                return null;
            }
            // Also ensure rider is eligible (available, radius, not suspended)
            $store = Store::find($rider->store_id);
            if (!$store) {
                return null;
            }
            $distanceEntry = $eligible->firstWhere(fn ($sd) => $sd['store']->id === $rider->store_id);
            $distance = $distanceEntry['distance_km'] ?? 0;
            $eligibleRider = $policy->eligibleRider($store, (float) $distance);
            if (!$eligibleRider || $eligibleRider->id !== $rider->id) {
                return null;
            }
        }

        $store = Store::find($rider->store_id);
        if (!$store) {
            return null;
        }

        $claimResult = $this->orderClaim->claim($order, $rider, $store);

        return $claimResult->claimed ? $claimResult->order : null;
    }

    public function markItemsBought(Rider $rider, int $orderId): Order
    {
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        // Prevent double-decrement: if already marked, return early
        $alreadyBought = $order->activityLogs()->where('event_type', EventType::ItemsBought->value)->exists();
        if ($alreadyBought) {
            return $order;
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                // Resolve store_product_id if missing
                $storeProductId = $item->store_product_id;
                if (!$storeProductId) {
                    $spLookup = StoreProduct::where('store_id', $order->store_id)
                        ->where('product_id', $item->product_id)
                        ->first();
                    if ($spLookup) {
                        $item->store_product_id = $spLookup->id;
                        $item->save();
                        $storeProductId = $spLookup->id;
                    }
                }

                if ($storeProductId) {
                    $sp = StoreProduct::where('id', $storeProductId)->lockForUpdate()->first();
                    if ($sp) {
                        if (!$sp->is_available) {
                            throw new \InvalidArgumentException("Product {$sp->product_id} is not available at this store");
                        }
                        if ($sp->stock_quantity < $item->quantity) {
                            throw new \InvalidArgumentException("Insufficient stock for product {$sp->product_id}");
                        }
                        $sp->decrement('stock_quantity', $item->quantity);
                    }
                }
            }

            $order->activityLogs()->create([
                'event_type' => EventType::ItemsBought->value,
                'user_id' => $order->rider->user_id,
                'old_status' => $order->status->value,
                'new_status' => $order->status->value,
                'created_at' => now(),
            ]);
        });

        return $order->fresh();
    }

    public function advanceStatus(Rider $rider, int $orderId, OrderStatus $to): Order
    {
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        $freshRider = Rider::where('id', $rider->id)->lockForUpdate()->first();
        $wasFirstDelivery = ($freshRider->total_deliveries ?? 0) === 0;

        $this->stateMachine->transition($order, $to, $rider->user);

        if ($to === OrderStatus::Delivered) {
            $this->gamification->handleEvent($freshRider, GameEvent::DeliveryCompleted);
            if ($wasFirstDelivery) {
                $this->gamification->handleEvent($freshRider->fresh(), GameEvent::FirstDelivery);
            }
        }

        return $order->fresh();
    }
}
