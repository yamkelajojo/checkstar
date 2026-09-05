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

            $this->syncAndReserveInventory($fresh);

            return true;
        });

        $elapsed = (int) round((microtime(true) - $start) * 1000);

        return new ClaimResult($order->fresh(), $elapsed, $claimed);
    }

    /**
     * True when the rider already holds the maximum number of active orders
     * (confirmed/preparing/out_for_delivery) allowed by dispatch policy.
     * Shared with ManualDispatch::reassign so every assignment path enforces
     * the same concurrency policy.
     */
    public function riderAtOrderLimit(Rider $rider): bool
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

    /**
     * Bind each order item to the fulfilling store's stock row and reserve
     * the quantities, in ONE locked query. Reservations are clamped to the
     * physical stock: several orders can be placed against the same stock
     * before any is claimed (placement checks availability but does not
     * reserve), so a blind increment could push reserved_quantity past
     * stock_quantity — a hard CHECK-constraint failure on MySQL that would
     * abort the claim. The buy-time stock check still guards the customer,
     * so clamping only affects the soft counter, never what is handed over.
     */
    private function syncAndReserveInventory(Order $order): void
    {
        $productIds = $order->items->pluck('product_id')->unique()->all();
        if ($productIds === []) {
            return;
        }

        $storeProducts = StoreProduct::where('store_id', $order->store_id)
            ->whereIn('product_id', $productIds)
            ->lockForUpdate()
            ->get()
            ->keyBy('product_id');

        foreach ($order->items as $item) {
            $sp = $storeProducts->get($item->product_id);
            if (! $sp) {
                continue;
            }

            if ((int) $item->store_product_id !== $sp->id) {
                $item->store_product_id = $sp->id;
                $item->save();
            }

            $sp->reserved_quantity = min(
                (int) $sp->stock_quantity,
                (int) ($sp->reserved_quantity ?? 0) + (int) $item->quantity,
            );
            $sp->save();
        }
    }
}
