<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\GameEvent;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;
use Illuminate\Support\Facades\DB;

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
        if (! $rider->is_available || $rider->suspended_at !== null) {
            return null;
        }

        $order = Order::findOrFail($orderId);

        if ($order->rider_id !== null || ! in_array($order->status, [OrderStatus::Confirmed, OrderStatus::Retrying], true)) {
            return null;
        }

        // Pickup orders have no rider in their lifecycle at all.
        if ($order->fulfilment_method === 'pickup') {
            return null;
        }

        // For retrying orders store_id is null until claimed; allow any rider if order has no store
        // For confirmed orders with store_id set, enforce rider's store matches
        if ($order->store_id !== null && $order->store_id !== $rider->store_id) {
            return null;
        }

        // For null store_id (retrying/unassigned), validate rider's store is eligible for delivery location
        if ($order->store_id === null) {
            $policy = app(DispatchPolicy::class);
            $eligible = $policy->eligibleStores((float) $order->delivery_latitude, (float) $order->delivery_longitude);
            if (! $eligible->contains(fn ($sd) => $sd['store']->id === $rider->store_id)) {
                return null;
            }
            // Also ensure rider is eligible (available, radius, not suspended)
            $store = Store::find($rider->store_id);
            if (! $store) {
                return null;
            }
            $distanceEntry = $eligible->firstWhere(fn ($sd) => $sd['store']->id === $rider->store_id);
            $distance = $distanceEntry['distance_km'] ?? 0;
            $eligibleRider = $policy->eligibleRider($store, (float) $distance);
            if (! $eligibleRider || $eligibleRider->id !== $rider->id) {
                return null;
            }
        }

        $store = Store::find($rider->store_id);
        if (! $store) {
            return null;
        }

        $claimResult = $this->orderClaim->claim($order, $rider, $store);

        return $claimResult->claimed ? $claimResult->order : null;
    }

    /**
     * Mark specific order items as bought at the store.
     *
     * Idempotency is per ITEM (order_items.bought_at flips from NULL inside a
     * conditional UPDATE), so:
     *  - partial batches can be continued in later calls,
     *  - concurrent calls cannot double-decrement stock (the conditional
     *    UPDATE only matches rows still unbought),
     *  - reserved quantity is released and stock decremented atomically.
     */
    public function markItemsBought(Rider $rider, int $orderId, ?array $itemIds = null): Order
    {
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        $itemsToProcess = $itemIds !== null && $itemIds !== []
            ? $order->items->whereIn('id', $itemIds)
            : $order->items;

        if ($itemsToProcess->isEmpty()) {
            return $order;
        }

        $marked = DB::transaction(function () use ($order, $itemsToProcess) {
            $marked = collect();
            $insufficient = [];

            foreach ($itemsToProcess as $item) {
                // Resolve store_product_id if missing
                if (! $item->store_product_id) {
                    $spLookup = StoreProduct::where('store_id', $order->store_id)
                        ->where('product_id', $item->product_id)
                        ->first();
                    if ($spLookup) {
                        $item->store_product_id = $spLookup->id;
                        $item->save();
                    }
                }

                if (! $item->store_product_id) {
                    continue;
                }

                // Claim the item atomically: the conditional UPDATE only matches
                // rows still unbought, so concurrent calls and repeat calls can
                // never decrement stock twice for the same item.
                $claimed = OrderItem::where('id', $item->id)
                    ->whereNull('bought_at')
                    ->update(['bought_at' => now()]) > 0;

                if (! $claimed) {
                    continue; // Already bought (earlier call or lost race)
                }

                $sp = StoreProduct::where('id', $item->store_product_id)->lockForUpdate()->first();
                if (! $sp) {
                    continue;
                }
                if (! $sp->is_available) {
                    $insufficient[] = "Product {$sp->product_id} is not available at this store";

                    continue;
                }
                if ($sp->stock_quantity < $item->quantity) {
                    $insufficient[] = "Insufficient stock for product {$sp->product_id}";

                    continue;
                }

                // Release this item's reservation and decrement stock. The item
                // is bought exactly once (guarded above), so this runs at most
                // once per item.
                $sp->reserved_quantity = max(0, ($sp->reserved_quantity ?? 0) - $item->quantity);
                $sp->decrement('stock_quantity', $item->quantity);
                $sp->save();

                $marked->push($item);
            }

            // Fail the whole batch if any requested item could not be bought —
            // the rider needs to know the pick failed. Everything rolls back
            // (bought_at flags included), so state stays consistent.
            if (! empty($insufficient)) {
                throw new \InvalidArgumentException(implode('; ', $insufficient));
            }

            if ($marked->isNotEmpty()) {
                $order->activityLogs()->create([
                    'event_type' => EventType::ItemsBought->value,
                    'user_id' => $order->rider->user_id,
                    'old_status' => $order->status->value,
                    'new_status' => $order->status->value,
                    'metadata' => [
                        'item_ids' => $marked->pluck('id')->values()->all(),
                    ],
                    'created_at' => now(),
                ]);
            }

            return $marked;
        });

        return $order->fresh(['items']);
    }


    public function advanceStatus(Rider $rider, int $orderId, OrderStatus $to): Order
    {
        $order = Order::where('id', $orderId)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        // Riders must physically buy the items before leaving the store —
        // this keeps stock decrements and the delivered state in sync and
        // prevents reservations from being silently abandoned. Only items
        // that map to store inventory are enforced (untracked items cannot
        // be bought at a store).
        if ($to === OrderStatus::OutForDelivery) {
            $unbought = $order->items()
                ->whereNull('bought_at')
                ->whereNotNull('store_product_id')
                ->count();
            if ($unbought > 0) {
                throw new \InvalidArgumentException(
                    "Cannot leave the store: {$unbought} item(s) have not been marked as bought"
                );
            }
        }

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
