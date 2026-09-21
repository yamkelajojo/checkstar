<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * A customer cancellation must be terminal: a rider's stale phone screen must
 * not be able to resurrect a cancelled order or decrement stock on it.
 * Guards the two HIGH race fixes (atomic status transition + order-liveness
 * check on items-bought) at the HTTP boundary.
 */
class RiderOrderGuardApiTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private Rider $rider;

    private Store $store;

    private StoreProduct $storeProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => UserRole::Customer]);

        $this->store = Store::create([
            'name' => 'Guard Store', 'slug' => 'guard-store', 'address' => '12 Guard Rd',
            'city' => 'Durban', 'province' => 'KZN', 'postal_code' => '4001',
            'phone' => '0310000012', 'latitude' => -29.85, 'longitude' => 31.02,
            'delivery_radius_km' => 10, 'is_active' => true,
        ]);

        $category = Category::create(['name' => 'Guard Cat', 'slug' => 'guard-cat']);
        $product = Product::create([
            'category_id' => $category->id, 'name' => 'Guard Product',
            'slug' => 'guard-product', 'unit' => 'each', 'price' => 20, 'is_active' => true,
        ]);

        $this->storeProduct = StoreProduct::create([
            'store_id' => $this->store->id, 'product_id' => $product->id,
            'stock_quantity' => 50, 'reserved_quantity' => 0, 'is_available' => true,
        ]);

        $riderUser = User::factory()->create(['role' => UserRole::Rider]);
        $this->rider = Rider::create([
            'user_id' => $riderUser->id,
            'store_id' => $this->store->id,
            'is_available' => true,
            'max_radius_km' => 10,
            'total_deliveries' => 0,
            'average_rating' => 0,
            'xp' => 0,
            'level' => 1,
        ]);
    }

    private function createPreparingOrder(bool $itemBought = false): Order
    {
        $order = Order::create([
            'order_number' => 'ORD-GD-'.strtoupper(substr(uniqid(), -8)),
            'customer_id' => $this->customer->id,
            'store_id' => $this->store->id,
            'rider_id' => $this->rider->id,
            'status' => OrderStatus::Preparing,
            'payment_status' => PaymentStatus::Pending,
            'subtotal' => 40.00,
            'delivery_fee' => 10.00,
            'total' => 50.00,
            'delivery_latitude' => -29.85,
            'delivery_longitude' => 31.02,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->storeProduct->product_id,
            'store_product_id' => $this->storeProduct->id,
            'quantity' => 2,
            'unit_price' => 20.00,
            'total_price' => 40.00,
            'product_snapshot' => ['name' => 'Guard Product', 'unit' => 'each', 'slug' => 'guard-product'],
            'bought_at' => $itemBought ? now() : null,
        ]);

        return $order;
    }

    public function test_mark_items_bought_returns_422_and_keeps_stock_when_order_cancelled(): void
    {
        $order = $this->createPreparingOrder();
        $itemId = $order->items->first()->id;

        $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        $this->actingAs($this->rider->user)
            ->postJson("/api/rider/items-bought/{$order->id}", ['item_ids' => [$itemId]])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Cannot mark items as bought: order is cancelled');

        $this->storeProduct->refresh();
        $this->assertSame(50, $this->storeProduct->stock_quantity);
        $this->assertSame('cancelled', $order->fresh()->status->value);
    }

    public function test_out_for_delivery_returns_422_and_order_stays_cancelled(): void
    {
        // Items already bought and picked — only the order status gate remains.
        $order = $this->createPreparingOrder(itemBought: true);

        $this->actingAs($this->customer)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertStatus(200);

        $this->actingAs($this->rider->user)
            ->postJson("/api/rider/out-for-delivery/{$order->id}")
            ->assertStatus(422);

        $fresh = $order->fresh();
        $this->assertSame('cancelled', $fresh->status->value);
        $this->assertSame($this->rider->id, $fresh->rider_id);
    }

    public function test_rider_cannot_advance_out_for_delivery_with_unbought_items(): void
    {
        $order = $this->createPreparingOrder(itemBought: false);

        $this->actingAs($this->rider->user)
            ->postJson("/api/rider/out-for-delivery/{$order->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'Cannot leave the store: 1 item(s) have not been marked as bought');
    }
}