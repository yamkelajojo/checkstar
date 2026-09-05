<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Models\StoreProduct;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Reservation ledger reconciliation.
 *
 * reserved_quantity is a running counter maintained by claim/buy/cancel/
 * deliver — any drift (from a historical bug or a crashed transaction) makes
 * the store silently "run out" of stock. This command recomputes the expected
 * reservation for each store_product from the order items of in-flight orders
 * and corrects drift, reporting what it found.
 *
 * Expected reservation = SUM(quantity of order_items with bought_at IS NULL)
 *                        joined to active orders (confirmed/preparing/
 *                        out_for_delivery) for that store_product.
 */
class ReconcileReservations extends Command
{
    protected $signature = 'checkstar:reconcile-reservations
                            {--dry-run : Report drift without correcting it}';

    protected $description = 'Recompute store_product reserved_quantity from in-flight orders and correct drift';

    public function handle(): int
    {
        $activeStatuses = [
            OrderStatus::Confirmed->value,
            OrderStatus::Preparing->value,
            OrderStatus::OutForDelivery->value,
        ];

        $expected = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', $activeStatuses)
            ->whereNull('order_items.bought_at')
            ->whereNotNull('order_items.store_product_id')
            ->groupBy('order_items.store_product_id')
            ->select('order_items.store_product_id', DB::raw('SUM(order_items.quantity) as expected_reserved'))
            ->pluck('expected_reserved', 'store_product_id');

        $storeProducts = StoreProduct::query()
            ->where(function ($q) use ($expected) {
                $q->where('reserved_quantity', '>', 0)
                    ->orWhereIn('id', $expected->keys());
            })
            ->get();

        $drifted = 0;
        $totalReserved = 0;

        foreach ($storeProducts as $sp) {
            $expectedReserved = (int) ($expected[$sp->id] ?? 0);
            $totalReserved += $expectedReserved;

            if ((int) $sp->reserved_quantity === $expectedReserved) {
                continue;
            }

            $drifted++;
            $this->line(sprintf(
                'store_product #%d (store %d, product %d): reserved %d → expected %d',
                $sp->id,
                $sp->store_id,
                $sp->product_id,
                $sp->reserved_quantity,
                $expectedReserved,
            ));

            if (! $this->option('dry-run')) {
                $sp->reserved_quantity = $expectedReserved;
                $sp->save();
            }
        }

        if ($drifted === 0) {
            $this->info('Reservation ledger consistent ('.$totalReserved.' units reserved across active orders).');

            return self::SUCCESS;
        }

        $this->warn($drifted.' store_product row(s) drifted'
            .($this->option('dry-run') ? ' (dry run — nothing corrected)' : ' — corrected')
            .'. Outstanding reserved units: '.$totalReserved);

        return $this->option('dry-run') ? self::FAILURE : self::SUCCESS;
    }
}
