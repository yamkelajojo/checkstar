<?php

namespace App\Providers;

use App\Events\OrderStatusChanged;
use App\Listeners\SendOrderPushNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderStatusChanged::class => [
            SendOrderPushNotification::class,
        ],
    ];

    public function boot(): void
    {
        parent::boot();
    }
}
