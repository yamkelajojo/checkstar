<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DeliveryConfirmation
{
    private OrderStateMachine $orderStateMachine;

    private PaymentStateMachine $paymentStateMachine;

    public function __construct(OrderStateMachine $orderStateMachine, PaymentStateMachine $paymentStateMachine)
    {
        $this->orderStateMachine = $orderStateMachine;
        $this->paymentStateMachine = $paymentStateMachine;
    }

    public function confirm(Order $order, User $actor): Order
    {
        // Idempotent: if already delivered, paid and confirmed, short-circuit
        $freshCheck = $order->fresh();
        if ($freshCheck->status === OrderStatus::Delivered && $freshCheck->payment_status === PaymentStatus::Paid && $freshCheck->customer_confirmed_at !== null) {
            return $freshCheck;
        }

        DB::transaction(function () use ($order, $actor) {
            $fresh = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            // Only transition order if not already delivered (rider may have delivered first)
            if ($fresh->status !== OrderStatus::Delivered) {
                if (! $this->orderStateMachine->canTransition($fresh->status, OrderStatus::Delivered)) {
                    throw new \InvalidArgumentException("Cannot confirm delivery from status {$fresh->status->value}");
                }
                $this->orderStateMachine->transition($fresh, OrderStatus::Delivered, $actor);
                $fresh = $fresh->fresh();
                // Re-lock after transition to keep atomicity for payment
                $fresh = Order::where('id', $fresh->id)->lockForUpdate()->firstOrFail();
            }

            // Only transition payment if still pending (idempotent on
            // re-confirm; a refunded payment must never be resurrected to
            // Paid — treat the payment phase as resolved).
            if ($fresh->payment_status === PaymentStatus::Pending) {
                $this->paymentStateMachine->transition($fresh, PaymentStatus::Paid, $actor);
                $fresh = $fresh->fresh();
                $fresh = Order::where('id', $fresh->id)->lockForUpdate()->firstOrFail();
                $fresh->customer_confirmed_at = now();
                $fresh->save();
            } elseif ($fresh->customer_confirmed_at === null) {
                $fresh->customer_confirmed_at = now();
                $fresh->save();
            }
        });

        return $order->fresh();
    }
}
