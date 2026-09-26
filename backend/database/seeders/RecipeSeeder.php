<?php

namespace Database\Seeders;

use App\Models\Recipe;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class RecipeSeeder extends Seeder
{
    /**
     * Demo recipes.
     *
     * Ingredients deliberately reference products that exist in
     * products_dataset/products.json (the catalogue the demo store actually
     * stocks), so the recipe page's ingredient→product linking — the inline
     * thumbnail next to each ingredient that deep-links to the product page —
     * showcases real matches ("250 ml milk" → Clover Fresh Full Cream Milk).
     *
     * updateOrCreate (not firstOrCreate): recipe CONTENT is refreshed on
     * already-seeded databases, otherwise older installs keep stale
     * ingredients that match nothing in the current catalogue.
     */
    public function run(): void
    {
        foreach ($this->recipes() as $recipe) {
            Recipe::updateOrCreate(
                ['slug' => Arr::pull($recipe, 'slug')],
                $recipe,
            );
        }
    }

    private function recipes(): array
    {
        return [
            [
                'slug' => 'classic-sa-braai',
                'title' => 'Classic South African Braai',
                'description' => 'The ultimate South African braai experience — juicy chicken, fresh bread and a fruit platter to share.',
                'image' => 'recipes/Classic-South-African-Braai.webp',
                'ingredients' => [
                    '4 chicken thighs, skin on',
                    '2 tbsp butter, softened',
                    '4 slices white bread',
                    '3 red apples, quartered',
                    '1 cup white grapes',
                    '1 lemon, halved',
                ],
                'method' => "1. Light the braai and wait for the coals to settle.\n2. Season the chicken thighs and grill them skin-side down first, turning regularly.\n3. Toast the bread slices over the coals and spread with butter.\n4. Braai the lemon halves cut-side down for two minutes.\n5. Plate the chicken with toast, apples and grapes — squeeze the braaied lemon over everything.",
                'category' => 'meals',
                'prep_time' => 15,
                'cook_time' => 45,
                'servings' => 4,
                'is_featured' => true,
            ],
            [
                'slug' => 'creamy-chicken-pasta',
                'title' => 'Creamy Chicken Pasta',
                'description' => 'A weeknight winner: tender chicken in a creamy mozzarella sauce.',
                'image' => 'recipes/Creamy-Chicken-Pasta.jpg',
                'ingredients' => [
                    '4 chicken thighs, sliced',
                    '250 ml full cream milk',
                    '100 g butter',
                    '1 cup mozzarella cheese, grated',
                    '500 g pasta, cooked',
                    'Salt and pepper',
                ],
                'method' => "1. Season the chicken slices and fry in half the butter until golden.\n2. Pour in the milk and simmer gently for five minutes.\n3. Stir through the remaining butter and the grated mozzarella until silky.\n4. Toss the sauce through the hot pasta.\n5. Season to taste and serve immediately.",
                'category' => 'meals',
                'prep_time' => 10,
                'cook_time' => 25,
                'servings' => 4,
                'is_featured' => false,
            ],
            [
                'slug' => 'banana-apple-smoothie',
                'title' => 'Banana & Apple Smoothie',
                'description' => 'A refreshing fruit smoothie to start the day.',
                'image' => 'recipes/Apple-Banana-Smoothie-1.jpg',
                'ingredients' => [
                    '2 bananas, peeled and sliced',
                    '2 red apples, cored and chopped',
                    '1 cup full cream milk',
                    '1 cup white grapes, halved',
                    '1 cup ice cubes',
                ],
                'method' => "1. Add the bananas, apples, grapes and milk to a blender.\n2. Blend until completely smooth.\n3. Add the ice cubes and pulse a few more times.\n4. Pour into chilled glasses and serve.",
                'category' => 'drinks',
                'prep_time' => 5,
                'cook_time' => 0,
                'servings' => 2,
                'is_featured' => false,
            ],
        ];
    }
}
