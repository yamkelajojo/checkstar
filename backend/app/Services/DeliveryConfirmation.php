<?php

namespace App\Services;

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
        DB::transaction(function () use ($order, $actor) {
            $this->orderStateMachine->transition($order, \App\Enums\OrderStatus::Delivered, $actor);

            $this->paymentStateMachine->transition($order, PaymentStatus::Paid);

            $order->customer_confirmed_at = now();
            $order->save();
        });

        return $order->fresh();
    }
}