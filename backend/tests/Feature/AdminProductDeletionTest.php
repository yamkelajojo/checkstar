<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * order_items.product_id cascades on delete — an admin deleting a product
 * with purchase history would silently erase financial records. The destroy
 * endpoint must refuse (and deactivate) instead.
 */
class AdminProductDeletionTest extends TestCase
{
    use RefreshDatabase;

    private User $developer;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->developer = User::factory()->create(['role' => UserRole::Developer]);
        $this->category = Category::create(['name' => 'Cat', 'slug' => 'cat-'.uniqid()]);
    }

    private function makeProduct(): Product
    {
        return Product::create([
            'category_id' => $this->category->id,
            'name' => 'Del '.uniqid(),
            'slug' => 'del-'.uniqid(),
            'unit' => 'each',
            'price' => 10.00,
            'is_active' => true,
        ]);
    }

    public function test_product_with_order_history_is_deactivated_not_deleted(): void
    {
        $product = $this->makeProduct();

        $order = Order::create([
            'order_number' => 'DEL-'.uniqid(),
            'customer_id' => $this->developer->id,
            'store_id' => null,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'subtotal' => 10, 'delivery_fee' => 0, 'total' => 10,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 10,
            'total_price' => 10,
            'product_snapshot' => ['name' => $product->name],
        ]);

        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/products/{$product->id}")
            ->assertStatus(409)
            ->assertJsonPath('reason', 'has_order_history');

        // History intact + product still exists but is hidden from the shop.
        $this->assertDatabaseHas('order_items', ['product_id' => $product->id]);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'is_active' => false]);
    }

    public function test_product_without_history_is_deleted(): void
    {
        $product = $this->makeProduct();

        $this->actingAs($this->developer)
            ->deleteJson("/api/admin/products/{$product->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }
}
