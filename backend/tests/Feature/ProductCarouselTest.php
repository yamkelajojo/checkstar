<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Guards the homepage carousel endpoints:
 *  - they must be reachable (registered BEFORE /products/{slug} so the
 *    slug route cannot shadow them), and
 *  - they must return enriched product payloads without server errors.
 */
class ProductCarouselTest extends TestCase
{
    use RefreshDatabase;

    private function makeProduct(string $name, float $price = 20.00): Product
    {
        return Product::create([
            'category_id' => Category::create(['name' => $name.' Cat', 'slug' => str($name)->slug()->value().'-cat'])->id,
            'name' => $name,
            'slug' => str($name)->slug()->value(),
            'price' => $price,
            'unit' => 'each',
            'is_active' => true,
        ]);
    }

    public function test_trending_endpoint_is_not_shadowed_by_slug_route(): void
    {
        $product = $this->makeProduct('Trending Rice');

        $response = $this->getJson('/api/products/trending');

        $response->assertStatus(200);
        // The static route must win over /products/{slug} (which would 404)
        $this->assertNotContains('Trending Rice', array_column(Product::query()->where('slug', 'trending')->get(['name'])->toArray(), 'name'));
    }

    public function test_popular_returns_delivered_order_products(): void
    {
        $product = $this->makeProduct('Best Seller');

        $store = Store::create([
            'name' => 'Store', 'slug' => 'store-1', 'address' => 'a', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000000',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10,
            'is_active' => true,
        ]);
        StoreProduct::create(['store_id' => $store->id, 'product_id' => $product->id, 'stock_quantity' => 5, 'is_available' => true]);

        $customer = User::create([
            'name' => 'C', 'email' => 'carousel@example.com', 'password' => Hash::make('password'),
            'role' => UserRole::Customer, 'is_active' => true,
        ]);
        $order = Order::create([
            'order_number' => 'CS-CAR-1', 'customer_id' => $customer->id, 'store_id' => $store->id,
            'status' => 'delivered', 'payment_status' => 'paid', 'subtotal' => 20, 'delivery_fee' => 0,
            'total' => 20, 'delivery_latitude' => -29.85, 'delivery_longitude' => 31.02,
        ]);
        OrderItem::create([
            'order_id' => $order->id, 'product_id' => $product->id, 'quantity' => 3,
            'unit_price' => 20, 'total_price' => 60, 'product_snapshot' => ['name' => $product->name],
        ]);

        $response = $this->getJson('/api/products/popular');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertCount(1, $data);
        $this->assertSame('Best Seller', $data[0]['name']);
        $this->assertArrayHasKey('effective_price', $data[0]);
    }

    public function test_new_arrivals_returns_recent_products_without_error(): void
    {
        $this->makeProduct('Fresh Arrival');

        $response = $this->getJson('/api/products/new-arrivals');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertCount(1, $data);
        $this->assertSame('Fresh Arrival', $data[0]['name']);
        $this->assertArrayHasKey('effective_price', $data[0]);
    }

    public function test_trending_returns_empty_array_when_no_orders(): void
    {
        $response = $this->getJson('/api/products/trending');

        $response->assertStatus(200);
        $this->assertSame([], $response->json('data'));
    }
}
