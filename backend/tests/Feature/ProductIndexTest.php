<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductIndexTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
    }

    private function createProducts(int $count): void
    {
        for ($i = 1; $i <= $count; $i++) {
            Product::create([
                'category_id' => $this->category->id,
                'name' => "Product {$i}",
                'slug' => "product-{$i}",
                'unit' => 'each',
                'price' => 10.00,
                'is_active' => true,
            ]);
        }
    }

    public function test_index_respects_per_page_param(): void
    {
        $this->createProducts(25);

        $response = $this->getJson('/api/products?per_page=100');

        $response->assertStatus(200)
            ->assertJsonPath('per_page', 100)
            ->assertJsonPath('total', 25)
            ->assertJsonCount(25, 'data');
    }

    public function test_index_filters_by_multiple_category_slugs(): void
    {
        $beverages = $this->category;
        $bakery = Category::create(['name' => 'Bakery', 'slug' => 'bakery']);
        $household = Category::create(['name' => 'Household', 'slug' => 'household']);

        Product::create(['category_id' => $beverages->id, 'name' => 'Cola', 'slug' => 'cola', 'unit' => 'each', 'price' => 10.00, 'is_active' => true]);
        Product::create(['category_id' => $bakery->id, 'name' => 'Bread', 'slug' => 'bread', 'unit' => 'each', 'price' => 10.00, 'is_active' => true]);
        Product::create(['category_id' => $household->id, 'name' => 'Soap', 'slug' => 'soap', 'unit' => 'each', 'price' => 10.00, 'is_active' => true]);

        // Group filtering happens server-side (comma-separated slugs) so the
        // web client never downloads the whole catalogue.
        $this->getJson('/api/products?categories=bakery,household')
            ->assertStatus(200)
            ->assertJsonPath('total', 2)
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/products?categories=bakery')
            ->assertStatus(200)
            ->assertJsonPath('total', 1);

        $this->getJson('/api/products?categories=')
            ->assertStatus(200)
            ->assertJsonPath('total', 3);
    }

    public function test_index_defaults_to_twenty_per_page(): void
    {
        $this->createProducts(25);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonPath('per_page', 20)
            ->assertJsonPath('total', 25)
            ->assertJsonCount(20, 'data');
    }

    public function test_index_caps_per_page_at_one_hundred(): void
    {
        $this->createProducts(120);

        $response = $this->getJson('/api/products?per_page=500');

        $response->assertStatus(200)
            ->assertJsonPath('per_page', 100)
            ->assertJsonCount(100, 'data')
            ->assertJsonPath('last_page', 2);
    }

    public function test_index_ignores_non_numeric_per_page(): void
    {
        $this->createProducts(25);

        $response = $this->getJson('/api/products?per_page=abc');

        $response->assertStatus(200)
            ->assertJsonPath('per_page', 20)
            ->assertJsonCount(20, 'data');
    }
}
