<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartSyncTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => UserRole::Customer]);
        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Coca-Cola 2L',
            'slug' => 'coca-cola-2l',
            'unit' => 'each',
            'price' => 22.00,
            'is_active' => true,
        ]);
    }

    public function test_sync_sums_quantities_for_matching_products(): void
    {
        $this->customer->cartItems()->create(['product_id' => $this->product->id, 'quantity' => 2]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart/sync', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 3]],
            ])
            ->assertStatus(200)
            ->assertJsonCount(0, 'dropped')
            ->assertJsonPath('data.0.quantity', 5);
    }

    public function test_sync_caps_quantity_at_eight(): void
    {
        $this->customer->cartItems()->create(['product_id' => $this->product->id, 'quantity' => 6]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart/sync', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 6]],
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.0.quantity', 8);
    }

    public function test_sync_drops_inactive_products_with_feedback(): void
    {
        $inactive = Product::create([
            'category_id' => $this->product->category_id,
            'name' => 'Retired Item',
            'slug' => 'retired-item',
            'unit' => 'each',
            'price' => 10.00,
            'is_active' => false,
        ]);

        $this->actingAs($this->customer)
            ->postJson('/api/cart/sync', [
                'items' => [
                    ['product_id' => $this->product->id, 'quantity' => 1],
                    ['product_id' => $inactive->id, 'quantity' => 2],
                ],
            ])
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.product_id', $this->product->id)
            ->assertJsonCount(1, 'dropped')
            ->assertJsonPath('dropped.0.product_id', $inactive->id);
    }

    public function test_sync_returns_merged_cart_so_device_can_replace_draft(): void
    {
        $this->customer->cartItems()->create(['product_id' => $this->product->id, 'quantity' => 4]);

        $response = $this->actingAs($this->customer)
            ->postJson('/api/cart/sync', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            ])
            ->assertStatus(200);

        $response->assertJsonPath('data.0.quantity', 5);
        $response->assertJsonStructure([
            'data' => [['product', 'quantity']],
            'dropped',
        ]);
    }
}
