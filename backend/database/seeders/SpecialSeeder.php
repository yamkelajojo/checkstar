<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Special;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class SpecialSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $specials = [
            [
                'title' => 'Winter Warmers',
                'slug' => 'winter-warmers',
                'description' => 'Stay warm with these hearty favourites — soups, roasts, and comfort food at unbeatable prices.',
                'start_date' => $now->copy()->subDays(14),
                'end_date' => $now->copy()->addDays(30),
                'is_active' => true,
                'sort_order' => 1,
                'products' => [
                    'Simply Great Butternut Beetroot & Feta Salad 250g' => 29.99,
                    'Simply Great Broccoli, Cranberry & Bacon Salad 250g' => 29.99,
                    'Lemons 7 Pack' => 14.99,
                ],
            ],
            [
                'title' => 'Braai Season',
                'slug' => 'braai-season',
                'description' => 'Everything you need for the perfect South African braai. Meat, sides, and sauces on special.',
                'start_date' => $now->copy()->subDays(7),
                'end_date' => $now->copy()->addDays(45),
                'is_active' => true,
                'sort_order' => 2,
                'products' => [
                    'Simple Truth Barbecue Bread Crisps 85g' => 18.99,
                    'Simple Truth Sour Cream & Red Onion Bread Crisps 85g' => 18.99,
                    'Banting Revolution Lime Flavoured Cordial 48ml' => 8.99,
                    'Banting Revolution Strawberry Flavoured Cordial 48ml' => 8.99,
                ],
            ],
            [
                'title' => 'Fresh Fruit Deals',
                'slug' => 'fresh-fruit-deals',
                'description' => 'Freshest seasonal fruits at prices that make you smile.',
                'start_date' => $now->copy()->subDays(5),
                'end_date' => $now->copy()->addDays(21),
                'is_active' => true,
                'sort_order' => 3,
                'products' => [
                    'Nectarines 1kg' => 27.99,
                    'Top Red Apples 1.5kg' => 27.99,
                    'White Seedless Grapes 500g' => 27.99,
                    'White Flesh Nectarines 750g' => 22.99,
                    'Red Seedless Grapes 500g' => 27.99,
                    'Spanspek' => 19.99,
                    'Celery Fingers 150g' => 9.99,
                ],
            ],
            [
                'title' => 'Weekly Essentials',
                'slug' => 'weekly-essentials',
                'description' => 'Stock up on everyday staples at prices you will love.',
                'start_date' => $now->copy()->subDays(3),
                'end_date' => $now->copy()->addDays(14),
                'is_active' => true,
                'sort_order' => 4,
                'products' => [
                    'Banting Revolution Lime Flavoured Cordial 48ml' => 9.99,
                    'Banting Revolution Strawberry Flavoured Cordial 48ml' => 9.99,
                ],
            ],
            [
                'title' => 'Pet Lovers',
                'slug' => 'pet-lovers',
                'description' => 'Your furry friends deserve a treat too. Premium pet food on special.',
                'start_date' => $now->copy()->subDays(10),
                'end_date' => $now->copy()->addDays(20),
                'is_active' => true,
                'sort_order' => 5,
                'products' => [
                    'Whiskas Dry Cat Food Ocean Fish and Meat Nuggets 1kg' => 69.99,
                    'Whiskas Lamb In Gravy Cat Food 85g' => 10.99,
                ],
            ],
            [
                'title' => 'Health & Wellness',
                'slug' => 'health-wellness',
                'description' => 'Take care of yourself with health and beauty essentials on special.',
                'start_date' => $now->copy()->subDays(7),
                'end_date' => $now->copy()->addDays(28),
                'is_active' => true,
                'sort_order' => 6,
                'products' => [
                    'USN Core Series Testo Tribulus Male Performance Aid 100 Caps' => 279.99,
                    'Elastoplast Extra Flexible Breathable Fabric Plasters 20 Pack' => 29.99,
                    'Band-Aid Sterile Plastic Strips 25 Pack' => 29.99,
                    'Elastoplast Clear Plasters 20 Pack' => 29.99,
                ],
            ],
            [
                'title' => 'Snack Attack',
                'slug' => 'snack-attack',
                'description' => 'Crunch, munch, and everything in between. Snacks on special this week.',
                'start_date' => $now->copy()->subDays(2),
                'end_date' => $now->copy()->addDays(12),
                'is_active' => true,
                'sort_order' => 7,
                'products' => [
                    'Simple Truth Barbecue Bread Crisps 85g' => 19.99,
                    'Simple Truth Sour Cream & Red Onion Bread Crisps 85g' => 19.99,
                ],
            ],
        ];

        foreach ($specials as $specialData) {
            $products = $specialData['products'];
            unset($specialData['products']);

            $special = Special::create($specialData);

            foreach ($products as $productName => $specialPrice) {
                $product = Product::where('name', $productName)->first();
                if ($product) {
                    $special->products()->attach($product->id, [
                        'special_price' => $specialPrice,
                    ]);
                }
            }
        }
    }
}
