<?php

namespace App\Enums;

enum EventType: string
{
    case OrderPlaced = 'order_placed';
    case OrderConfirmed = 'order_confirmed';
    case DispatchRetrying = 'dispatch_retrying';
    case RiderAssigned = 'rider_assigned';
    case OrderReady = 'order_ready';
    case OrderPreparing = 'order_preparing';
    case ItemsBought = 'items_bought';
    case OutForDelivery = 'out_for_delivery';
    case Delivered = 'delivered';
    case CustomerConfirmed = 'customer_confirmed';
    case Cancelled = 'cancelled';
    case PaymentPaid = 'payment_paid';
    case PaymentRefunded = 'payment_refunded';
}
