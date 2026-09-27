<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreProduct;
use Illuminate\Database\Seeder;

/**
 * South African pantry essentials — added so that authentic SA recipes
 * (Vetkoek, Malva, Peppermint Crisp Tart, Durban Curry, Koeksisters)
 * can be created from inventory that actually exists.
 *
 * All products are idempotent via firstOrCreate on slug.
 * StoreProduct stock is ensured for all active stores.
 */
class SouthAfricanPantrySeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::pluck('id', 'slug');

        $products = [
            // ---- Pantry Staples ----
            [
                'name' => 'Snowflake Cake Wheat Flour 2.5kg',
                'slug' => 'snowflake-cake-wheat-flour-2-5kg',
                'category' => 'pantry-staples',
                'unit' => '2.5kg',
                'price' => 49.99,
                'tags' => ['flour', 'baking', 'cake'],
            ],
            [
                'name' => 'Selati White Sugar 2kg',
                'slug' => 'selati-white-sugar-2kg',
                'category' => 'pantry-staples',
                'unit' => '2kg',
                'price' => 42.99,
                'tags' => ['sugar', 'baking'],
            ],
            [
                'name' => 'Selati Light Brown Sugar 1kg',
                'slug' => 'selati-light-brown-sugar-1kg',
                'category' => 'pantry-staples',
                'unit' => '1kg',
                'price' => 32.99,
                'tags' => ['sugar', 'brown', 'baking'],
            ],
            [
                'name' => 'Anchor Instant Yeast 10g',
                'slug' => 'anchor-instant-yeast-10g',
                'category' => 'pantry-staples',
                'unit' => '10g',
                'price' => 8.99,
                'tags' => ['yeast', 'baking'],
            ],
            [
                'name' => 'Sunfoil Sunflower Oil 750ml',
                'slug' => 'sunfoil-sunflower-oil-750ml',
                'category' => 'pantry-staples',
                'unit' => '750ml',
                'price' => 39.99,
                'tags' => ['oil', 'cooking'],
            ],
            [
                'name' => 'Robertsons Baking Powder 100g',
                'slug' => 'robertsons-baking-powder-100g',
                'category' => 'pantry-staples',
                'unit' => '100g',
                'price' => 18.99,
                'tags' => ['baking', 'powder'],
            ],
            [
                'name' => 'Robertsons Bicarbonate of Soda 100g',
                'slug' => 'robertsons-bicarbonate-of-soda-100g',
                'category' => 'pantry-staples',
                'unit' => '100g',
                'price' => 16.99,
                'tags' => ['baking', 'soda', 'bicarb'],
            ],
            [
                'name' => 'Cerebos Iodated Table Salt 500g',
                'slug' => 'cerebos-iodated-table-salt-500g',
                'category' => 'pantry-staples',
                'unit' => '500g',
                'price' => 14.99,
                'tags' => ['salt'],
            ],
            [
                'name' => 'All Gold Smooth Apricot Jam 450g',
                'slug' => 'all-gold-smooth-apricot-jam-450g',
                'category' => 'pantry-staples',
                'unit' => '450g',
                'price' => 34.99,
                'tags' => ['jam', 'apricot'],
            ],
            [
                'name' => 'Heinz White Spirit Vinegar 750ml',
                'slug' => 'heinz-white-spirit-vinegar-750ml',
                'category' => 'pantry-staples',
                'unit' => '750ml',
                'price' => 26.99,
                'tags' => ['vinegar'],
            ],
            [
                'name' => 'Robertsons Ground Cinnamon 40g',
                'slug' => 'robertsons-ground-cinnamon-40g',
                'category' => 'pantry-staples',
                'unit' => '40g',
                'price' => 22.99,
                'tags' => ['cinnamon', 'spice'],
            ],
            [
                'name' => 'Robertsons Ground Ginger 40g',
                'slug' => 'robertsons-ground-ginger-40g',
                'category' => 'pantry-staples',
                'unit' => '40g',
                'price' => 21.99,
                'tags' => ['ginger', 'spice'],
            ],
            [
                'name' => 'Rajah Mild & Spicy Durban Curry Powder 80g',
                'slug' => 'rajah-mild-and-spicy-durban-curry-powder-80g',
                'category' => 'pantry-staples',
                'unit' => '80g',
                'price' => 24.99,
                'tags' => ['curry', 'durban', 'masala', 'spice'],
            ],
            [
                'name' => 'Robertsons Vanilla Essence 40ml',
                'slug' => 'robertsons-vanilla-essence-40ml',
                'category' => 'pantry-staples',
                'unit' => '40ml',
                'price' => 19.99,
                'tags' => ['vanilla', 'essence'],
            ],
            [
                'name' => 'Nestlé Golden Syrup 500g',
                'slug' => 'nestle-golden-syrup-500g',
                'category' => 'pantry-staples',
                'unit' => '500g',
                'price' => 38.99,
                'tags' => ['syrup', 'golden'],
            ],
            // ---- Dairy & Eggs ----
            [
                'name' => 'Free Range Eggs 6 Pack',
                'slug' => 'free-range-eggs-6-pack',
                'category' => 'dairy-eggs',
                'unit' => '6 pack',
                'price' => 39.99,
                'tags' => ['eggs'],
            ],
            [
                'name' => 'Clover Fresh Cream 250ml',
                'slug' => 'clover-fresh-cream-250ml',
                'category' => 'dairy-eggs',
                'unit' => '250ml',
                'price' => 32.99,
                'tags' => ['cream', 'fresh'],
            ],
            [
                'name' => 'Clover Whipping Cream 500ml',
                'slug' => 'clover-whipping-cream-500ml',
                'category' => 'dairy-eggs',
                'unit' => '500ml',
                'price' => 54.99,
                'tags' => ['cream', 'whipping'],
            ],
            [
                'name' => 'Nestlé Caramel Treat 360g',
                'slug' => 'nestle-caramel-treat-360g',
                'category' => 'dairy-eggs',
                'unit' => '360g',
                'price' => 36.99,
                'tags' => ['caramel', 'condensed', 'treat'],
            ],
            // ---- Snacks & Treats ----
            [
                'name' => 'Bakers Tennis Biscuits 200g',
                'slug' => 'bakers-tennis-biscuits-200g',
                'category' => 'snacks-treats',
                'unit' => '200g',
                'price' => 24.99,
                'tags' => ['biscuit', 'tennis', 'coconut'],
            ],
            [
                'name' => 'Nestlé Peppermint Crisp Chocolate Bar 49g',
                'slug' => 'nestle-peppermint-crisp-chocolate-bar-49g',
                'category' => 'snacks-treats',
                'unit' => '49g',
                'price' => 18.99,
                'tags' => ['chocolate', 'peppermint', 'crisp'],
            ],
            [
                'name' => 'Cadbury Dairy Milk Peppermint Crisp 80g',
                'slug' => 'cadbury-dairy-milk-peppermint-crisp-80g',
                'category' => 'snacks-treats',
                'unit' => '80g',
                'price' => 22.99,
                'tags' => ['chocolate', 'peppermint'],
            ],
            // ---- Fruits & Vegetables ----
            [
                'name' => 'Onions 1kg',
                'slug' => 'onions-1kg',
                'category' => 'fruits-vegetables',
                'unit' => '1kg',
                'price' => 22.99,
                'tags' => ['onion'],
            ],
            [
                'name' => 'Tomatoes 1kg',
                'slug' => 'tomatoes-1kg',
                'category' => 'fruits-vegetables',
                'unit' => '1kg',
                'price' => 29.99,
                'tags' => ['tomato'],
            ],
            [
                'name' => 'Potatoes 2kg',
                'slug' => 'potatoes-2kg',
                'category' => 'fruits-vegetables',
                'unit' => '2kg',
                'price' => 39.99,
                'tags' => ['potato'],
            ],
            [
                'name' => 'Garlic 3 Pack',
                'slug' => 'garlic-3-pack',
                'category' => 'fruits-vegetables',
                'unit' => '3 pack',
                'price' => 19.99,
                'tags' => ['garlic'],
            ],
            [
                'name' => 'Fresh Ginger 100g',
                'slug' => 'fresh-ginger-100g',
                'category' => 'fruits-vegetables',
                'unit' => '100g',
                'price' => 16.99,
                'tags' => ['ginger', 'fresh'],
            ],
            [
                'name' => 'Lemons 1kg',
                'slug' => 'lemons-1kg',
                'category' => 'fruits-vegetables',
                'unit' => '1kg',
                'price' => 32.99,
                'tags' => ['lemon'],
            ],
            // ---- Pantry: Coconut milk ----
            [
                'name' => 'Coconut Milk 400ml',
                'slug' => 'coconut-milk-400ml',
                'category' => 'pantry-staples',
                'unit' => '400ml',
                'price' => 28.99,
                'tags' => ['coconut', 'milk'],
            ],
        ];

        $stores = Store::all();

        foreach ($products as $data) {
            $catId = $categories[$data['category']] ?? $categories['pantry-staples'];
            // Media lives in the same category folder as the rest of the
            // catalogue (`products/<category>/<slug>.webp`). `updateOrCreate`
            // (not firstOrCreate) so a re-seed repairs rows written by the
            // older flat `products/<slug>.jpg` convention instead of leaving
            // them pointing at files that never existed.
            $categorySlug = $data['category'];
            $image = 'products/'.$categorySlug.'/'.$data['slug'].'.webp';

            $product = Product::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'category_id' => $catId,
                    'name' => $data['name'],
                    'image' => $image,
                    'images' => [$image],
                    'unit' => $data['unit'],
                    'price' => $data['price'],
                    'sale_price' => null,
                    'tags' => $data['tags'],
                    'is_featured' => false,
                    'is_active' => true,
                ]
            );

            // Ensure stock at all stores
            foreach ($stores as $store) {
                StoreProduct::firstOrCreate(
                    ['product_id' => $product->id, 'store_id' => $store->id],
                    [
                        'stock_quantity' => rand(200, 500),
                        'reserved_quantity' => 0,
                        'is_available' => true,
                    ]
                );
            }
        }

        $this->command->info('South African pantry seeded: ' . count($products) . ' products with store stock.');
    }
}
