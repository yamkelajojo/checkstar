<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;
use Illuminate\Support\Facades\DB;

class OrderClaim
{
    private OrderStateMachine $stateMachine;

    public function __construct(OrderStateMachine $stateMachine)
    {
        $this->stateMachine = $stateMachine;
    }

    public function claim(Order $order, Rider $rider, Store $store): ClaimResult
    {
        $start = microtime(true);

        $claimed = DB::transaction(function () use ($order, $rider, $store) {
            $query = Order::where('id', $order->id)
                ->whereNull('rider_id')
                ->whereIn('status', [OrderStatus::Confirmed, OrderStatus::Retrying])
                ->lockForUpdate();

            // SKIP LOCKED lets concurrent claimants race without blocking —
            // first to claim wins. Not supported by SQLite (tests), so only
            // request it on databases that implement it.
            if (in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb', 'pgsql'], true)) {
                $query = $query->lock('FOR UPDATE SKIP LOCKED');
            }

            $fresh = $query->first();

            if (! $fresh) {
                return false;
            }

            // Lock the rider row and enforce the per-rider concurrency cap.
            // Without this, dispatch selects the same "available" rider for
            // every pending order and the rider accumulates an unbounded
            // number of simultaneous orders.
            $lockedRider = Rider::where('id', $rider->id)->lockForUpdate()->first();
            if (! $lockedRider || $this->riderAtOrderLimit($lockedRider)) {
                return false;
            }

            $this->stateMachine->transition($fresh, OrderStatus::Preparing, $lockedRider->user, [
                'rider_id' => $lockedRider->id,
                'store_id' => $store->id,
            ]);

            $fresh->rider_id = $lockedRider->id;
            $fresh->store_id = $store->id;
            $fresh->save();

            $this->syncStoreProductIds($fresh);

            // Reserve inventory at claim time so concurrent orders see the
            // reserved quantity during placement/fulfillment checks.
            $this->reserveInventory($fresh);

            return true;
        });

        $elapsed = (int) round((microtime(true) - $start) * 1000);

        return new ClaimResult($order->fresh(), $elapsed, $claimed);
    }

    /**
     * True when the rider already holds the maximum number of active orders
     * (confirmed/preparing/out_for_delivery) allowed by dispatch policy.
     */
    private function riderAtOrderLimit(Rider $rider): bool
    {
        $max = (int) config('dispatch.max_concurrent_orders_per_rider', 1);

        if ($max < 1) {
            return false; // Unlimited batching explicitly configured
        }

        $active = Order::where('rider_id', $rider->id)
            ->whereIn('status', [OrderStatus::Confirmed, OrderStatus::Preparing, OrderStatus::OutForDelivery])
            ->count();

        return $active >= $max;
    }

    private function reserveInventory(Order $order): void
    {
        foreach ($order->items as $item) {
            $storeProductId = $item->store_product_id;
            if ($storeProductId) {
                $sp = StoreProduct::where('id', $storeProductId)->lockForUpdate()->first();
                if ($sp) {
                    $sp->reserved_quantity += $item->quantity;
                    $sp->save();
                }
            }
        }
    }

    private function syncStoreProductIds(Order $order): void
    {
        foreach ($order->items as $item) {
            $sp = StoreProduct::where('store_id', $order->store_id)
                ->where('product_id', $item->product_id)
                ->first();
            if ($sp) {
                $item->store_product_id = $sp->id;
                $item->save();
            }
        }
    }
}
