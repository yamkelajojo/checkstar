<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;

/**
 * Owns the cart-retention rule for order placement (#04 decision: keep on cancel).
 * The cart survives a placement whose dispatch did not complete — cancelled or
 * still retrying — so the Customer can re-checkout; it is cleared once the
 * order proceeds to fulfilment.
 */
class OrderCartPolicy
{
    public function shouldClearAfterPlacement(Order $order): bool
    {
        return ! in_array($order->status, [OrderStatus::Cancelled, OrderStatus::Retrying], true);
    }
}
