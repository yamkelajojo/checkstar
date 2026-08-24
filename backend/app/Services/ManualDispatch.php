<?php

namespace App\Services;

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
    ) {
    }

    /**
     * Confirmed/Retrying orders awaiting a rider whose delivery address falls
     * within the given Store's radius (i.e. this store would dispatch them).
     */
    public function pendingForStore(Store $store): Collection
    {
        return Order::whereIn('status', [OrderStatus::Confirmed, OrderStatus::Retrying])
            ->whereNull('rider_id')
            ->whereNotNull('delivery_latitude')
            ->whereNotNull('delivery_longitude')
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
        if ($order->rider_id !== null || !in_array($order->status, [OrderStatus::Confirmed, OrderStatus::Retrying], true)) {
            return ['reason' => 'order_not_claimable'];
        }

        if (!$this->riderEligible($rider) || $rider->store_id !== $contextStore->id) {
            return ['reason' => 'rider_not_eligible'];
        }

        return $this->orderClaim->claim($order, $rider, $contextStore);
    }

    public function reassign(Order $order, Rider $newRider): Order|array
    {
        if ($order->status !== OrderStatus::Preparing || $order->rider_id === null) {
            return ['reason' => 'order_not_reassignable'];
        }

        if (!$this->riderEligible($newRider) || $newRider->store_id !== $order->store_id) {
            return ['reason' => 'rider_not_eligible'];
        }

        return DB::transaction(function () use ($order, $newRider) {
            $fresh = Order::whereKey($order->id)->lockForUpdate()->firstOrFail();
            $previousRiderId = $fresh->rider_id;

            $fresh->rider_id = $newRider->id;
            $fresh->save();

            OrderActivityLog::create([
                'order_id' => $fresh->id,
                'user_id' => null,
                'event_type' => 'rider_assigned',
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
        return $rider->is_available && $rider->suspended_at === null;
    }
}
