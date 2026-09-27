<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Store order console: staff see only their store's orders, pagination is
 * bounded, and status updates from another store's order are impossible.
 */
class StoreOrderApiTest extends TestCase
{
    use RefreshDatabase;

    private Store $storeA;

    private Store $storeB;

    private User $managerA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storeA = Store::create([
            'name' => 'SO Store A', 'slug' => 'so-store-a', 'address' => 'a', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000007',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->storeB = Store::create([
            'name' => 'SO Store B', 'slug' => 'so-store-b', 'address' => 'b', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4002', 'phone' => '0310000008',
            'latitude' => -29.86, 'longitude' => 31.03, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);

        $this->managerA = $this->makeManager('so-manager-a@example.com', $this->storeA);
    }

    private function makeManager(string $email, Store $store): User
    {
        $user = User::create([
            'name' => 'Mgr', 'email' => $email, 'password' => bcrypt('password'),
            'role' => UserRole::StoreManager, 'is_active' => true,
        ]);
        StoreStaff::create(['user_id' => $user->id, 'store_id' => $store->id, 'role' => StaffRole::StoreManager->value]);

        return $user;
    }

    private function makeOrder(Store $store, string $number, string $status = 'pending'): Order
    {
        return Order::create([
            'order_number' => $number,
            'customer_id' => $this->managerA->id,
            'store_id' => $store->id,
            'status' => $status,
            'payment_status' => 'pending',
            'subtotal' => 10, 'delivery_fee' => 0, 'total' => 10,
        ]);
    }

    public function test_orders_are_scoped_to_the_managers_store(): void
    {
        $this->makeOrder($this->storeA, 'SO-A-1');
        $this->makeOrder($this->storeB, 'SO-B-1');

        $data = $this->actingAs($this->managerA)
            ->getJson('/api/store/orders')
            ->assertStatus(200)
            ->json('data.data');

        $this->assertCount(1, $data);
        $this->assertSame('SO-A-1', $data[0]['order_number']);
    }

    public function test_store_inventory_returns_root_relative_product_image_paths(): void
    {
        // The image has to exist on the public disk for its URL to be worth
        // returning, so materialise it and clean up afterwards. This is the
        // pass-through branch of MediaService::relative().
        $relative = 'products/inventory-cat/test-product.webp';
        $absolute = public_path($relative);
        File::ensureDirectoryExists(dirname($absolute));
        File::put($absolute, 'test-bytes');

        try {
            $this->makeInventoryProduct($relative);

            $this->actingAs($this->managerA)
                ->getJson('/api/store/inventory')
                ->assertStatus(200)
                ->assertJsonPath('data.0.product.image', '/products/inventory-cat/test-product.webp');
        } finally {
            File::delete($absolute);
            File::deleteDirectory(public_path('products/inventory-cat'));
        }
    }

    public function test_store_inventory_falls_back_to_a_raster_placeholder_for_missing_images(): void
    {
        // The regression this guards: a stored path with no file behind it
        // used to be emitted verbatim (a 404 in the UI) or as an SVG, which
        // next/image refuses to optimise — leaving the card imageless.
        $this->makeInventoryProduct('products/inventory-cat/never-existed.webp');

        $this->actingAs($this->managerA)
            ->getJson('/api/store/inventory')
            ->assertStatus(200)
            ->assertJsonPath('data.0.product.image', '/products/product-placeholder.webp');
    }

    private function makeInventoryProduct(string $image): void
    {
        $category = Category::create(['name' => 'Inventory Cat', 'slug' => 'inventory-cat']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'unit' => 'each',
            'price' => 10,
            'image' => $image,
            'is_active' => true,
        ]);
        StoreProduct::create([
            'store_id' => $this->storeA->id,
            'product_id' => $product->id,
            'stock_quantity' => 5,
            'is_available' => true,
        ]);
    }

    public function test_store_orders_include_every_product_snapshot(): void
    {
        $category = Category::create(['name' => 'Order Cat', 'slug' => 'order-cat']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'unit' => 'each',
            'price' => 10,
            'is_active' => true,
        ]);
        $order = $this->makeOrder($this->storeA, 'SO-A-MANY');

        foreach (range(1, 8) as $number) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => $number,
                'unit_price' => 10,
                'total_price' => 10 * $number,
                'product_snapshot' => [
                    'name' => "Product {$number}",
                    'image' => '/products/order-cat/test-product.jpg',
                    'unit' => 'each',
                    'slug' => 'test-product',
                ],
            ]);
        }

        $items = $this->actingAs($this->managerA)
            ->getJson('/api/store/orders')
            ->assertStatus(200)
            ->json('data.data.0.items');

        $this->assertCount(8, $items);
        $this->assertSame('Product 8', $items[7]['product_snapshot']['name']);
    }

    public function test_per_page_is_capped(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            $this->makeOrder($this->storeA, 'SO-C-'.$i);
        }

        $response = $this->actingAs($this->managerA)
            ->getJson('/api/store/orders?per_page=100000')
            ->assertStatus(200);

        $this->assertLessThanOrEqual(100, $response->json('data.per_page'));
    }

    public function test_status_update_on_another_stores_order_is_404(): void
    {
        $orderB = $this->makeOrder($this->storeB, 'SO-B-2', 'confirmed');

        $this->actingAs($this->managerA)
            ->patchJson("/api/store/orders/{$orderB->id}/status", ['status' => 'preparing'])
            ->assertStatus(404);

        $this->assertSame('confirmed', $orderB->fresh()->status->value);
    }

    public function test_invalid_transition_is_409(): void
    {
        $order = $this->makeOrder($this->storeA, 'SO-A-2', 'pending');

        // pending → out_for_delivery is not a valid transition.
        $this->actingAs($this->managerA)
            ->patchJson("/api/store/orders/{$order->id}/status", ['status' => 'out_for_delivery'])
            ->assertStatus(409)
            ->assertJsonPath('reason', 'invalid_transition');

        $this->assertSame('pending', $order->fresh()->status->value);
    }

    public function test_valid_transition_succeeds(): void
    {
        $order = $this->makeOrder($this->storeA, 'SO-A-3', 'pending');

        $this->actingAs($this->managerA)
            ->patchJson("/api/store/orders/{$order->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');
    }
}
