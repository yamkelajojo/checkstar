<?php

namespace App\Enums;

enum GameEvent: string
{
    case DeliveryCompleted = 'delivery_completed';
    case OrderConfirmed = 'order_confirmed';
    case RatingReceived = 'rating_received';
    case FirstDelivery = 'first_delivery';
}
