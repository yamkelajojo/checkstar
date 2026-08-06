<?php

namespace Database\Seeders;

use App\Models\Product;
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

        foreach ($dataset['products'] as $product) {
            $image = 'products/' . ltrim(str_replace('images/', '', $product['image']), '/');

            Product::create([
                'category_id' => $product['category_id'],
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
            ]);
        }
    }
}
