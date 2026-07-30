<?php

namespace App\Enums;

enum UserRole: string
{
    case Developer = 'developer';
    case StoreOwner = 'store_owner';
    case StoreManager = 'store_manager';
    case LogisticsOfficer = 'logistics_officer';
    case Customer = 'customer';
    case Rider = 'rider';
}
