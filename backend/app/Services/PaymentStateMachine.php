<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Models\Order;
use InvalidArgumentException;

class PaymentStateMachine
{
    private static array $transitions = [];
    private bool $recordTransaction = true;

    private static function map(): array
    {
        if (!empty(self::$transitions)) {
            return self::$transitions;
        }

        self::$transitions = [
            PaymentStatus::Pending->value => [PaymentStatus::Paid->value],
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

    public function transition(Order $order, PaymentStatus $to, ?\App\Models\User $actor = null): void
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

        // Financial audit trail: create Transaction record
        if ($this->recordTransaction) {
            $type = $to === PaymentStatus::Paid ? \App\Enums\TransactionType::Payment : \App\Enums\TransactionType::Refund;
            $direction = $to === PaymentStatus::Paid ? \App\Enums\TransactionDirection::Debit : \App\Enums\TransactionDirection::Credit;
            try {
                \App\Models\Transaction::create([
                    'order_id' => $order->id,
                    'user_id' => $actor?->id ?? $order->customer_id,
                    'direction' => $direction->value,
                    'amount' => $order->total,
                    'type' => $type->value,
                    'payout_status' => null,
                    'metadata' => ['from' => $from->value, 'to' => $to->value],
                ]);
            } catch (\Throwable $e) {
                // Transaction audit failure should not block payment transition; log it
                \Illuminate\Support\Facades\Log::warning('Failed to create transaction', ['order_id' => $order->id, 'error' => $e->getMessage()]);
            }
        }
    }
}
