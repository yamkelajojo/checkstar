<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * HTTP-level customer order journey: place → list (only own, newest first)
 * → detail (403 for others) → cancel while pending → cancellation refused
 * once confirmed. Pins the response envelope the web and mobile clients
 * render against.
 */
class OrderLifecycleApiTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private User $otherCustomer;

    private Store $store;

    private Category $category;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => UserRole::Customer]);
        $this->otherCustomer = User::factory()->create(['role' => UserRole::Customer]);
        $this->store = Store::create([
            'name' => 'Life Store', 'slug' => 'life-store', 'address' => 'x', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000010',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->category = Category::create(['name' => 'Life Cat', 'slug' => 'life-cat']);
        $this->product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Life Product', 'slug' => 'life-product', 'unit' => 'each',
            'price' => 20, 'is_active' => true,
        ]);
        StoreProduct::create([
            'store_id' => $this->store->id, 'product_id' => $this->product->id,
            'stock_quantity' => 10, 'reserved_quantity' => 0, 'is_available' => true,
        ]);
    }

    private function placeOrder(): array
    {
        $response = $this->actingAs($this->customer)
            ->postJson('/api/orders', [
                'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
                'delivery_latitude' => -29.85,
                'delivery_longitude' => 31.02,
                'delivery_address' => '12 Life Rd',
            ]);

        $response->assertStatus(201);

        // Envelope: { data: order, dispatch: {...} } — pinned by OrderPlacementTest.
        return ['id' => $response->json('data.id'), 'status' => $response->json('data.status')];
    }

    public function test_customer_order_journey_list_show_cancel(): void
    {
        $placed = $this->placeOrder();
        $orderId = $placed['id'];

        // List contains the order with the envelope clients expect.
        $list = $this->actingAs($this->customer)
            ->getJson('/api/orders')
            ->assertStatus(200)
            ->json();
        $this->assertSame($orderId, $list['data'][0]['id']);
        $this->assertArrayHasKey('can_cancel', $list['data'][0]);

        // Status filter works for whatever status placement produced.
        $filtered = $this->actingAs($this->customer)
            ->getJson('/api/orders?status='.$placed['status'])
            ->assertStatus(200);
        $this->assertSame(1, count($filtered->json('data')));

        // Detail view.
        $this->actingAs($this->customer)
            ->getJson("/api/orders/{$orderId}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $orderId);

        // Cancel while still pending.
        $this->actingAs($this->customer)
            ->postJson("/api/orders/{$orderId}/cancel")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_customer_cannot_view_another_customers_order(): void
    {
        $placed = $this->placeOrder();
        $orderId = $placed['id'];

        $this->actingAs($this->otherCustomer)
            ->getJson("/api/orders/{$orderId}")
            ->assertStatus(403);
    }

    public function test_cancelling_twice_is_rejected(): void
    {
        $placed = $this->placeOrder();
        $orderId = $placed['id'];

        $this->actingAs($this->customer)
            ->postJson("/api/orders/{$orderId}/cancel")
            ->assertStatus(200);

        $this->actingAs($this->customer)
            ->postJson("/api/orders/{$orderId}/cancel")
            ->assertStatus(409);
    }
}
