<?php

namespace Tests\Feature;

use App\Events\OrderStatusChanged;
use App\Enums\PaymentStatus;
use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Listeners\SendOrderPushNotification;
use App\Models\Order;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Push notifications must:
 *  - be queued (never block the order-placement critical section),
 *  - fire for cancelled and retrying states too (the customer must never
 *    be left in silence when dispatch gives up),
 *  - include a reason-bearing message for cancellations.
 */
class PushNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::create([
            'name' => 'Push Customer',
            'email' => 'push@example.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
            'push_token' => 'ExponentPushToken[test-token]',
        ]);

        $store = Store::create([
            'name' => 'Push Store', 'slug' => 'push-store', 'address' => 'a', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000000',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number' => 'CS-PUSH-1', 'customer_id' => $this->customer->id, 'store_id' => $store->id,
            'status' => OrderStatus::Confirmed, 'payment_status' => PaymentStatus::Pending,
            'subtotal' => 50, 'delivery_fee' => 0, 'total' => 50,
            'delivery_latitude' => -29.85, 'delivery_longitude' => 31.02,
        ]);
    }

    private function assertPushSent(string $expectedTitle): void
    {
        Http::assertSent(fn ($request) => $request->url() === 'https://exp.host/--/api/v2/push/send'
            && $request['to'] === 'ExponentPushToken[test-token]'
            && $request['title'] === $expectedTitle);
    }

    public function test_cancelled_transition_pushes_notification(): void
    {
        Http::fake();

        (new SendOrderPushNotification)->handle(new OrderStatusChanged($this->order, 'confirmed', 'cancelled'));

        $this->assertPushSent('Order Cancelled');
    }

    public function test_retrying_transition_pushes_notification(): void
    {
        Http::fake();

        (new SendOrderPushNotification)->handle(new OrderStatusChanged($this->order, 'confirmed', 'retrying'));

        $this->assertPushSent('Finding a Rider');
    }

    public function test_delivered_transition_pushes_notification(): void
    {
        Http::fake();

        (new SendOrderPushNotification)->handle(new OrderStatusChanged($this->order, 'out_for_delivery', 'delivered'));

        $this->assertPushSent('Delivered!');
    }

    public function test_notification_listener_is_queued_not_synchronous(): void
    {
        // The listener must implement ShouldQueue so Expo push latency can
        // never stall order processing (it runs inside the placement
        // transaction when triggered by OrderIntake).
        $listener = new SendOrderPushNotification;
        $this->assertContains(
            \Illuminate\Contracts\Queue\ShouldQueue::class,
            class_implements($listener),
            'SendOrderPushNotification must implement ShouldQueue'
        );
        // ShouldQueueAfterCommit extends ShouldQueue and makes the event
        // dispatcher hold the queued listener until the transaction commits.
        $this->assertTrue(
            (new \ReflectionClass($listener))->implementsInterface(\Illuminate\Contracts\Queue\ShouldQueueAfterCommit::class),
            'SendOrderPushNotification must dispatch after commit'
        );
    }

    public function test_no_push_without_token(): void
    {
        Http::fake();
        $this->customer->update(['push_token' => null]);
        $this->customer->refresh();

        (new SendOrderPushNotification)->handle(new OrderStatusChanged($this->order->fresh(), 'confirmed', 'cancelled'));

        Http::assertNothingSent();
    }
}
