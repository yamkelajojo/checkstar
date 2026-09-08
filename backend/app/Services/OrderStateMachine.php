<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Events\OrderStatusChanged;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\StoreProduct;
use App\Models\User;
use InvalidArgumentException;

class OrderStateMachine
{
    private static array $transitions = [];

    private static function map(): array
    {
        if (! empty(self::$transitions)) {
            return self::$transitions;
        }

        self::$transitions = [
            OrderStatus::Pending->value => [OrderStatus::Confirmed->value, OrderStatus::Cancelled->value],
            OrderStatus::Confirmed->value => [OrderStatus::Preparing->value, OrderStatus::Retrying->value, OrderStatus::Cancelled->value],
            OrderStatus::Retrying->value => [OrderStatus::Preparing->value, OrderStatus::Cancelled->value],
            OrderStatus::Preparing->value => [
                // Delivery orders go out with a rider; pickup orders become
                // Ready for the customer to collect.
                OrderStatus::OutForDelivery->value,
                OrderStatus::Ready->value,
                OrderStatus::Cancelled->value,
            ],
            OrderStatus::Ready->value => [OrderStatus::Delivered->value, OrderStatus::Cancelled->value],
            OrderStatus::OutForDelivery->value => [OrderStatus::Delivered->value, OrderStatus::Cancelled->value],
            OrderStatus::Delivered->value => [],
            OrderStatus::Cancelled->value => [],
        ];

        return self::$transitions;
    }

    private static function toEventType(OrderStatus $to, ?Order $order = null): EventType
    {
        return match ($to) {
            OrderStatus::Confirmed => EventType::OrderConfirmed,
            OrderStatus::Retrying => EventType::DispatchRetrying,
            // Preparing means "rider assigned" only for delivery orders; a
            // pickup order entering preparation has no rider in its story.
            OrderStatus::Preparing => ($order !== null && $order->fulfilment_method === 'pickup')
                ? EventType::OrderPreparing
                : EventType::RiderAssigned,
            OrderStatus::Ready => EventType::OrderReady,
            OrderStatus::OutForDelivery => EventType::OutForDelivery,
            OrderStatus::Delivered => EventType::Delivered,
            OrderStatus::Cancelled => EventType::Cancelled,
            OrderStatus::Pending => EventType::OrderPlaced,
        };
    }

    public function canTransition(OrderStatus $from, OrderStatus $to, ?Order $order = null): bool
    {
        $allowed = self::map()[$from->value] ?? [];

        // Pickup orders can jump straight from Confirmed to Ready — a packed
        // order waits for collection with no rider leg in between. Delivery
        // orders must always pass through Preparing (rider dispatch).
        if ($from === OrderStatus::Confirmed && $to === OrderStatus::Ready) {
            return $order !== null && $order->fulfilment_method === 'pickup';
        }

        return in_array($to->value, $allowed, true);
    }

    public function transition(Order $order, OrderStatus $to, ?User $actor = null, array $metadata = []): OrderActivityLog
    {
        $from = $order->status;

        if ($from === $to) {
            throw new InvalidArgumentException("Order is already in status: {$to->value}");
        }

        if (! $this->canTransition($from, $to, $order)) {
            throw new InvalidArgumentException(
                "Cannot transition from {$from->value} to {$to->value}"
            );
        }

        $eventType = self::toEventType($to, $order);

        // Compare-and-swap: only transition when the persisted row is still in
        // the status the caller believes it is. A stale caller (rider/store
        // screen that loaded the order before another worker cancelled it)
        // must never overwrite the committed status. The single conditional
        // UPDATE is atomic even outside an explicit transaction, so a losing
        // transition throws instead of silently "winning".
        $now = now();
        $transitioned = Order::whereKey($order->getKey())
            ->where('status', $from->value)
            ->update(['status' => $to->value, 'updated_at' => $now]);

        if ($transitioned !== 1) {
            throw new InvalidArgumentException(
                "Order status changed concurrently; cannot transition from {$from->value} to {$to->value}"
            );
        }

        // Keep the in-memory model consistent with the write so callers see
        // the transitioned status without a refetch, but stop a later save()
        // from re-writing an already-committed status.
        $order->status = $to;
        $order->updated_at = $now;
        $order->syncOriginalAttribute('status');
        $order->syncOriginalAttribute('updated_at');

        // Release reserved inventory for items never bought (reclaim reservations).
        // Runs on cancellation AND delivery so reservations can never leak:
        //  - Cancelled: unbought items go back to the sellable pool; bought
        //    items keep their (already released) state.
        //  - Delivered: any item that somehow reached delivery without being
        //    marked bought releases its reservation here.
        if (in_array($to, [OrderStatus::Cancelled, OrderStatus::Delivered], true)) {
            $this->releaseRemainingReservations($order);
        }

        OrderStatusChanged::dispatch($order, $from->value, $to->value);

        $log = OrderActivityLog::create([
            'order_id' => $order->id,
            'user_id' => $actor?->id,
            'event_type' => $eventType->value,
            'old_status' => $from->value,
            'new_status' => $to->value,
            'metadata' => ! empty($metadata) ? $metadata : null,
            'created_at' => now(),
        ]);

        return $log;
    }

    /**
     * Release reservations for order items that were never bought.
     * Bought items already had their reservation released at buy time, so
     * releasing them again here would corrupt accounting for other orders.
     */
    private function releaseRemainingReservations(Order $order): void
    {
        foreach ($order->items as $item) {
            if ($item->bought_at !== null) {
                continue;
            }

            $storeProductId = $item->store_product_id;
            if ($storeProductId) {
                $sp = StoreProduct::where('id', $storeProductId)->lockForUpdate()->first();
                if ($sp) {
                    $sp->reserved_quantity = max(0, ($sp->reserved_quantity ?? 0) - $item->quantity);
                    $sp->save();
                }
            }
        }
    }
}
