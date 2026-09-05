<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\Special;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SpecialsEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_lists_only_active_specials_within_their_window(): void
    {
        $active = Special::create(['title' => 'Live Deal', 'slug' => 'live', 'start_date' => now()->subDay(), 'end_date' => now()->addDay(), 'is_active' => true]);
        Special::create(['title' => 'Future', 'slug' => 'future', 'start_date' => now()->addWeek(), 'end_date' => now()->addWeeks(2), 'is_active' => true]);
        Special::create(['title' => 'Expired', 'slug' => 'expired', 'start_date' => now()->subWeeks(2), 'end_date' => now()->subWeek(), 'is_active' => true]);
        Special::create(['title' => 'Disabled', 'slug' => 'disabled', 'start_date' => now()->subDay(), 'end_date' => now()->addDay(), 'is_active' => false]);

        $response = $this->getJson('/api/specials');

        $response->assertStatus(200);
        $titles = collect($response->json('data'))->pluck('title')->all();
        $this->assertSame([$active->title], $titles);
    }

    public function test_products_carry_availability_and_effective_price(): void
    {
        $user = User::create([
            'name' => 'C', 'email' => 'specials@example.com', 'password' => Hash::make('password'),
            'role' => UserRole::Customer, 'is_active' => true,
        ]);

        $store = Store::create([
            'name' => 'Store', 'slug' => 'store-1', 'address' => 'a', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000000',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10,
            'is_active' => true,
        ]);

        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $product = Product::create([
            'category_id' => $category->id, 'name' => 'Cola', 'slug' => 'cola', 'unit' => 'each',
            'price' => 20.00, 'is_active' => true,
        ]);
        StoreProduct::create(['store_id' => $store->id, 'product_id' => $product->id, 'stock_quantity' => 7, 'is_available' => true]);

        $special = Special::create(['title' => 'Cola Week', 'slug' => 'cola-week', 'start_date' => now()->subDay(), 'end_date' => now()->addDay(), 'is_active' => true]);
        // Attach at a special price of R15 via the pivot.
        $special->products()->attach($product->id, ['special_price' => 15.00]);

        $this->actingAs($user)
            ->getJson('/api/specials')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['products' => [['effective_price', 'stores', 'category']]]]])
            ->assertJsonPath('data.0.products.0.effective_price', 15.0)
            ->assertJsonPath('data.0.products.0.stores.0.id', $store->id)
            ->assertJsonPath('data.0.products.0.stores.0.stock_quantity', 7);
    }

    public function test_inactive_products_are_hidden_from_specials(): void
    {
        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $live = Product::create(['category_id' => $category->id, 'name' => 'Live', 'slug' => 'live', 'unit' => 'each', 'price' => 10.00, 'is_active' => true]);
        Product::create(['category_id' => $category->id, 'name' => 'Ghost', 'slug' => 'ghost', 'unit' => 'each', 'price' => 10.00, 'is_active' => false]);

        $ghost = Product::where('slug', 'ghost')->first();
        $special = Special::create(['title' => 'Mix', 'slug' => 'mix', 'start_date' => now()->subDay(), 'end_date' => now()->addDay(), 'is_active' => true]);
        $special->products()->attach([
            $live->id => ['special_price' => 8.00],
            $ghost->id => ['special_price' => 9.00],
        ]);

        $products = $this->getJson('/api/specials')
            ->assertStatus(200)
            ->json('data.0.products');

        $this->assertCount(1, $products);
        $this->assertSame('Live', $products[0]['name']);
        $this->assertArrayHasKey('stores', $products[0]);
    }
}
