<?php

namespace Tests\Feature;

use App\Models\CareerListing;
use App\Models\Category;
use App\Models\CommunityPost;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Store;
use App\Models\StoreProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * System-level smoke for the public content endpoints the web home page,
 * catalogue and content pages are built on. Guests only — every endpoint
 * here must work unauthenticated.
 */
class PublicCatalogueTest extends TestCase
{
    use RefreshDatabase;

    private Store $store;

    private Category $category;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store = Store::create([
            'name' => 'Public Store', 'slug' => 'public-store', 'address' => 'x', 'city' => 'Durban',
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000009',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
        $this->category = Category::create(['name' => 'Public Cat', 'slug' => 'public-cat']);
        $this->product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Public Product', 'slug' => 'public-product', 'unit' => 'each',
            'price' => 7.5, 'is_active' => true,
        ]);
        StoreProduct::create([
            'store_id' => $this->store->id, 'product_id' => $this->product->id,
            'stock_quantity' => 5, 'reserved_quantity' => 0, 'is_available' => true,
        ]);
    }

    public function test_guest_can_list_stores_and_view_one_by_slug(): void
    {
        $this->getJson('/api/stores')
            ->assertStatus(200)
            ->assertJsonPath('data.0.slug', 'public-store');

        $this->getJson('/api/stores/public-store')
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Public Store');
    }

    public function test_guest_can_browse_categories_and_products(): void
    {
        $this->getJson('/api/categories')
            ->assertStatus(200)
            ->assertJsonPath('data.0.slug', 'public-cat');

        $this->getJson('/api/products/public-product')
            ->assertStatus(200)
            ->assertJsonPath('data.id', $this->product->id);
    }

    public function test_guest_can_read_recipes_and_unpublished_are_hidden(): void
    {
        Recipe::create([
            'title' => 'Toast', 'slug' => 'toast', 'ingredients' => [['name' => 'Bread', 'quantity' => '1']],
            'method' => 'Toast it', 'is_published' => true,
        ]);
        Recipe::create([
            'title' => 'Secret Dish', 'slug' => 'secret-dish', 'ingredients' => [],
            'method' => 'Hide it', 'is_published' => false,
        ]);

        $this->getJson('/api/recipes')->assertStatus(200)->assertJsonPath('data.0.slug', 'toast');
        $this->getJson('/api/recipes/toast')->assertStatus(200)->assertJsonPath('data.title', 'Toast');
        $this->getJson('/api/recipes/secret-dish')->assertStatus(404);
    }

    public function test_guest_can_read_careers_and_community_posts(): void
    {
        CareerListing::create([
            'title' => 'Driver', 'slug' => 'driver', 'description' => 'Drive things',
            'location' => 'Durban', 'type' => 'full_time', 'is_active' => true,
        ]);
        CommunityPost::create([
            'title' => 'Hello', 'slug' => 'hello', 'content' => 'Hi', 'category' => 'gallery', 'is_published' => true,
        ]);
        CommunityPost::create([
            'title' => 'Draft', 'slug' => 'draft', 'content' => 'x', 'category' => 'gallery', 'is_published' => false,
        ]);

        $this->getJson('/api/careers')->assertStatus(200)->assertJsonPath('data.0.slug', 'driver');
        $this->getJson('/api/community-posts')->assertStatus(200)->assertJsonPath('data.0.slug', 'hello');
        $this->getJson('/api/community-posts?category=gallery')->assertStatus(200);
    }

    public function test_guest_can_submit_a_contact_message(): void
    {
        $this->postJson('/api/contact', [
            'name' => 'Thandi',
            'email' => 'thandi@example.com',
            'subject' => 'Question',
            'message' => 'Do you deliver on Sundays?',
        ])->assertStatus(201);

        $this->assertDatabaseHas('contact_messages', ['email' => 'thandi@example.com']);
    }

    public function test_contact_validation_rejects_garbage(): void
    {
        $this->postJson('/api/contact', ['name' => '', 'email' => 'nope', 'message' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'message']);
    }
}
