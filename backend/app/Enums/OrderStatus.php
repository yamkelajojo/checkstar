<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Retrying = 'retrying';
    case Preparing = 'preparing';
    // Pickup fulfilment only: store has packed the order, customer can collect.
    case Ready = 'ready';
    case OutForDelivery = 'out_for_delivery';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
}
