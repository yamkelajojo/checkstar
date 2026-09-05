<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;

class OrderCancellationPolicy
{
    private const CUSTOMER_CANCELLABLE = [
        OrderStatus::Pending->value,
        OrderStatus::Confirmed->value,
        OrderStatus::Retrying->value,
        OrderStatus::Preparing->value,
        // A packed pickup order can still be cancelled until the customer
        // collects it.
        OrderStatus::Ready->value,
    ];

    public function customerCanCancel(Order $order): bool
    {
        return in_array($order->status->value, self::CUSTOMER_CANCELLABLE, true);
    }
}
