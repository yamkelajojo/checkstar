<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Public fulfillment endpoints (guest-accessible, they pre-flight the
 * checkout): single-store resolution, inactive stores are never suggested,
 * and unfulfillable carts return the structured 422 the web cart renders.
 */
class FulfillmentApiTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create(['name' => 'F Cat', 'slug' => 'f-cat']);
    }

    private function makeStore(string $name, string $slug, bool $active = true): Store
    {
        return Store::create([
            'name' => $name, 'slug' => $slug, 'address' => 'x', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000011',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10,
            'is_active' => $active,
        ]);
    }

    private function makeProduct(string $slug): Product
    {
        return Product::create([
            'category_id' => $this->category->id,
            'name' => ucfirst($slug), 'slug' => $slug, 'unit' => 'each',
            'price' => 5, 'is_active' => true,
        ]);
    }

    public function test_validate_returns_the_resolved_store_for_a_fulfillable_cart(): void
    {
        $store = $this->makeStore('F Store', 'f-store');
        $product = $this->makeProduct('f-product');
        StoreProduct::create([
            'store_id' => $store->id, 'product_id' => $product->id,
            'stock_quantity' => 5, 'reserved_quantity' => 0, 'is_available' => true,
        ]);

        $this->postJson('/api/fulfillment/validate', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'latitude' => -29.851,
            'longitude' => 31.021,
        ])->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('store.slug', 'f-store');
    }

    public function test_inactive_stores_are_never_suggested(): void
    {
        $store = $this->makeStore('Dark Store', 'dark-store', active: false);
        $product = $this->makeProduct('dark-product');
        StoreProduct::create([
            'store_id' => $store->id, 'product_id' => $product->id,
            'stock_quantity' => 5, 'reserved_quantity' => 0, 'is_available' => true,
        ]);

        $this->postJson('/api/fulfillment/validate', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'latitude' => -29.851,
            'longitude' => 31.021,
        ])->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_validate_rejects_malformed_payloads(): void
    {
        $this->postJson('/api/fulfillment/validate', [
            'items' => [],
            'latitude' => 999,
            'longitude' => 'abc',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['items', 'latitude', 'longitude']);
    }

    public function test_nearest_store_endpoint_reports_a_store_or_null(): void
    {
        $store = $this->makeStore('Near Store', 'near-store');
        $product = $this->makeProduct('near-product');
        StoreProduct::create([
            'store_id' => $store->id, 'product_id' => $product->id,
            'stock_quantity' => 5, 'reserved_quantity' => 0, 'is_available' => true,
        ]);

        $this->getJson('/api/fulfillment/nearest-store?latitude=-29.851&longitude=31.021')
            ->assertStatus(200)
            ->assertJsonPath('store.slug', 'near-store');
    }
}
