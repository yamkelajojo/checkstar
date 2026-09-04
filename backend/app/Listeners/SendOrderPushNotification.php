<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use Illuminate\Support\Facades\Http;

class SendOrderPushNotification
{
    private array $statusMessages = [
        'confirmed' => ['title' => 'Order Confirmed!', 'body' => 'Your order has been confirmed and is being prepared.'],
        'preparing' => ['title' => 'Being Prepared', 'body' => 'Your items are being picked and packed.'],
        'out_for_delivery' => ['title' => 'On the Way!', 'body' => 'Your rider is heading to you now.'],
        'delivered' => ['title' => 'Delivered!', 'body' => 'Your order has been delivered. Enjoy!'],
    ];

    public function handle(OrderStatusChanged $event): void
    {
        $order = $event->order;
        $customer = $order->customer;

        if (! $customer || ! $customer->push_token) {
            return;
        }

        $message = $this->statusMessages[$event->newStatus] ?? null;
        if (! $message) {
            return;
        }

        try {
            Http::post('https://exp.host/--/api/v2/push/send', [
                'to' => $customer->push_token,
                'title' => $message['title'],
                'body' => $message['body'],
                'data' => [
                    'orderId' => $order->id,
                    'status' => $event->newStatus,
                    'type' => 'order_update',
                ],
                'sound' => 'default',
                'badge' => 1,
            ]);
        } catch (\Exception $e) {
            // Silent — push failure should not block order processing
        }
    }
}
