<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Order;
use InvalidArgumentException;

class PaymentStateMachine
{
    private static array $transitions = [];

    private static function map(): array
    {
        if (!empty(self::$transitions)) {
            return self::$transitions;
        }

        self::$transitions = [
            PaymentStatus::Pending->value => [PaymentStatus::Paid->value, PaymentStatus::Refunded->value],
            PaymentStatus::Paid->value => [PaymentStatus::Refunded->value],
            PaymentStatus::Refunded->value => [],
        ];

        return self::$transitions;
    }

    public function canTransition(PaymentStatus $from, PaymentStatus $to): bool
    {
        $allowed = self::map()[$from->value] ?? [];
        return in_array($to->value, $allowed, true);
    }

    public function transition(Order $order, PaymentStatus $to): void
    {
        $from = $order->payment_status;

        if ($from === $to) {
            throw new InvalidArgumentException("Payment is already in status: {$to->value}");
        }

        if (!$this->canTransition($from, $to)) {
            throw new InvalidArgumentException(
                "Cannot transition payment from {$from->value} to {$to->value}"
            );
        }

        $order->payment_status = $to;
        $order->save();
    }
}
