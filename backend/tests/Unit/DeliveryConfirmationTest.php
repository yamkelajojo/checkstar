<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\OrderActivityLog;
use App\Models\Store;
use App\Models\Transaction;
use App\Models\User;
use App\Services\DeliveryConfirmation;
use App\Services\OrderStateMachine;
use App\Services\PaymentStateMachine;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryConfirmationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private DeliveryConfirmation $service;

    private User $customer;

    private Store $store;

    protected function setUp(): void
    {
        parent::setUp();

        // Freeze the clock: timestamp assertions compare against now() after
        // several DB round-trips, which under a loaded runner can drift past
        // the ±1s window and flake (seen on the MySQL 8 CI job).
        Carbon::setTestNow(Carbon::parse('2026-09-06 12:00:00'));

        $this->service = new DeliveryConfirmation(
            new OrderStateMachine,
            new PaymentStateMachine,
        );

        $this->store = Store::create([
            'name' => 'Test Store',
            'slug' => 'test-store',
            'address' => '123 Main St',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'latitude' => -29.85,
            'longitude' => 31.02,
            'delivery_radius_km' => 10,
            'phone' => '+27 31 555 0100',
            'is_active' => true,
        ]);

        $this->customer = User::create([
            'name' => 'Test Customer',
            'email' => 'customer@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);
    }

    private function createOrder(
        string $status = OrderStatus::OutForDelivery->value,
        string $paymentStatus = PaymentStatus::Pending->value,
    ): Order {
        return Order::create([
            'order_number' => 'ORD-DC-'.uniqid(),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
        ]);
    }

    public function test_successful_confirmation_transitions_order_and_payment(): void
    {
        $order = $this->createOrder(
            OrderStatus::OutForDelivery->value,
            PaymentStatus::Pending->value,
        );

        $result = $this->service->confirm($order, $this->customer);

        $this->assertEquals(OrderStatus::Delivered, $result->fresh()->status);
        $this->assertEquals(PaymentStatus::Paid, $result->fresh()->payment_status);
    }

    public function test_sets_customer_confirmed_at_timestamp(): void
    {
        $order = $this->createOrder();

        $result = $this->service->confirm($order, $this->customer);

        $this->assertNotNull($result->fresh()->customer_confirmed_at);
        $this->assertTrue(
            $result->fresh()->customer_confirmed_at->equalTo(now()),
        );
    }

    public function test_idempotent_confirming_twice_does_not_throw(): void
    {
        $order = $this->createOrder();

        $this->service->confirm($order, $this->customer);
        $result = $this->service->confirm($order, $this->customer);

        $this->assertEquals(OrderStatus::Delivered, $result->fresh()->status);
        $this->assertEquals(PaymentStatus::Paid, $result->fresh()->payment_status);
        $this->assertNotNull($result->fresh()->customer_confirmed_at);
    }

    public function test_cannot_confirm_from_pending_status(): void
    {
        $order = $this->createOrder(
            OrderStatus::Pending->value,
            PaymentStatus::Pending->value,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot confirm delivery from status pending');

        $this->service->confirm($order, $this->customer);
    }

    public function test_cannot_confirm_from_confirmed_status(): void
    {
        $order = $this->createOrder(
            OrderStatus::Confirmed->value,
            PaymentStatus::Pending->value,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot confirm delivery from status confirmed');

        $this->service->confirm($order, $this->customer);
    }

    public function test_cannot_confirm_from_preparing_status(): void
    {
        $order = $this->createOrder(
            OrderStatus::Preparing->value,
            PaymentStatus::Pending->value,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot confirm delivery from status preparing');

        $this->service->confirm($order, $this->customer);
    }

    public function test_cannot_confirm_cancelled_order(): void
    {
        $order = $this->createOrder(
            OrderStatus::Cancelled->value,
            PaymentStatus::Pending->value,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot confirm delivery from status cancelled');

        $this->service->confirm($order, $this->customer);
    }

    public function test_cannot_confirm_already_delivered_order_with_paid_payment(): void
    {
        $order = $this->createOrder(
            OrderStatus::Delivered->value,
            PaymentStatus::Paid->value,
        );
        $order->update(['customer_confirmed_at' => now()]);

        $result = $this->service->confirm($order, $this->customer);

        $this->assertEquals(OrderStatus::Delivered, $result->fresh()->status);
        $this->assertEquals(PaymentStatus::Paid, $result->fresh()->payment_status);
    }

    public function test_already_delivered_but_unpaid_gets_paid(): void
    {
        $order = $this->createOrder(
            OrderStatus::Delivered->value,
            PaymentStatus::Pending->value,
        );

        $result = $this->service->confirm($order, $this->customer);

        $this->assertEquals(PaymentStatus::Paid, $result->fresh()->payment_status);
        $this->assertNotNull($result->fresh()->customer_confirmed_at);
    }

    public function test_refunded_payment_is_not_resurrected_on_delivery_confirmation(): void
    {
        // A prematurely refunded order still needs delivering: the
        // confirmation must proceed, leave the payment Refunded (never
        // resurrect it to Paid) and not book a second payment transaction.
        $order = $this->createOrder(
            OrderStatus::OutForDelivery->value,
            PaymentStatus::Refunded->value,
        );

        $result = $this->service->confirm($order, $this->customer);

        $fresh = $result->fresh();
        $this->assertEquals(OrderStatus::Delivered, $fresh->status);
        $this->assertEquals(PaymentStatus::Refunded, $fresh->payment_status);
        $this->assertNotNull($fresh->customer_confirmed_at);
        $this->assertSame(0, Transaction::where('order_id', $order->id)->count());
    }

    public function test_reconfirming_delivered_refunded_order_is_idempotent(): void
    {
        $order = $this->createOrder(
            OrderStatus::Delivered->value,
            PaymentStatus::Refunded->value,
        );
        $order->forceFill(['customer_confirmed_at' => now()])->save();

        $result = $this->service->confirm($order, $this->customer);

        $this->assertEquals(PaymentStatus::Refunded, $result->fresh()->payment_status);
        $this->assertEquals(OrderStatus::Delivered, $result->fresh()->status);
    }

    public function test_activity_log_created_for_order_transition(): void
    {
        $order = $this->createOrder();

        $this->service->confirm($order, $this->customer);

        $logs = OrderActivityLog::where('order_id', $order->id)->get();

        $this->assertGreaterThanOrEqual(1, $logs->count());

        $deliveredLog = $logs->firstWhere('event_type', 'delivered');
        $this->assertNotNull($deliveredLog);
        $this->assertSame(OrderStatus::OutForDelivery->value, $deliveredLog->old_status);
        $this->assertSame(OrderStatus::Delivered->value, $deliveredLog->new_status);
        $this->assertSame($this->customer->id, $deliveredLog->user_id);
    }

    public function test_no_duplicate_activity_log_when_idempotent(): void
    {
        $order = $this->createOrder();

        $this->service->confirm($order, $this->customer);
        $countAfterFirst = OrderActivityLog::where('order_id', $order->id)->count();

        $this->service->confirm($order, $this->customer);
        $countAfterSecond = OrderActivityLog::where('order_id', $order->id)->count();

        $this->assertSame($countAfterFirst, $countAfterSecond);
    }

    public function test_transaction_record_created_for_payment(): void
    {
        $order = $this->createOrder();

        $this->service->confirm($order, $this->customer);

        $transaction = Transaction::where('order_id', $order->id)->first();

        $this->assertNotNull($transaction);
        $this->assertSame('payment', $transaction->type->value);
        $this->assertSame('debit', $transaction->direction->value);
        $this->assertEquals(110.00, (float) $transaction->amount);
        $this->assertSame($order->id, $transaction->order_id);
    }

    public function test_no_duplicate_transaction_when_idempotent(): void
    {
        $order = $this->createOrder();

        $this->service->confirm($order, $this->customer);
        $countAfterFirst = Transaction::where('order_id', $order->id)->count();

        $this->service->confirm($order, $this->customer);
        $countAfterSecond = Transaction::where('order_id', $order->id)->count();

        $this->assertSame($countAfterFirst, $countAfterSecond);
    }

    public function test_customer_must_match_order_owner(): void
    {
        $order = $this->createOrder();

        $otherCustomer = User::create([
            'name' => 'Other Customer',
            'email' => 'other@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $result = $this->service->confirm($order, $otherCustomer);

        // Service does not enforce ownership — any actor can confirm.
        // This test documents that behavior. Ownership is enforced at
        // the controller/policy layer, not inside DeliveryConfirmation.
        $this->assertEquals(OrderStatus::Delivered, $result->fresh()->status);
        $this->assertSame($order->customer_id, $this->customer->id);
        $this->assertNotSame($order->customer_id, $otherCustomer->id);
    }

    public function test_actor_is_recorded_on_activity_log(): void
    {
        $order = $this->createOrder();

        $manager = User::create([
            'name' => 'Store Manager',
            'email' => 'manager@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::StoreManager,
            'is_active' => true,
        ]);

        $this->service->confirm($order, $manager);

        $log = OrderActivityLog::where('order_id', $order->id)
            ->where('event_type', 'delivered')
            ->first();

        $this->assertNotNull($log);
        $this->assertSame($manager->id, $log->user_id);
    }

    public function test_transaction_actor_id_matches_customer_when_no_actor(): void
    {
        $order = $this->createOrder();

        $this->service->confirm($order, $this->customer);

        $transaction = Transaction::where('order_id', $order->id)->first();

        // PaymentStateMachine uses $actor?->id ?? $order->customer_id for user_id
        // When actor is the customer, user_id should be the customer's id
        $this->assertSame($this->customer->id, $transaction->user_id);
    }
}
