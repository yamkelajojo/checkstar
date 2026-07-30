<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\Product;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private PricingService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new PricingService;
    }

    public function test_returns_regular_price_when_no_sale_price_and_no_specials(): void
    {
        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Coca-Cola 2L',
            'slug' => 'coca-cola-2l',
            'unit' => 'each',
            'price' => 22.00,
            'sale_price' => null,
        ]);

        $price = $this->service->effectivePrice($product);

        $this->assertSame(22.00, $price);
    }

    public function test_returns_sale_price_when_set(): void
    {
        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Coca-Cola 2L',
            'slug' => 'coca-cola-2l',
            'unit' => 'each',
            'price' => 22.00,
            'sale_price' => 18.00,
        ]);

        $price = $this->service->effectivePrice($product);

        $this->assertSame(18.00, $price);
    }

    public function test_returns_regular_price_when_belongs_to_collection_special(): void
    {
        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Coca-Cola 2L',
            'slug' => 'coca-cola-2l',
            'unit' => 'each',
            'price' => 22.00,
            'sale_price' => null,
        ]);

        $price = $this->service->effectivePrice($product);

        $this->assertSame(22.00, $price);
    }

    public function test_sale_price_takes_priority_over_collection_special(): void
    {
        $category = Category::create(['name' => 'Beverages', 'slug' => 'beverages']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Coca-Cola 2L',
            'slug' => 'coca-cola-2l',
            'unit' => 'each',
            'price' => 22.00,
            'sale_price' => 18.00,
        ]);

        $price = $this->service->effectivePrice($product);

        $this->assertSame(18.00, $price);
    }
}
