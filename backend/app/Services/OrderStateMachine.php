<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\User;
use InvalidArgumentException;

class OrderStateMachine
{
    private static array $transitions = [];

    private static function map(): array
    {
        if (!empty(self::$transitions)) {
            return self::$transitions;
        }

        self::$transitions = [
            OrderStatus::Pending->value => [OrderStatus::Confirmed->value, OrderStatus::Cancelled->value],
            OrderStatus::Confirmed->value => [OrderStatus::Preparing->value, OrderStatus::Cancelled->value],
            OrderStatus::Preparing->value => [OrderStatus::OutForDelivery->value, OrderStatus::Cancelled->value],
            OrderStatus::OutForDelivery->value => [OrderStatus::Delivered->value],
            OrderStatus::Delivered->value => [],
            OrderStatus::Cancelled->value => [],
        ];

        return self::$transitions;
    }

    private static function toEventType(OrderStatus $to): EventType
    {
        return match ($to) {
            OrderStatus::Confirmed => EventType::OrderConfirmed,
            OrderStatus::Preparing => EventType::RiderAssigned,
            OrderStatus::OutForDelivery => EventType::OutForDelivery,
            OrderStatus::Delivered => EventType::Delivered,
            OrderStatus::Cancelled => EventType::Cancelled,
            OrderStatus::Pending => EventType::OrderPlaced,
        };
    }

    public function canTransition(OrderStatus $from, OrderStatus $to): bool
    {
        $allowed = self::map()[$from->value] ?? [];
        return in_array($to->value, $allowed, true);
    }

    public function transition(Order $order, OrderStatus $to, ?User $actor = null, array $metadata = []): OrderActivityLog
    {
        $from = $order->status;

        if ($from === $to) {
            throw new InvalidArgumentException("Order is already in status: {$to->value}");
        }

        if (!$this->canTransition($from, $to)) {
            throw new InvalidArgumentException(
                "Cannot transition from {$from->value} to {$to->value}"
            );
        }

        $eventType = self::toEventType($to);

        $order->status = $to;
        $order->save();

        $log = OrderActivityLog::create([
            'order_id' => $order->id,
            'user_id' => $actor?->id,
            'event_type' => $eventType->value,
            'old_status' => $from->value,
            'new_status' => $to->value,
            'metadata' => !empty($metadata) ? $metadata : null,
            'created_at' => now(),
        ]);

        return $log;
    }
}
