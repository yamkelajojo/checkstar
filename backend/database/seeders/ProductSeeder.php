<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['category_id' => 1, 'name' => 'Bananas', 'slug' => 'bananas', 'unit' => 'kg', 'price' => 18.99, 'is_featured' => true],
            ['category_id' => 1, 'name' => 'Apples', 'slug' => 'apples', 'unit' => 'kg', 'price' => 22.99],
            ['category_id' => 1, 'name' => 'Tomatoes', 'slug' => 'tomatoes', 'unit' => 'kg', 'price' => 15.99],
            ['category_id' => 1, 'name' => 'Potatoes', 'slug' => 'potatoes', 'unit' => 'kg', 'price' => 12.99],
            ['category_id' => 1, 'name' => 'Spinach', 'slug' => 'spinach', 'unit' => 'each', 'price' => 9.99],
            ['category_id' => 2, 'name' => 'Chicken Breast', 'slug' => 'chicken-breast', 'unit' => 'kg', 'price' => 89.99, 'is_featured' => true],
            ['category_id' => 2, 'name' => 'Beef Mince', 'slug' => 'beef-mince', 'unit' => 'kg', 'price' => 95.99],
            ['category_id' => 2, 'name' => 'Pork Chops', 'slug' => 'pork-chops', 'unit' => 'kg', 'price' => 78.99],
            ['category_id' => 2, 'name' => 'Lamb Ribs', 'slug' => 'lamb-ribs', 'unit' => 'kg', 'price' => 129.99],
            ['category_id' => 3, 'name' => 'White Bread', 'slug' => 'white-bread', 'unit' => 'each', 'price' => 14.99],
            ['category_id' => 3, 'name' => 'Whole Wheat Bread', 'slug' => 'whole-wheat-bread', 'unit' => 'each', 'price' => 16.99, 'is_featured' => true],
            ['category_id' => 3, 'name' => 'Croissants', 'slug' => 'croissants', 'unit' => 'pack', 'price' => 34.99],
            ['category_id' => 4, 'name' => 'Fresh Milk 2L', 'slug' => 'fresh-milk-2l', 'unit' => '2L', 'price' => 24.99],
            ['category_id' => 4, 'name' => 'Cheddar Cheese', 'slug' => 'cheddar-cheese', 'unit' => 'kg', 'price' => 109.99],
            ['category_id' => 4, 'name' => 'Free Range Eggs', 'slug' => 'free-range-eggs', 'unit' => 'dozen', 'price' => 32.99, 'is_featured' => true],
            ['category_id' => 5, 'name' => 'Coca-Cola 2L', 'slug' => 'coca-cola-2l', 'unit' => '2L', 'price' => 19.99],
            ['category_id' => 5, 'name' => 'Orange Juice 1L', 'slug' => 'orange-juice-1l', 'unit' => '1L', 'price' => 27.99],
            ['category_id' => 5, 'name' => 'Spring Water 500ml', 'slug' => 'spring-water-500ml', 'unit' => '500ml', 'price' => 8.99],
            ['category_id' => 6, 'name' => 'Potato Chips', 'slug' => 'potato-chips', 'unit' => 'each', 'price' => 16.99],
            ['category_id' => 6, 'name' => 'Chocolate Bar', 'slug' => 'chocolate-bar', 'unit' => 'each', 'price' => 14.99],
            ['category_id' => 7, 'name' => 'White Rice 2kg', 'slug' => 'white-rice-2kg', 'unit' => '2kg', 'price' => 39.99, 'is_featured' => true],
            ['category_id' => 7, 'name' => 'Pasta 500g', 'slug' => 'pasta-500g', 'unit' => '500g', 'price' => 14.99],
            ['category_id' => 7, 'name' => 'Cooking Oil 750ml', 'slug' => 'cooking-oil-750ml', 'unit' => '750ml', 'price' => 29.99],
            ['category_id' => 8, 'name' => 'Frozen Mixed Vegetables', 'slug' => 'frozen-mixed-vegetables', 'unit' => 'kg', 'price' => 22.99],
            ['category_id' => 8, 'name' => 'Vanilla Ice Cream', 'slug' => 'vanilla-ice-cream', 'unit' => '2L', 'price' => 45.99],
            ['category_id' => 9, 'name' => 'Dishwashing Liquid', 'slug' => 'dishwashing-liquid', 'unit' => '500ml', 'price' => 18.99],
            ['category_id' => 9, 'name' => 'Laundry Detergent', 'slug' => 'laundry-detergent', 'unit' => '1kg', 'price' => 52.99],
            ['category_id' => 10, 'name' => 'Baby Diapers', 'slug' => 'baby-diapers', 'unit' => 'pack', 'price' => 89.99],
            ['category_id' => 10, 'name' => 'Baby Wipes', 'slug' => 'baby-wipes', 'unit' => 'pack', 'price' => 24.99],
            ['category_id' => 11, 'name' => 'Shampoo', 'slug' => 'shampoo', 'unit' => '250ml', 'price' => 34.99],
            ['category_id' => 11, 'name' => 'Toothpaste', 'slug' => 'toothpaste', 'unit' => '100ml', 'price' => 19.99],
            ['category_id' => 12, 'name' => 'Red Wine', 'slug' => 'red-wine', 'unit' => '750ml', 'price' => 79.99],
            ['category_id' => 12, 'name' => 'Beer 6-pack', 'slug' => 'beer-6-pack', 'unit' => 'pack', 'price' => 59.99],
            ['category_id' => 13, 'name' => 'Dog Food 2kg', 'slug' => 'dog-food-2kg', 'unit' => '2kg', 'price' => 64.99],
            ['category_id' => 13, 'name' => 'Cat Food 400g', 'slug' => 'cat-food-400g', 'unit' => '400g', 'price' => 29.99],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
