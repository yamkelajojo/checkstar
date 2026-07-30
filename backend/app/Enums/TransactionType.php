<?php

namespace App\Enums;

enum TransactionType: string
{
    case Payment = 'payment';
    case Refund = 'refund';
    case DeliveryFee = 'delivery_fee';
    case Payout = 'payout';
}
