<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Fruits & Vegetables', 'slug' => 'fruits-vegetables', 'sort_order' => 1],
            ['name' => 'Meat & Poultry', 'slug' => 'meat-poultry', 'sort_order' => 2],
            ['name' => 'Bakery', 'slug' => 'bakery', 'sort_order' => 3],
            ['name' => 'Dairy & Eggs', 'slug' => 'dairy-eggs', 'sort_order' => 4],
            ['name' => 'Beverages', 'slug' => 'beverages', 'sort_order' => 5],
            ['name' => 'Snacks & Treats', 'slug' => 'snacks-treats', 'sort_order' => 6],
            ['name' => 'Pantry Staples', 'slug' => 'pantry-staples', 'sort_order' => 7],
            ['name' => 'Frozen Foods', 'slug' => 'frozen-foods', 'sort_order' => 8],
            ['name' => 'Household', 'slug' => 'household', 'sort_order' => 9],
            ['name' => 'Baby & Toddler', 'slug' => 'baby-toddler', 'sort_order' => 10],
            ['name' => 'Health & Beauty', 'slug' => 'health-beauty', 'sort_order' => 11],
            ['name' => 'Wines & Spirits', 'slug' => 'wines-spirits', 'sort_order' => 12],
            ['name' => 'Pet Supplies', 'slug' => 'pet-supplies', 'sort_order' => 13],
            ['name' => 'Ready Meals & Deli', 'slug' => 'ready-meals-deli', 'sort_order' => 14],
            ['name' => 'Stationery & School', 'slug' => 'stationery-school', 'sort_order' => 15],
        ];

        foreach ($categories as $cat) {
            // Idempotent: re-seeding must not die on the unique slug.
            Category::firstOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
