<?php

namespace Tests\Feature;

use App\Enums\StaffRole;
use App\Enums\UserRole;
use App\Models\BannerCreative;
use App\Models\Category;
use App\Models\Product;
use App\Models\Special;
use App\Models\Store;
use App\Models\StoreProduct;
use App\Models\StoreStaff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * P3 — sales (Specials) are store-owned and banners can front them.
 *
 * Covers the scope locked with the user:
 *  - sales are per-store; owners/managers manage their own store only
 *  - logistics officers have no access to sales or banners
 *  - per-product special price is optional (default keeps product price)
 *  - banner ↔ sale link: click a banner → land on that sale's products
 */
class SalesAndBannersTest extends TestCase
{
    use RefreshDatabase;

    private Store $storeA;
    private Store $storeB;
    private User $ownerA;
    private User $managerA;
    private User $developer;
    private User $logistics;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storeA = $this->makeStore('store-a', 'Durban');
        $this->storeB = $this->makeStore('store-b', 'Pretoria');

        $this->ownerA = User::factory()->create([
            'name' => 'Owner A',
            'email' => 'owner-a@example.com',
            'role' => UserRole::StoreOwner,
            'store_id' => $this->storeA->id,
            'is_active' => true,
        ]);

        $this->managerA = User::factory()->create([
            'name' => 'Manager A',
            'email' => 'manager-a@example.com',
            'role' => UserRole::StoreManager,
            'is_active' => true,
        ]);
        StoreStaff::create([
            'user_id' => $this->managerA->id,
            'store_id' => $this->storeA->id,
            'role' => StaffRole::StoreManager->value,
        ]);

        $this->developer = User::factory()->create([
            'name' => 'Dev',
            'email' => 'dev@example.com',
            'role' => UserRole::Developer,
            'is_active' => true,
        ]);

        $this->logistics = User::factory()->create([
            'name' => 'Logi',
            'email' => 'logi@example.com',
            'role' => UserRole::LogisticsOfficer,
            'is_active' => true,
        ]);
    }

    private function makeStore(string $slug, string $city): Store
    {
        return Store::create([
            'name' => 'Store '.$slug, 'slug' => $slug, 'address' => 'a', 'city' => $city,
            'province' => 'KZN', 'postal_code' => '4001', 'phone' => '0310000000',
            'latitude' => -29.85, 'longitude' => 31.02, 'delivery_radius_km' => 10, 'is_active' => true,
        ]);
    }

    private function makeProduct(string $name, float $price): Product
    {
        $category = Category::firstOrCreate(['slug' => 'test-cat'], ['name' => 'Test Cat']);

        return Product::firstOrCreate(
            ['slug' => strtolower($name)],
            ['name' => $name, 'category_id' => $category->id, 'unit' => 'each', 'price' => $price, 'is_active' => true],
        );
    }

    private function salePayload(string $slug, array $overrides = []): array
    {
        return array_merge([
            'title' => 'Title '.$slug,
            'slug' => $slug,
            'start_date' => now()->subDay()->toDateString(),
            'end_date' => now()->addWeek()->toDateString(),
            'is_active' => true,
        ], $overrides);
    }

    // ------------------------------------------------------------------
    // Role access
    // ------------------------------------------------------------------

    public function test_logistics_officer_is_locked_out_of_sales(): void
    {
        $this->actingAs($this->logistics)->getJson('/api/admin/specials')->assertStatus(403);
        $this->actingAs($this->logistics)
            ->postJson('/api/admin/specials', $this->salePayload('nope'))
            ->assertStatus(403);
    }

    public function test_store_operator_sees_only_own_store_sales(): void
    {
        Special::create(array_merge($this->salePayload('sale-a'), ['store_id' => $this->storeA->id]));
        Special::create(array_merge($this->salePayload('sale-b'), ['store_id' => $this->storeB->id]));
        Special::create($this->salePayload('chain-wide')); // developer chain-wide

        $this->actingAs($this->ownerA)
            ->getJson('/api/admin/specials')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'sale-a');

        $this->actingAs($this->managerA)
            ->getJson('/api/admin/specials')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'sale-a');

        // Developer sees everything, chain-wide included.
        $this->actingAs($this->developer)
            ->getJson('/api/admin/specials')
            ->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    public function test_owner_cannot_touch_another_store_sale(): void
    {
        $foreign = Special::create(array_merge($this->salePayload('foreign'), ['store_id' => $this->storeB->id]));

        $this->actingAs($this->ownerA)->getJson('/api/admin/specials/'.$foreign->id)->assertStatus(403);
        $this->actingAs($this->ownerA)->putJson('/api/admin/specials/'.$foreign->id, ['title' => 'X'])->assertStatus(403);
        $this->actingAs($this->ownerA)->deleteJson('/api/admin/specials/'.$foreign->id)->assertStatus(403);

        // Developer can.
        $this->actingAs($this->developer)->getJson('/api/admin/specials/'.$foreign->id)->assertStatus(200);
    }

    // ------------------------------------------------------------------
    // Sale creation + product sync
    // ------------------------------------------------------------------

    public function test_owner_create_forces_own_store(): void
    {
        $this->actingAs($this->ownerA)
            ->postJson('/api/admin/specials', $this->salePayload('forced', ['store_id' => $this->storeB->id]))
            ->assertCreated()
            ->assertJsonPath('data.store.id', $this->storeA->id);
    }

    public function test_developer_can_create_chain_wide_sale(): void
    {
        $this->actingAs($this->developer)
            ->postJson('/api/admin/specials', $this->salePayload('chain'))
            ->assertCreated()
            ->assertJsonPath('data.store_id', null);
    }

    public function test_product_sync_attaches_and_detaches(): void
    {
        $a = $this->makeProduct('Apple Juice', 25.00);
        $b = $this->makeProduct('Orange Juice', 30.00);
        $sale = Special::create(array_merge($this->salePayload('juice'), ['store_id' => $this->storeA->id]));

        $this->actingAs($this->ownerA)
            ->putJson('/api/admin/specials/'.$sale->id.'/products', [
                'products' => [
                    ['product_id' => $a->id, 'special_price' => 19.99],
                    ['product_id' => $b->id], // no special price → keep own price
                ],
            ])
            ->assertStatus(200)
            ->assertJsonCount(2, 'data.products');

        $prices = collect($sale->fresh()->products)->pluck('special_price', 'id');
        $this->assertEqualsWithDelta(19.99, (float) $prices[$a->id], 0.001);
        $this->assertNull($prices[$b->id]);

        // Second sync drops product B and re-syncs A — idempotent.
        $this->actingAs($this->ownerA)
            ->putJson('/api/admin/specials/'.$sale->id.'/products', [
                'products' => [
                    ['product_id' => $a->id, 'special_price' => 17.50],
                ],
            ])
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.products');

        $after = $sale->fresh()->products()->pluck('special_price', 'id');
        $this->assertSame(1, $after->count());
        $this->assertEqualsWithDelta(17.50, (float) $after[$a->id], 0.001);
    }

    public function test_product_sync_cannot_touch_foreign_store_sale(): void
    {
        $foreign = Special::create(array_merge($this->salePayload('foreign-sync'), ['store_id' => $this->storeB->id]));
        $product = $this->makeProduct('Lemonade', 20.00);

        $this->actingAs($this->ownerA)
            ->putJson('/api/admin/specials/'.$foreign->id.'/products', [
                'products' => [['product_id' => $product->id]],
            ])
            ->assertStatus(403);
    }

    // ------------------------------------------------------------------
    // Public sale endpoints
    // ------------------------------------------------------------------

    public function test_public_special_show_returns_sale_with_products(): void
    {
        $store = $this->storeA;
        $product = $this->makeProduct('Cola', 20.00);
        StoreProduct::create([
            'store_id' => $store->id, 'product_id' => $product->id,
            'stock_quantity' => 5, 'is_available' => true,
        ]);

        $sale = Special::create(array_merge($this->salePayload('cola-week'), ['store_id' => $store->id]));
        $sale->products()->attach($product->id, ['special_price' => 15.00]);

        $response = $this->getJson('/api/specials/cola-week')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['slug', 'in_window', 'store', 'products' => [['effective_price', 'stores']]]]);

        $this->assertTrue($response->json('data.in_window'));
        $this->assertEqualsWithDelta(15.0, $response->json('data.products.0.effective_price'), 0.001);
        $this->assertSame($store->id, $response->json('data.products.0.stores.0.id'));
    }

    public function test_public_special_show_404_for_unknown_slug(): void
    {
        $this->getJson('/api/specials/does-not-exist')->assertStatus(404);
    }

    public function test_public_special_show_includes_ended_sale_with_flag(): void
    {
        $sale = Special::create(array_merge($this->salePayload('past'), [
            'start_date' => now()->subWeeks(2)->toDateString(),
            'end_date' => now()->subWeek()->toDateString(),
        ]));

        $this->getJson('/api/specials/past')
            ->assertStatus(200)
            ->assertJsonPath('data.slug', 'past')
            ->assertJsonPath('data.in_window', false);

        // But it must NOT appear in the active index.
        $this->getJson('/api/specials')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    // ------------------------------------------------------------------
    // Banner ↔ sale link
    // ------------------------------------------------------------------

    private function slidePayload(array $urlOverride = []): array
    {
        return array_merge([
            'title' => 'Hello',
            'subtitle' => 'World',
            'ctaLabel' => 'Go',
            'url' => '/products',
            'bgType' => 'solid',
            'colors' => ['#EB6522'],
        ], $urlOverride);
    }

    public function test_sale_banner_gets_sale_cta_on_every_slide(): void
    {
        $sale = Special::create(array_merge($this->salePayload('big-save'), ['store_id' => $this->storeA->id]));

        $this->actingAs($this->ownerA)
            ->postJson('/api/admin/banners', [
                'name' => 'Big Save',
                'store_id' => $this->storeA->id,
                'special_id' => $sale->id,
                'status' => 'published',
                'slides' => [
                    $this->slidePayload(['url' => '/somewhere-else']),
                    $this->slidePayload(),
                ],
            ])
            ->assertCreated()
            ->assertJsonPath('data.special.id', $sale->id);

        $banner = BannerCreative::where('name', 'Big Save')->first();
        $this->assertCount(2, $banner->slides);
        $this->assertSame('/specials/big-save', $banner->slides[0]['url']);
        $this->assertSame('/specials/big-save', $banner->slides[1]['url']);
    }

    public function test_standalone_banner_stays_standalone(): void
    {
        $this->actingAs($this->ownerA)
            ->postJson('/api/admin/banners', [
                'name' => 'Brand Only',
                'store_id' => $this->storeA->id,
                'status' => 'published',
                'slides' => [$this->slidePayload()],
            ])
            ->assertCreated()
            ->assertJsonPath('data.special_id', null);

        // Public feed keeps it without a special summary.
        $this->getJson('/api/banners')
            ->assertStatus(200)
            ->assertJsonPath('data.0.special', null);
    }

    public function test_public_banners_expose_special_summary_for_sale_banners(): void
    {
        $sale = Special::create(array_merge($this->salePayload('linked'), ['store_id' => $this->storeA->id]));
        BannerCreative::create([
            'name' => 'Linked Banner',
            'store_id' => $this->storeA->id,
            'special_id' => $sale->id,
            'created_by' => $this->developer->id,
            'status' => 'published',
            'slides' => [$this->slidePayload(['url' => '/specials/linked'])],
        ]);

        $this->getJson('/api/banners')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.special.slug', 'linked')
            ->assertJsonPath('data.0.special.title', 'Title linked');
    }

    public function test_owner_cannot_link_another_stores_sale(): void
    {
        $foreign = Special::create(array_merge($this->salePayload('foreign-banner'), ['store_id' => $this->storeB->id]));

        $this->actingAs($this->ownerA)
            ->postJson('/api/admin/banners', [
                'name' => 'Sneaky',
                'store_id' => $this->storeA->id,
                'special_id' => $foreign->id,
                'status' => 'draft',
                'slides' => [$this->slidePayload()],
            ])
            ->assertStatus(403);
    }
}
