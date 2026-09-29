<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreStaff;
use App\Models\User;
use App\Services\MediaService;
use Database\Seeders\BannerSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\ProductSeeder;
use Database\Seeders\RecipeSeeder;
use Database\Seeders\SouthAfricanPantrySeeder;
use Database\Seeders\SouthAfricanRecipeSeeder;
use Database\Seeders\SpecialSeeder;
use Database\Seeders\StoreSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The regression that started this whole audit: seeded products pointed at
 * image files that do not exist in backend/public, and the URLs that escaped
 * the API either 404'd or pointed at an SVG the Next.js image optimizer
 * refuses — so those cards rendered with no image at all while every unit
 * test stayed green (none of them looked at the real public/ directory).
 *
 * These tests run the *real* seeders and then check the media the API emits
 * against the *real* filesystem, so a stale seed path can never ship again.
 *
 * ## The standing rule
 *
 * **A product with no usable image must never reach a Customer.**
 *
 * Two ways that rule gets broken, two tests catching them:
 *  - a stored path points at a file that does not exist → the filesystem
 *    assertions below;
 *  - `MediaService` quietly swaps in `products/product-placeholder.webp` →
 *    `test_no_customer_facing_product_is_served_the_fallback_placeholder`,
 *    which is the one the other assertions *cannot* make: the placeholder is
 *    a real file, so "the URL resolves" stays green while the storefront
 *    renders a placeholder bag where a packshot should be. That is the
 *    visual inconsistency the rule exists to prevent.
 *
 * Offending products are controlled at the source (their paths are repaired
 * by the seeder that wrote them), not hidden downstream — a Customer must
 * never lose a stocked, priced product just because its media drifted.
 */
class SeededCatalogueMediaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (! is_file(base_path('../products_dataset/products.json'))) {
            $this->markTestSkipped('products_dataset/products.json is not present in this checkout.');
        }

        $this->seed([
            StoreSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            SouthAfricanPantrySeeder::class,
            RecipeSeeder::class,
            SouthAfricanRecipeSeeder::class,
            SpecialSeeder::class,
            BannerSeeder::class,
        ]);
    }

    public function test_every_seeded_product_image_resolves_to_a_real_file(): void
    {
        $this->assertGreaterThan(0, Product::count(), 'seeders should have produced products');

        $broken = Product::query()
            ->get()
            ->reject(fn (Product $p) => $this->pathExists($p->image))
            ->map(fn (Product $p) => $p->slug.' => '.var_export($p->image, true))
            ->values();

        $this->assertSame(
            [],
            $broken->all(),
            "Seeded products must reference images that exist under backend/public:\n".$broken->implode("\n")
        );
    }

    public function test_every_seeded_product_images_array_resolves_to_real_files(): void
    {
        $broken = [];
        foreach (Product::whereNotNull('images')->cursor() as $product) {
            foreach ((array) $product->images as $img) {
                if (! $this->pathExists($img)) {
                    $broken[] = $product->slug.' => '.var_export($img, true);
                }
            }
        }

        $this->assertSame([], $broken, "Product.images[] entries must exist on disk:\n".implode("\n", $broken));
    }

    public function test_no_catalogue_endpoint_emits_a_dead_or_svg_media_url(): void
    {
        $endpoints = [
            '/api/products?per_page=100',
            '/api/products/trending',
            '/api/products/popular',
            '/api/products/new-arrivals',
            '/api/specials',
            '/api/recipes',
        ];

        foreach ($endpoints as $endpoint) {
            $payload = $this->getJson($endpoint)->assertStatus(200)->json();

            foreach ($this->mediaValues($payload) as [$key, $value]) {
                $this->assertStringNotContainsString(
                    '.svg',
                    $value,
                    "$endpoint emitted an SVG for [$key]; next/image will not optimise it (blank card)."
                );
                $this->assertTrue(
                    $this->pathExists($value),
                    "$endpoint emitted a media URL with no file behind it: [$key] $value"
                );
            }
        }
    }

    public function test_store_inventory_emits_only_resolvable_media_urls(): void
    {
        $store = Store::where('is_active', true)->first();
        $manager = User::factory()->create(['role' => UserRole::StoreManager]);
        StoreStaff::create(['user_id' => $manager->id, 'store_id' => $store->id, 'role' => 'store_manager']);

        $payload = $this->actingAs($manager)
            ->getJson('/api/store/inventory?store_id='.$store->id)
            ->assertStatus(200)
            ->json();

        $this->assertNotEmpty($payload['data'] ?? []);

        foreach ($this->mediaValues($payload) as [$key, $value]) {
            $this->assertStringNotContainsString('.svg', $value, "inventory [$key] emitted an SVG placeholder");
            $this->assertTrue($this->pathExists($value), "inventory [$key] points at a missing file: $value");
        }
    }

    /**
     * The standing rule: a product with no usable image never reaches a
     * Customer. Every other assertion in this class stays green when a path
     * rots, because MediaService swaps in a *real* file
     * (products/product-placeholder.webp) and `pathExists()` therefore
     * reports success — the Customer just sees a placeholder bag where a
     * packshot belongs. This test names that case explicitly.
     */
    public function test_no_customer_facing_product_is_served_the_fallback_placeholder(): void
    {
        $checked = 0;

        foreach ($this->catalogueEndpoints() as $endpoint) {
            foreach ($this->pagesOf($endpoint) as [$where, $payload]) {
                foreach ($this->productImages($payload) as [$path, $image]) {
                    $checked++;

                    $this->assertNotSame(
                        '',
                        trim((string) $image),
                        "$where [$path] has an empty product image; a product with no usable image reached the storefront."
                    );
                    $this->assertStringNotContainsString(
                        MediaService::PRODUCT_PLACEHOLDER,
                        (string) $image,
                        "$where [$path] is serving the fallback placeholder — a product with no usable image reached the storefront."
                    );
                }
            }
        }

        $this->assertGreaterThan(
            0,
            $checked,
            'No product-shaped nodes were found in any catalogue payload; the assertions above would be vacuous.'
        );
    }

    /* ------------------------------------------------------------------ */

    /** @return array<int, string> */
    private function catalogueEndpoints(): array
    {
        return [
            '/api/products?per_page=100',
            '/api/products/trending',
            '/api/products/popular',
            '/api/products/new-arrivals',
            '/api/specials',
            '/api/recipes',
        ];
    }

    /**
     * Walk every page of a (optionally paginated) endpoint. Endpoints that
     * do not paginate report no `last_page` and so are yielded once.
     *
     * @return array<int, array{0: string, 1: mixed}>
     */
    private function pagesOf(string $endpoint): array
    {
        $pages = [];

        for ($page = 1; ; $page++) {
            $separator = str_contains($endpoint, '?') ? '&' : '?';
            $payload = $this->getJson($endpoint.$separator.'page='.$page)
                ->assertStatus(200)
                ->json();

            $pages[] = [$endpoint.' (page '.$page.')', $payload];

            if ($page >= (int) ($payload['last_page'] ?? 1)) {
                break;
            }
        }

        return $pages;
    }

    /**
     * Product-shaped nodes anywhere in a payload, as [json path, image].
     * A node qualifies on slug + image + (price|unit) so a recipe or banner
     * image is never mistaken for a product image.
     *
     * @return array<int, array{0: string, 1: mixed}>
     */
    private function productImages(mixed $node, string $path = ''): array
    {
        if (! is_array($node)) {
            return [];
        }

        $out = [];

        if (
            array_key_exists('slug', $node)
            && array_key_exists('image', $node)
            && (array_key_exists('price', $node) || array_key_exists('unit', $node))
        ) {
            $out[] = [($path !== '' ? $path.'.' : '').'image', $node['image']];
        }

        foreach ($node as $key => $value) {
            if (! is_array($value)) {
                continue;
            }

            $child = $path === '' ? (string) $key : $path.'.'.$key;
            foreach ($this->productImages($value, $child) as $hit) {
                $out[] = $hit;
            }
        }

        return $out;
    }

    private function pathExists(?string $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        $path = preg_match('#^https?://#i', $value)
            ? (parse_url($value, PHP_URL_PATH) ?: '')
            : $value;
        $path = ltrim($path, '/');

        return $path !== '' && is_file(public_path($path));
    }

    /** @return array<int, array{0: string, 1: string}> */
    private function mediaValues(mixed $node, string $key = ''): array
    {
        $out = [];

        if (is_array($node)) {
            foreach ($node as $k => $v) {
                foreach ($this->mediaValues($v, is_int($k) ? $key : (string) $k) as $hit) {
                    $out[] = $hit;
                }
            }

            return $out;
        }

        if (is_string($node) && preg_match('/(image|photo|logo|thumbnail|avatar|media|icon|src|creative)/i', $key)) {
            $out[] = [$key, $node];
        }

        return $out;
    }
}
