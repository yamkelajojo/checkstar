<?php

namespace App\Enums;

enum TransactionDirection: string
{
    case Credit = 'credit';
    case Debit = 'debit';
}
