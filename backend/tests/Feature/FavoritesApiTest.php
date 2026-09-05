<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductFavorite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Customer favourites: the mobile app drives these endpoints. Contract:
 * duplicate favourites are a 409 (never a 500 from the unique index —
 * double-taps race the exists() check), unfavourite is idempotent.
 */
class FavoritesApiTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => UserRole::Customer]);
        $category = Category::create(['name' => 'Fav Cat', 'slug' => 'fav-cat']);
        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Fav Product', 'slug' => 'fav-product', 'unit' => 'each',
            'price' => 12.5, 'is_active' => true,
        ]);
    }

    public function test_customer_can_favorite_and_list(): void
    {
        $this->actingAs($this->customer)
            ->postJson('/api/favorites', ['product_id' => $this->product->id])
            ->assertStatus(201);

        $response = $this->actingAs($this->customer)->getJson('/api/favorites');
        $response->assertStatus(200);
        $this->assertSame(1, count($response->json('data')));
        $this->assertSame($this->product->id, $response->json('data.0.product.id'));
    }

    public function test_duplicate_favorite_is_409_not_500(): void
    {
        $this->actingAs($this->customer)
            ->postJson('/api/favorites', ['product_id' => $this->product->id])
            ->assertStatus(201);

        // Second attempt (and any racer that beats the exists() check) must
        // hit the friendly 409, not a QueryException from the unique index.
        $this->actingAs($this->customer)
            ->postJson('/api/favorites', ['product_id' => $this->product->id])
            ->assertStatus(409);

        $this->assertSame(1, ProductFavorite::where('customer_id', $this->customer->id)->count());
    }

    public function test_unfavorite_is_idempotent(): void
    {
        $this->actingAs($this->customer)
            ->deleteJson("/api/favorites/{$this->product->id}")
            ->assertStatus(204);

        // Unfavouriting something not favourited is still a success.
        $this->actingAs($this->customer)
            ->deleteJson("/api/favorites/{$this->product->id}")
            ->assertStatus(204);
    }

    public function test_check_endpoint_reports_favorited_state(): void
    {
        $this->actingAs($this->customer)
            ->getJson("/api/favorites/{$this->product->id}/check")
            ->assertStatus(200)
            ->assertJsonPath('isFavorited', false);

        ProductFavorite::create(['customer_id' => $this->customer->id, 'product_id' => $this->product->id]);

        $this->actingAs($this->customer)
            ->getJson("/api/favorites/{$this->product->id}/check")
            ->assertStatus(200)
            ->assertJsonPath('isFavorited', true);
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/favorites')->assertStatus(401);
    }
}
