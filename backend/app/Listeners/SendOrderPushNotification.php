<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Queued so Expo push latency/outages can never stall order processing
 * (this runs inside the order-placement transaction's critical section
 * when triggered by OrderIntake). ShouldQueueAfterCommit makes the event
 * dispatcher hold the job until the surrounding transaction commits, so
 * the push can never reference an uncommitted order row.
 *
 * NB: do NOT redeclare the $afterCommit property here — the Queueable
 * trait already declares it, and a differing default is a fatal class
 * composition error on every artisan boot.
 */
class SendOrderPushNotification implements ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public $tries = 3;

    private array $statusMessages = [
        'confirmed' => ['title' => 'Order Confirmed!', 'body' => 'Your order has been confirmed and is being prepared.'],
        'preparing' => ['title' => 'Being Prepared', 'body' => 'Your items are being picked and packed.'],
        'out_for_delivery' => ['title' => 'On the Way!', 'body' => 'Your rider is heading to you now.'],
        'delivered' => ['title' => 'Delivered!', 'body' => 'Your order has been delivered. Enjoy!'],
        'retrying' => ['title' => 'Finding a Rider', 'body' => "We're still locating a rider for your order — hang tight."],
        'cancelled' => ['title' => 'Order Cancelled', 'body' => 'Your order could not be fulfilled and has been cancelled.'],
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
            // Log rather than fail silently — push outage must be observable
            Log::warning('Push notification failed', [
                'order_id' => $order->id,
                'status' => $event->newStatus,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
