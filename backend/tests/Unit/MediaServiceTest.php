<?php

namespace Tests\Unit;

use App\Models\Category;
use App\Models\Product;
use App\Services\MediaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * MediaService is the single resolver between a stored media path and the
 * URL a client renders. These pin its contract: verified pass-through,
 * raster fallback for missing files, and absolute-URL pass-through.
 */
class MediaServiceTest extends TestCase
{
    use RefreshDatabase;

    private MediaService $media;

    protected function setUp(): void
    {
        parent::setUp();
        $this->media = app(MediaService::class);
    }

    public function test_a_stored_path_that_exists_resolves_root_relative(): void
    {
        $relative = 'products/media-test/existing.webp';
        $absolute = public_path($relative);
        File::ensureDirectoryExists(dirname($absolute));
        File::put($absolute, 'bytes');

        try {
            $this->assertTrue($this->media->exists($relative));
            $this->assertSame('/products/media-test/existing.webp', $this->media->relative($relative));
            $this->assertStringEndsWith('/products/media-test/existing.webp', $this->media->url($relative));
        } finally {
            File::delete($absolute);
            File::deleteDirectory(public_path('products/media-test'));
        }
    }

    public function test_a_missing_stored_path_falls_back_to_the_raster_placeholder(): void
    {
        $this->assertFalse($this->media->exists('products/nope/missing.webp'));
        $this->assertSame('/products/product-placeholder.webp', $this->media->relative('products/nope/missing.webp'));

        // Raster, never SVG: next/image rejects image/svg+xml by default, so
        // an SVG fallback would render as a blank card — the exact bug this
        // service exists to prevent.
        $fallback = public_path(ltrim($this->media->relative(null) ?? '', '/'));
        $this->assertFileExists($fallback);
        $this->assertStringNotContainsString('.svg', MediaService::PRODUCT_PLACEHOLDER);
    }

    public function test_the_shipped_placeholder_itself_exists_and_is_optimizer_friendly(): void
    {
        $this->assertFileExists(public_path(MediaService::PRODUCT_PLACEHOLDER));
        $this->assertMatchesRegularExpression('/\.(webp|png|jpe?g)$/', MediaService::PRODUCT_PLACEHOLDER);
    }

    public function test_absolute_urls_pass_through_untouched(): void
    {
        $url = 'https://cdn.example.com/products/thing.webp';
        $this->assertTrue($this->media->exists($url));
        $this->assertSame($url, $this->media->relative($url));
        $this->assertSame($url, $this->media->url($url));
    }

    public function test_null_and_empty_paths_fall_back_rather_than_leaking_null(): void
    {
        $this->assertSame('/products/product-placeholder.webp', $this->media->relative(null));
        $this->assertSame('/products/product-placeholder.webp', $this->media->relative(''));
        $this->assertNull($this->media->relative(null, null));
    }

    public function test_apply_to_product_keeps_image_and_images_in_lockstep(): void
    {
        $category = Category::create(['name' => 'Media Cat', 'slug' => 'media-cat']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Media Product', 'slug' => 'media-product', 'unit' => 'each',
            'price' => 5, 'image' => 'products/media-cat/gone.webp', 'images' => null,
            'is_active' => true,
        ]);

        $this->media->applyToProduct($product);

        // Catalogue payloads carry absolute URLs (the long-standing contract
        // every client already parses); assert on the verified tail.
        $this->assertStringEndsWith('/products/product-placeholder.webp', $product->image);
        $this->assertCount(1, $product->images);
        $this->assertStringEndsWith('/products/product-placeholder.webp', $product->images[0]);
    }

    public function test_apply_to_product_maps_every_entry_of_the_images_array(): void
    {
        $category = Category::create(['name' => 'Media Cat 2', 'slug' => 'media-cat-2']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Media Product 2', 'slug' => 'media-product-2', 'unit' => 'each',
            'price' => 5, 'image' => null,
            'images' => ['products/media-cat-2/a.webp', 'products/media-cat-2/b.webp'],
            'is_active' => true,
        ]);

        $this->media->applyToProduct($product);

        $this->assertCount(2, $product->images);
        foreach ($product->images as $image) {
            $this->assertStringEndsWith('/products/product-placeholder.webp', $image);
        }
    }
}
