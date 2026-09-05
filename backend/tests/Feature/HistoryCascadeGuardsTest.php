<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\Rider;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Admin deletes must never take financial history with them. The FK layer
 * now RESTRICTs history on MySQL/Postgres (see
 * RestrictHistoryForeignKeys); these tests pin the application-level guards
 * that also protect SQLite and give friendlier errors than an SQL failure.
 */
class HistoryCascadeGuardsTest extends TestCase
{
    use RefreshDatabase;

    private User $developer;

    private Store $store;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->developer = User::factory()->create(['role' => UserRole::Developer]);
        $this->store = Store::create([
            'name' => 'Guard Store', 'slug' => 'guard-store', 'address' => 'x', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000003',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->category = Category::create(['name' => 'Guard Cat', 'slug' => 'guard-cat']);
    }

    private function makeOrder(string $number, int $storeId, int $customerId): Order
    {
        return Order::create([
            'order_number' => $number,
            'customer_id' => $customerId,
            'store_id' => $storeId,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'subtotal' => 10, 'delivery_fee' => 0, 'total' => 10,
        ]);
    }

    public function test_category_with_products_cannot_be_deleted(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Guarded Product', 'slug' => 'guarded-product', 'unit' => 'each',
            'price' => 5, 'is_active' => true,
        ]);

        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/categories/{$this->category->id}")
            ->assertStatus(409)
            ->assertJsonPath('reason', 'has_products');

        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    public function test_empty_category_can_be_deleted(): void
    {
        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/categories/{$this->category->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('categories', ['id' => $this->category->id]);
    }

    public function test_store_with_delivered_order_history_cannot_be_deleted(): void
    {
        // Delivered (terminal) orders previously slipped through the
        // "active orders" check and would cascade away with the store.
        $this->makeOrder('HIST-1', $this->store->id, $this->developer->id);

        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/stores/{$this->store->id}")
            ->assertStatus(409)
            ->assertJsonPath('reason', 'has_order_history');

        $this->assertDatabaseHas('orders', ['order_number' => 'HIST-1']);
    }

    public function test_store_without_history_can_be_deleted(): void
    {
        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/stores/{$this->store->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('stores', ['id' => $this->store->id]);
    }

    public function test_rider_with_reviews_cannot_be_deleted(): void
    {
        $riderUser = User::create([
            'name' => 'Rider', 'email' => 'guard-rider@example.com',
            'password' => bcrypt('password'), 'role' => UserRole::Rider, 'is_active' => true,
        ]);
        $rider = Rider::create([
            'user_id' => $riderUser->id, 'store_id' => $this->store->id,
            'is_available' => true, 'max_radius_km' => 5,
        ]);

        $order = $this->makeOrder('HIST-2', $this->store->id, $this->developer->id);
        $order->update(['rider_id' => $rider->id]);

        Review::create([
            'order_id' => $order->id,
            'reviewer_id' => $this->developer->id,
            'rider_id' => $rider->id,
            'rating' => 5,
            'created_at' => now(),
        ]);

        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/users/{$riderUser->id}")
            ->assertStatus(409)
            ->assertJsonPath('reason', 'has_reviews');

        $this->assertDatabaseHas('users', ['id' => $riderUser->id]);
        $this->assertDatabaseHas('reviews', ['rider_id' => $rider->id]);
    }

    public function test_product_stock_rows_are_not_orphaned_by_category_delete_guard(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Stock Product', 'slug' => 'stock-product', 'unit' => 'each',
            'price' => 5, 'is_active' => true,
        ]);
        StoreProduct::create([
            'store_id' => $this->store->id, 'product_id' => $product->id,
            'stock_quantity' => 5, 'reserved_quantity' => 0, 'is_available' => true,
        ]);

        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/categories/{$this->category->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('store_product', ['product_id' => $product->id]);
    }
}
