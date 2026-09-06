<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Item-to-item related products for the product page: same aisle first,
 * bought-together next, popularity backfill; never the product itself,
 * never inactive products.
 */
class RelatedProductsTest extends TestCase
{
    use RefreshDatabase;

    private function makeStore(): Store
    {
        return Store::create([
            'name' => 'Related Store',
            'slug' => 'related-store',
            'address' => '1 Aisle Way',
            'city' => 'Durban',
            'province' => 'KwaZulu-Natal',
            'postal_code' => '4001',
            'phone' => '+27 31 555 0111',
            'latitude' => '-29.8587',
            'longitude' => '31.0218',
            'delivery_radius_km' => 10,
            'is_active' => true,
        ]);
    }

    private function makeProduct(Category $category, string $name, float $price, bool $active = true): Product
    {
        return Product::create([
            'category_id' => $category->id,
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::random(5),
            'unit' => 'each',
            'price' => $price,
            'is_active' => $active,
        ]);
    }

    private function stock(Store $store, Product $product, int $qty = 10): void
    {
        StoreProduct::create([
            'store_id' => $store->id,
            'product_id' => $product->id,
            'stock_quantity' => $qty,
            'is_available' => true,
        ]);
    }

    private function orderWith(User $customer, Product ...$products): Order
    {
        $order = Order::create([
            'order_number' => 'CS-REL-'.strtoupper(Str::random(6)),
            'customer_id' => $customer->id,
            'store_id' => Store::first()->id,
            'status' => 'delivered',
            'payment_status' => 'paid',
            'fulfilment_method' => 'delivery',
            'delivery_address' => '1 Test Street',
            'delivery_latitude' => -29.8587,
            'delivery_longitude' => 31.0218,
            'subtotal' => 0,
            'delivery_fee' => 0,
            'total' => 0,
        ]);

        foreach ($products as $p) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $p->id,
                'quantity' => 1,
                'unit_price' => $p->price,
                'total_price' => $p->price,
                'product_snapshot' => json_encode(['name' => $p->name]),
            ]);
        }

        return $order;
    }

    public function test_related_endpoint_returns_same_category_first_and_excludes_self(): void
    {
        $store = $this->makeStore();
        $customer = User::create([
            'name' => 'Rel Customer',
            'email' => 'rel@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::Customer,
            'phone' => '+27 82 555 0123',
            'is_active' => true,
        ]);

        $dairy = Category::create(['name' => 'Dairy', 'slug' => 'dairy']);
        $snacks = Category::create(['name' => 'Snacks', 'slug' => 'snacks']);

        $milk = $this->makeProduct($dairy, 'Full Cream Milk 1L', 21.99);
        $yogurt = $this->makeProduct($dairy, 'Double Cream Yogurt 1kg', 39.99);
        $cheese = $this->makeProduct($dairy, 'Cheddar Block 500g', 74.99);
        $chips = $this->makeProduct($snacks, 'Salted Chips 125g', 16.99);
        $this->makeProduct($dairy, 'Old Milk', 19.99, active: false);

        foreach ([$milk, $yogurt, $cheese, $chips] as $p) {
            $this->stock($store, $p);
        }

        // Chips is hugely popular — proves category still outranks raw popularity.
        $this->orderWith($customer, $milk, $chips);
        $this->orderWith($customer, $milk, $chips);
        $this->orderWith($customer, $milk, $chips);

        $response = $this->getJson("/api/products/{$milk->slug}/related");

        $response->assertStatus(200)->assertJsonStructure(['data' => [['id', 'name', 'slug', 'price']]]);

        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertContains($yogurt->slug, $slugs);
        $this->assertContains($cheese->slug, $slugs);
        $this->assertContains($chips->slug, $slugs);

        $ids = collect($response->json('data'))->pluck('id')->all();
        $this->assertNotContains($milk->id, $ids, 'The product itself must never be recommended');
        $this->assertNotContains(
            Product::where('name', 'Old Milk')->first()->id,
            $ids,
            'Inactive products must never be recommended'
        );

        // Both dairy siblings outrank the (more popular) chips: category is
        // weighted above popularity.
        $dairyPositions = [
            array_search($yogurt->slug, $slugs),
            array_search($cheese->slug, $slugs),
        ];
        $chipsPosition = array_search($chips->slug, $slugs);
        $this->assertLessThan($chipsPosition, max($dairyPositions));
    }

    public function test_bought_together_beats_plain_category_siblings(): void
    {
        $store = $this->makeStore();
        $customer = User::create([
            'name' => 'Basket Customer',
            'email' => 'basket@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::Customer,
            'phone' => '+27 82 555 0124',
            'is_active' => true,
        ]);

        $breakfast = Category::create(['name' => 'Breakfast', 'slug' => 'breakfast']);

        $cereal = $this->makeProduct($breakfast, 'Cereal Box 750g', 54.99);
        $longLifeMilk = $this->makeProduct($breakfast, 'Long Life Milk 1L', 24.99);
        $oats = $this->makeProduct($breakfast, 'Rolled Oats 1kg', 42.99);

        foreach ([$cereal, $longLifeMilk, $oats] as $p) {
            $this->stock($store, $p);
        }

        // Oats is repeatedly bought WITH cereal; long life milk is not.
        for ($i = 0; $i < 4; $i++) {
            $this->orderWith($customer, $cereal, $oats);
        }

        $slugs = collect($this->getJson("/api/products/{$cereal->slug}/related")->json('data'))
            ->pluck('slug')->all();

        $this->assertLessThan(
            array_search($longLifeMilk->slug, $slugs),
            array_search($oats->slug, $slugs),
            'The co-purchased item should rank above the plain category sibling'
        );
    }

    public function test_sparse_results_are_backfilled_with_popular_products(): void
    {
        $store = $this->makeStore();
        $pantry = Category::create(['name' => 'Pantry', 'slug' => 'pantry-'.Str::random(4)]);
        $cleaning = Category::create(['name' => 'Cleaning', 'slug' => 'cleaning-'.Str::random(4)]);

        $lonely = $this->makeProduct($pantry, 'Rare Jam 250g', 34.99);
        $this->stock($store, $lonely);

        $popular = [];
        foreach (['Soap', 'Dishwash', 'Bleach', 'Sponge'] as $i => $name) {
            $popular[$name] = $this->makeProduct($cleaning, $name, 12.99 + $i);
            $this->stock($store, $popular[$name]);
        }
        // Bleach ordered the most.
        $customer = User::create([
            'name' => 'Backfill Customer',
            'email' => 'backfill@example.com',
            'password' => Hash::make('password123'),
            'role' => \App\Enums\UserRole::Customer,
            'phone' => '+27 82 555 0125',
            'is_active' => true,
        ]);
        $this->orderWith($customer, $lonely, $popular['Bleach']);
        $this->orderWith($customer, $popular['Bleach']);

        $response = $this->getJson("/api/products/{$lonely->slug}/related?limit=8");
        $response->assertStatus(200);

        $slugs = collect($response->json('data'))->pluck('slug')->all();
        $this->assertCount(4, $slugs, 'Backfill should fill the shelf with the other active products');

        $popularSlugs = collect($popular)->pluck('slug')->all();
        foreach ($popularSlugs as $slug) {
            $this->assertContains($slug, $slugs);
        }
    }

    public function test_related_returns_404_for_unknown_or_inactive_slug(): void
    {
        $this->getJson('/api/products/does-not-exist/related')->assertStatus(404);

        $store = $this->makeStore();
        $cat = Category::create(['name' => 'Ghost', 'slug' => 'ghost']);
        $ghost = $this->makeProduct($cat, 'Ghost Item', 9.99, active: false);
        $this->getJson("/api/products/{$ghost->slug}/related")->assertStatus(404);
    }
}
