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

            // Use SKIP LOCKED to avoid blocking concurrent claimants (first-to-claim wins)
            try {
                $query = $query->skipLocked();
            } catch (\Throwable $e) {
                // Fallback for databases that don't support SKIP LOCKED (e.g. SQLite in tests)
            }

            $fresh = $query->first();

            if (! $fresh) {
                return false;
            }

            $this->stateMachine->transition($fresh, OrderStatus::Preparing, $rider->user, [
                'rider_id' => $rider->id,
                'store_id' => $store->id,
            ]);

            $fresh->rider_id = $rider->id;
            $fresh->store_id = $store->id;
            $fresh->save();

            $this->syncStoreProductIds($fresh);

            // Reserve inventory at claim time to prevent concurrent oversell
            $this->reserveInventory($fresh);

            return true;
        });

        $elapsed = (int) round((microtime(true) - $start) * 1000);

        return new ClaimResult($order->fresh(), $elapsed, $claimed);
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
