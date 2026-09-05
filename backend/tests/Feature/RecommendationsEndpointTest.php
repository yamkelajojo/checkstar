<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationsEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_cold_start_returns_recommendations_for_new_customer(): void
    {
        $user = User::factory()->create(['role' => UserRole::Customer]);

        $category = Category::create(['name' => 'Rec Cat', 'slug' => 'rec-cat']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Rec Product', 'slug' => 'rec-product', 'unit' => 'each',
            'price' => 9.99, 'is_featured' => true, 'is_active' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/recommendations');

        $response->assertStatus(200)
            ->assertJsonPath('isPersonalised', false)
            ->assertJsonCount(1, 'recommendations')
            ->assertJsonPath('recommendations.0.id', $product->id);

        $this->assertNull($response->json('profileSummary'));
    }

    public function test_inactive_products_are_never_recommended(): void
    {
        $user = User::factory()->create(['role' => UserRole::Customer]);

        $category = Category::create(['name' => 'Rec Cat 2', 'slug' => 'rec-cat-2']);
        Product::create([
            'category_id' => $category->id,
            'name' => 'Hidden Product', 'slug' => 'hidden-product', 'unit' => 'each',
            'price' => 9.99, 'is_active' => false,
        ]);

        $this->actingAs($user)
            ->getJson('/api/recommendations')
            ->assertStatus(200)
            ->assertJsonCount(0, 'recommendations');
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/recommendations')->assertStatus(401);
    }
}
