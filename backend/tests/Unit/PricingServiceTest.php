<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\Product;
use App\Models\Special;
use App\Services\PricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingServiceTest extends TestCase
{
    use RefreshDatabase;

    private PricingService $pricing;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pricing = new PricingService;
        $this->category = Category::create(['name' => 'Pricing Cat', 'slug' => 'pricing-cat']);
    }

    private function makeProduct(float $price, ?float $sale = null): Product
    {
        return Product::create([
            'category_id' => $this->category->id,
            'name' => 'P '.uniqid(),
            'slug' => 'p-'.uniqid(),
            'unit' => 'each',
            'price' => $price,
            'sale_price' => $sale,
            'is_active' => true,
        ]);
    }

    public function test_base_price_when_no_deals(): void
    {
        $product = $this->makeProduct(20.00);

        $this->assertSame(20.0, $this->pricing->effectivePrice($product));
    }

    public function test_sale_price_wins_when_below_base(): void
    {
        $product = $this->makeProduct(20.00, 15.00);

        $this->assertSame(15.0, $this->pricing->effectivePrice($product));
    }

    public function test_sale_price_above_base_never_overcharges(): void
    {
        // A mistyped admin edit (sale_price > price) must not raise the price.
        $product = $this->makeProduct(20.00, 25.00);

        $this->assertSame(20.0, $this->pricing->effectivePrice($product));
    }

    public function test_special_pivot_price_is_honoured(): void
    {
        $product = $this->makeProduct(20.00);
        $special = Special::create([
            'title' => 'Deal', 'slug' => 'deal-'.uniqid(),
            'start_date' => now()->subDay(), 'end_date' => now()->addDay(), 'is_active' => true,
        ]);
        $special->products()->attach($product->id, ['special_price' => 12.00]);
        $product->load('specials');

        $this->assertSame(12.0, $this->pricing->effectivePrice($product, $product->specials));
    }

    public function test_special_price_above_base_never_overcharges(): void
    {
        $product = $this->makeProduct(20.00);
        $special = Special::create([
            'title' => 'Bad Deal', 'slug' => 'bad-'.uniqid(),
            'start_date' => now()->subDay(), 'end_date' => now()->addDay(), 'is_active' => true,
        ]);
        $special->products()->attach($product->id, ['special_price' => 30.00]);
        $product->load('specials');

        $this->assertSame(20.0, $this->pricing->effectivePrice($product, $product->specials));
    }

    public function test_sale_price_takes_priority_over_specials(): void
    {
        // Documented cascade (web pricing.ts + PricingService): product-level
        // sale_price outranks collection specials.
        $product = $this->makeProduct(20.00, 18.00);
        $special = Special::create([
            'title' => 'Cheaper', 'slug' => 'cheaper-'.uniqid(),
            'start_date' => now()->subDay(), 'end_date' => now()->addDay(), 'is_active' => true,
        ]);
        $special->products()->attach($product->id, ['special_price' => 14.00]);
        $product->load('specials');

        $this->assertSame(18.0, $this->pricing->effectivePrice($product, $product->specials));
    }
}
