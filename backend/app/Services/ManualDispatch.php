<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\Rider;
use App\Models\Store;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Manual dispatch surface for Logistics Officers and Store Owners.
 * All assignments still flow through the atomic Order Claim path —
 * never a raw rider_id write.
 */
class ManualDispatch
{
    public function __construct(
        private OrderClaim $orderClaim,
        private DispatchPolicy $dispatchPolicy,
    ) {}

    /**
     * Confirmed/Retrying orders awaiting a rider whose delivery address falls
     * within the given Store's radius (i.e. this store would dispatch them).
     */
    public function pendingForStore(Store $store): Collection
    {
        // Bounding-box prefilter: everything outside the box is guaranteed
        // to be outside the haversine radius, so the exact filter below only
        // ever sees the store's own neighbourhood instead of every pending
        // order in the system (this endpoint is polled by the ops console).
        $radiusKm = (float) $store->delivery_radius_km;
        $latDelta = $radiusKm / 111.0;
        $lngDelta = $radiusKm / (111.0 * max(cos(deg2rad((float) $store->latitude)), 0.01));

        return Order::whereIn('status', [OrderStatus::Confirmed, OrderStatus::Retrying])
            ->whereNull('rider_id')
            ->whereNotNull('delivery_latitude')
            ->whereNotNull('delivery_longitude')
            ->where('delivery_latitude', '>=', (float) $store->latitude - $latDelta)
            ->where('delivery_latitude', '<=', (float) $store->latitude + $latDelta)
            ->where('delivery_longitude', '>=', (float) $store->longitude - $lngDelta)
            ->where('delivery_longitude', '<=', (float) $store->longitude + $lngDelta)
            ->with('items')
            ->orderBy('created_at')
            ->get()
            ->filter(function (Order $order) use ($store) {
                return $this->dispatchPolicy->eligibleStores(
                    (float) $order->delivery_latitude,
                    (float) $order->delivery_longitude,
                )->contains(fn (array $sd) => $sd['store']->id === $store->id);
            })
            ->values();
    }

    public function dispatchToRider(Order $order, Rider $rider, Store $contextStore): ClaimResult|array
    {
        if ($order->rider_id !== null || ! in_array($order->status, [OrderStatus::Confirmed, OrderStatus::Retrying], true)) {
            return ['reason' => 'order_not_claimable'];
        }

        // Pickup orders bypass the rider pipeline entirely (the customer
        // collects). The pending queue already hides them (null delivery
        // coords), but a direct API call must not be able to attach a rider.
        if ($order->fulfilment_method === 'pickup') {
            return ['reason' => 'order_is_pickup'];
        }

        // Guard against cross-store hijack: an operator may only dispatch
        // orders that belong to their own store (or are unassigned). Without
        // this, a Store A operator could assign a Store A rider to Store B's
        // pending order, effectively stealing it.
        if ($order->store_id !== null && (int) $order->store_id !== (int) $contextStore->id) {
            return ['reason' => 'order_wrong_store'];
        }

        if (! $this->riderEligible($rider) || $rider->store_id !== $contextStore->id) {
            return ['reason' => 'rider_not_eligible'];
        }

        if ($this->orderClaim->riderAtOrderLimit($rider)) {
            return ['reason' => 'rider_at_capacity'];
        }

        // Manual dispatch must respect the same geographic rules as auto-dispatch
        if ($order->delivery_latitude !== null && $order->delivery_longitude !== null) {
            $distance = GeoUtils::haversineDistance(
                (float) $order->delivery_latitude,
                (float) $order->delivery_longitude,
                (float) $contextStore->latitude,
                (float) $contextStore->longitude,
            );
            if ($distance > (float) $contextStore->delivery_radius_km) {
                return ['reason' => 'order_outside_store_radius'];
            }
            if ((float) $rider->max_radius_km < $distance) {
                return ['reason' => 'rider_radius_exceeded'];
            }
        }

        return $this->orderClaim->claim($order, $rider, $contextStore);
    }

    /**
     * Assign a rider to an order by IDs. Resolves models internally so
     * controllers don't need to touch Order/Rider directly.
     */
    public function assignByIds(int $orderId, int $riderId, Store $contextStore): ClaimResult|array
    {
        $order = Order::findOrFail($orderId);
        $rider = Rider::findOrFail($riderId);

        return $this->dispatchToRider($order, $rider, $contextStore);
    }

    public function reassign(Order $order, Rider $newRider): Order|array
    {
        if ($order->status !== OrderStatus::Preparing || $order->rider_id === null) {
            return ['reason' => 'order_not_reassignable'];
        }

        if (! $this->riderEligible($newRider) || $newRider->store_id !== $order->store_id) {
            return ['reason' => 'rider_not_eligible'];
        }

        // Reassignment must respect the same concurrency cap as claims and
        // auto-dispatch — the new rider is taking on another active order.
        if ($this->orderClaim->riderAtOrderLimit($newRider)) {
            return ['reason' => 'rider_at_capacity'];
        }

        return DB::transaction(function () use ($order, $newRider) {
            $fresh = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $previousRiderId = $fresh->rider_id;

            $fresh->rider_id = $newRider->id;
            $fresh->save();

            OrderActivityLog::create([
                'order_id' => $fresh->id,
                'user_id' => null,
                'event_type' => EventType::RiderAssigned->value,
                'old_status' => $fresh->status->value,
                'new_status' => $fresh->status->value,
                'metadata' => [
                    'reassigned_from' => $previousRiderId,
                    'reassigned_to' => $newRider->id,
                ],
                'created_at' => now(),
            ]);

            return $fresh;
        });
    }

    private function riderEligible(Rider $rider): bool
    {
        // A deactivated rider account cannot call any rider endpoint
        // (EnsureUserIsActive 403s) — never hand orders to one. Mirrors the
        // auto-dispatch policy.
        if (! $rider->is_available || $rider->suspended_at !== null) {
            return false;
        }

        return (bool) ($rider->user()->first()->is_active ?? false);
    }
}
