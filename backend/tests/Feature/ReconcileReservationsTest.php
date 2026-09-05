<?php

namespace Tests\Feature;

use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReconcileReservationsTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;

    private Category $category;

    private User $customer;

    private Product $product;

    private StoreProduct $sp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Recon Store', 'slug' => 'recon-store', 'address' => 'x', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000004',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->category = Category::create(['name' => 'Recon Cat', 'slug' => 'recon-cat']);
        $this->customer = User::factory()->create(['role' => UserRole::Customer]);

        $this->product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Recon Product', 'slug' => 'recon-product', 'unit' => 'each',
            'price' => 10, 'is_active' => true,
        ]);
        $this->sp = StoreProduct::create([
            'store_id' => $this->store->id, 'product_id' => $this->product->id,
            'stock_quantity' => 3, 'reserved_quantity' => 0, 'is_available' => true,
        ]);
    }

    private function makeOrder(string $number, string $status = 'confirmed'): Order
    {
        return Order::create([
            'order_number' => $number,
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'status' => $status,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 10, 'delivery_fee' => 0, 'total' => 10,
        ]);
    }

    private function makeItem(Order $order, int $qty, bool $bought = false): void
    {
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'store_product_id' => $this->sp->id,
            'quantity' => $qty,
            'unit_price' => 10,
            'total_price' => 10 * $qty,
            'bought_at' => $bought ? now() : null,
            'product_snapshot' => ['name' => $this->product->name],
        ]);
    }

    public function test_consistent_ledger_is_left_alone(): void
    {
        $order = $this->makeOrder('RC-1');
        $this->makeItem($order, 2);
        $this->sp->update(['reserved_quantity' => 2]);

        $this->artisan('checkstar:reconcile-reservations')->assertSuccessful();

        $this->assertSame(2, $this->sp->fresh()->reserved_quantity);
    }

    public function test_drift_is_corrected(): void
    {
        $order = $this->makeOrder('RC-2');
        $this->makeItem($order, 2);
        $this->sp->update(['reserved_quantity' => 0]); // drifted low

        $this->artisan('checkstar:reconcile-reservations')->assertSuccessful();

        $this->assertSame(2, $this->sp->fresh()->reserved_quantity);
    }

    public function test_oversubscribed_stock_reconciles_to_clamped_value_without_failing(): void
    {
        // Two active orders of 2 against stock of 3: the true ledger
        // expectation is 4, which violates reserved <= stock. Reconciliation
        // must clamp to 3 (mirroring the claim-time clamp) — anything else
        // crashes the scheduler run on MySQL's CHECK constraint.
        $orderA = $this->makeOrder('RC-3');
        $this->makeItem($orderA, 2);
        $orderB = $this->makeOrder('RC-4');
        $this->makeItem($orderB, 2);
        $this->sp->update(['reserved_quantity' => 3]); // claim-time clamp already applied

        $this->artisan('checkstar:reconcile-reservations')->assertSuccessful();

        $this->assertSame(3, $this->sp->fresh()->reserved_quantity);
    }

    public function test_bought_items_and_terminal_orders_do_not_count(): void
    {
        $delivered = $this->makeOrder('RC-5', 'delivered');
        $this->makeItem($delivered, 2, bought: true);

        $this->artisan('checkstar:reconcile-reservations')->assertSuccessful();

        $this->assertSame(0, $this->sp->fresh()->reserved_quantity);
    }
}
