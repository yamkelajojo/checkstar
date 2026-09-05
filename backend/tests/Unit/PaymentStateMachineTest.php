<?php

namespace Tests\Unit;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\TransactionDirection;
use App\Enums\TransactionType;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Store;
use App\Models\Transaction;
use App\Models\User;
use App\Services\PaymentStateMachine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class PaymentStateMachineTest extends TestCase
{
    use RefreshDatabase;

    private PaymentStateMachine $machine;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->machine = new PaymentStateMachine;

        $store = Store::create([
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

        $customer = User::create([
            'name' => 'Customer',
            'email' => 'customer@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::Customer,
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-PSM-001',
            'customer_id' => $customer->id,
            'store_id' => $store->id,
            'status' => OrderStatus::Pending,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 100.00,
            'delivery_fee' => 10.00,
            'total' => 110.00,
        ]);
    }

    public function test_pending_to_paid(): void
    {
        $this->machine->transition($this->order, PaymentStatus::Paid);

        $this->assertEquals(PaymentStatus::Paid, $this->order->fresh()->payment_status);
    }

    public function test_paid_to_refunded(): void
    {
        $this->order->update(['payment_status' => PaymentStatus::Paid]);

        $this->machine->transition($this->order, PaymentStatus::Refunded);

        $this->assertEquals(PaymentStatus::Refunded, $this->order->fresh()->payment_status);
    }

    public function test_pending_to_refunded_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot transition payment from pending to refunded');

        $this->machine->transition($this->order, PaymentStatus::Refunded);
    }

    public function test_paid_to_pending_throws(): void
    {
        $this->order->update(['payment_status' => PaymentStatus::Paid]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot transition payment from paid to pending');

        $this->machine->transition($this->order, PaymentStatus::Pending);
    }

    public function test_refunded_to_paid_throws(): void
    {
        $this->order->update(['payment_status' => PaymentStatus::Refunded]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot transition payment from refunded to paid');

        $this->machine->transition($this->order, PaymentStatus::Paid);
    }

    public function test_refunded_to_pending_throws(): void
    {
        $this->order->update(['payment_status' => PaymentStatus::Refunded]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot transition payment from refunded to pending');

        $this->machine->transition($this->order, PaymentStatus::Pending);
    }

    public function test_same_status_transition_throws(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment is already in status: pending');

        $this->machine->transition($this->order, PaymentStatus::Pending);
    }

    public function test_paid_to_paid_throws(): void
    {
        $this->order->update(['payment_status' => PaymentStatus::Paid]);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment is already in status: paid');

        $this->machine->transition($this->order, PaymentStatus::Paid);
    }

    public function test_can_transition_returns_true_for_valid(): void
    {
        $this->assertTrue($this->machine->canTransition(PaymentStatus::Pending, PaymentStatus::Paid));
        $this->assertTrue($this->machine->canTransition(PaymentStatus::Paid, PaymentStatus::Refunded));
    }

    public function test_can_transition_returns_false_for_invalid(): void
    {
        $this->assertFalse($this->machine->canTransition(PaymentStatus::Pending, PaymentStatus::Refunded));
        $this->assertFalse($this->machine->canTransition(PaymentStatus::Paid, PaymentStatus::Pending));
        $this->assertFalse($this->machine->canTransition(PaymentStatus::Refunded, PaymentStatus::Paid));
    }

    public function test_transaction_created_on_pending_to_paid(): void
    {
        $this->machine->transition($this->order, PaymentStatus::Paid);

        $transaction = Transaction::where('order_id', $this->order->id)->first();

        $this->assertNotNull($transaction);
        $this->assertSame(TransactionType::Payment, $transaction->type);
        $this->assertSame(TransactionDirection::Debit, $transaction->direction);
        $this->assertSame('110.00', $transaction->amount);
        $this->assertSame($this->order->customer_id, $transaction->user_id);
        $this->assertNull($transaction->payout_status);
        // JSON objects are unordered — MySQL 8 stores object keys sorted —
        // so assert map equality, not key order.
        $this->assertEquals(['from' => 'pending', 'to' => 'paid'], $transaction->metadata);
    }

    public function test_transaction_created_on_paid_to_refunded(): void
    {
        $this->order->update(['payment_status' => PaymentStatus::Paid]);

        $this->machine->transition($this->order, PaymentStatus::Refunded);

        $transaction = Transaction::where('order_id', $this->order->id)->first();

        $this->assertNotNull($transaction);
        $this->assertSame(TransactionType::Refund, $transaction->type);
        $this->assertSame(TransactionDirection::Credit, $transaction->direction);
        $this->assertSame('110.00', $transaction->amount);
        $this->assertEquals(['from' => 'paid', 'to' => 'refunded'], $transaction->metadata);
    }

    public function test_actor_user_id_used_when_provided(): void
    {
        $actor = User::create([
            'name' => 'Manager',
            'email' => 'manager@test.com',
            'password' => bcrypt('password'),
            'role' => UserRole::StoreManager,
            'is_active' => true,
        ]);

        $this->machine->transition($this->order, PaymentStatus::Paid, $actor);

        $transaction = Transaction::where('order_id', $this->order->id)->first();

        $this->assertSame($actor->id, $transaction->user_id);
    }

    public function test_customer_id_used_when_no_actor(): void
    {
        $this->machine->transition($this->order, PaymentStatus::Paid);

        $transaction = Transaction::where('order_id', $this->order->id)->first();

        $this->assertSame($this->order->customer_id, $transaction->user_id);
    }

    public function test_multiple_transitions_create_multiple_transactions(): void
    {
        $this->machine->transition($this->order, PaymentStatus::Paid);
        $this->machine->transition($this->order, PaymentStatus::Refunded);

        $transactions = Transaction::where('order_id', $this->order->id)->get();

        $this->assertCount(2, $transactions);
        $this->assertSame(TransactionType::Payment, $transactions[0]->type);
        $this->assertSame(TransactionType::Refund, $transactions[1]->type);
    }

    public function test_order_relationship_maintained_on_transaction(): void
    {
        $this->machine->transition($this->order, PaymentStatus::Paid);

        $transaction = Transaction::where('order_id', $this->order->id)->first();

        $this->assertNotNull($transaction->order);
        $this->assertSame($this->order->id, $transaction->order->id);
    }

    public function test_idempotent_transition_throws_on_second_call(): void
    {
        $this->machine->transition($this->order, PaymentStatus::Paid);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment is already in status: paid');

        $this->machine->transition($this->order, PaymentStatus::Paid);
    }

    public function test_transaction_not_created_when_record_transaction_disabled(): void
    {
        $reflection = new \ReflectionProperty($this->machine, 'recordTransaction');
        $reflection->setValue($this->machine, false);

        $this->machine->transition($this->order, PaymentStatus::Paid);

        $this->assertEquals(PaymentStatus::Paid, $this->order->fresh()->payment_status);
        $this->assertDatabaseCount('transactions', 0);
    }
}
