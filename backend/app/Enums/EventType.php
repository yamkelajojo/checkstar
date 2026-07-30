<?php

namespace App\Enums;

enum EventType: string
{
    case OrderPlaced = 'order_placed';
    case OrderConfirmed = 'order_confirmed';
    case RiderAssigned = 'rider_assigned';
    case ItemsBought = 'items_bought';
    case OutForDelivery = 'out_for_delivery';
    case Delivered = 'delivered';
    case CustomerConfirmed = 'customer_confirmed';
    case Cancelled = 'cancelled';
    case PaymentPaid = 'payment_paid';
    case PaymentRefunded = 'payment_refunded';
}
