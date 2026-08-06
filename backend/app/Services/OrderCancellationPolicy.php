<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;

class OrderCancellationPolicy
{
    private const CUSTOMER_CANCELLABLE = [
        OrderStatus::Pending->value,
        OrderStatus::Confirmed->value,
        OrderStatus::Preparing->value,
    ];

    public function customerCanCancel(Order $order): bool
    {
        return in_array($order->status->value, self::CUSTOMER_CANCELLABLE, true);
    }
}
