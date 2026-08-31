<?php

namespace Database\Seeders;

use App\Models\Recipe;
use Illuminate\Database\Seeder;

class RecipeSeeder extends Seeder
{
    public function run(): void
    {
        Recipe::create([
            'title' => 'Classic South African Braai',
            'slug' => 'classic-sa-braai',
            'description' => 'The ultimate South African braai experience.',
            'ingredients' => [
                '1kg beef boerewors',
                '4 lamb chops',
                '4 chicken breasts',
                'Braai wood and charcoal',
                'Braai sauce',
            ],
            'method' => "1. Light the braai and wait for coals to be ready.\n2. Season the meat with salt and pepper.\n3. Grill boerewors first, turning regularly.\n4. Add lamb chops and chicken.\n5. Serve with pap and sheba.",
            'category' => 'meals',
            'prep_time' => 15,
            'cook_time' => 45,
            'servings' => 4,
            'is_featured' => true,
        ]);

        Recipe::create([
            'title' => 'Chakalaka',
            'slug' => 'chakalaka',
            'description' => 'A spicy South African relish.',
            'ingredients' => [
                '2 tomatoes, chopped',
                '1 onion, diced',
                '1 green pepper, diced',
                '2 carrots, grated',
                '2 tbsp curry powder',
                'Baked beans',
            ],
            'method' => "1. Saute onions and peppers until soft.\n2. Add curry powder and cook for 1 minute.\n3. Add tomatoes and carrots, simmer 15 minutes.\n4. Stir in baked beans, heat through.\n5. Serve with bread or pap.",
            'category' => 'snacks',
            'prep_time' => 10,
            'cook_time' => 20,
            'servings' => 6,
            'is_featured' => false,
        ]);

        Recipe::create([
            'title' => 'Mango Lassi',
            'slug' => 'mango-lassi',
            'description' => 'A refreshing mango yoghurt drink.',
            'ingredients' => [
                '2 ripe mangoes',
                '1 cup plain yoghurt',
                '1/2 cup milk',
                '2 tbsp sugar',
                'Ice cubes',
            ],
            'method' => "1. Peel and chop mangoes.\n2. Blend mangoes, yoghurt, milk, and sugar until smooth.\n3. Add ice cubes and blend again.\n4. Serve chilled.",
            'category' => 'drinks',
            'prep_time' => 5,
            'cook_time' => 0,
            'servings' => 2,
            'is_featured' => false,
        ]);
    }
}
