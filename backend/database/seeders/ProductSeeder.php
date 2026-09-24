<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $path = base_path('../products_dataset/products.json');
        if (! File::exists($path)) {
            $this->command->error('products_dataset/products.json not found; skipping product seed.');

            return;
        }

        $dataset = json_decode(File::get($path), true);

        // Never trust the dataset's category ids: they only line up with the
        // categories table on a pristine database (MySQL does not reset
        // auto-increment after rolled-back transactions). Match by slug.
        $categoryIds = [];
        foreach ($dataset['categories'] as $datasetCategory) {
            $category = Category::firstOrCreate(
                ['slug' => $datasetCategory['slug']],
                ['name' => $datasetCategory['name'], 'sort_order' => $datasetCategory['sort_order']]
            );
            $categoryIds[$datasetCategory['id']] = $category->id;
        }

        $stores = Store::where('is_active', true)->get();

        foreach ($dataset['products'] as $product) {
            $image = 'products/'.ltrim(str_replace('images/', '', $product['image']), '/');

            $createdProduct = Product::updateOrCreate(
                ['slug' => $product['slug']],
                [
                'category_id' => $categoryIds[$product['category_id']],
                'name' => $product['name'],
                'slug' => $product['slug'],
                'image' => $image,
                'images' => [$image],
                'unit' => $product['unit'],
                'price' => $product['price'],
                'sale_price' => $product['sale_price'],
                'tags' => $product['tags'] ?: null,
                'is_featured' => $product['is_featured'],
                'is_active' => true,
                ]
            );

            // Ensure stock at all active stores
            foreach ($stores as $store) {
                StoreProduct::firstOrCreate(
                    ['product_id' => $createdProduct->id, 'store_id' => $store->id],
                    [
                        'stock_quantity' => rand(200, 500),
                        'reserved_quantity' => 0,
                        'is_available' => true,
                    ]
                );
            }
        }
    }
}
