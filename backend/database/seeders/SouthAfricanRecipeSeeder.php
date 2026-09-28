<?php

namespace Database\Seeders;

use App\Models\Recipe;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

/**
 * Authentic South African recipe content.
 *
 * Ingredient lines are written as a real recipe reads. The recipe page links
 * an ingredient to a product only when the live catalogue actually contains a
 * match (frontend `ingredientMatch`); ingredients with no matching product
 * simply render without a link — that is intended behaviour, not a gap.
 *
 * Recipes:
 * - Vetkoek (Fat Cake) with curried mince option
 * - Malva Pudding (Cape Dutch classic)
 * - Peppermint Crisp Tart (no-bake fridge tart)
 * - Durban Curry (Durban chicken curry)
 * - Koeksisters (plaited syrup doughnuts)
 */
class SouthAfricanRecipeSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->recipes() as $recipe) {
            Recipe::updateOrCreate(
                ['slug' => Arr::pull($recipe, 'slug')],
                $recipe,
            );
        }

        $this->command->info('South African recipes seeded: ' . count($this->recipes()) . ' recipes.');
    }

    private function recipes(): array
    {
        return [
            [
                'slug' => 'vetkoek-fat-cakes',
                'title' => 'Vetkoek (South African Fat Cakes)',
                'description' => 'Pillowy golden vetkoek — “fat cakes” — crisp outside, fluffy inside. The ultimate South African street food, perfect split and filled with curried mince, cheese, or jam. Makes 12.',
                'image' => 'recipes/Vetkoek.jpg',
                'ingredients' => [
                    '4 cups cake flour',
                    '1 sachet instant yeast (10g)',
                    '2 tsp white sugar',
                    '2 tsp table salt',
                    '1.5 cups lukewarm water',
                    '2 tbsp sunflower oil, plus extra for frying',
                    '500 g beef mince (for curried mince filling)',
                    '1 onion, finely chopped',
                    '2 tsp Durban curry powder',
                    '1 tomato, diced',
                    '1 tsp garlic, crushed',
                    '1 tsp fresh ginger, grated',
                ],
                'method' => "1. **Dough**: In a large bowl, mix cake flour, instant yeast, white sugar and salt. Keep yeast and salt separated at first, then combine.\n2. Make a well, add lukewarm water and sunflower oil. Mix until a soft sticky dough forms. Knead 8-10 mins on floured surface until smooth and elastic (add a little flour if too sticky).\n3. Cover with damp cloth, prove 45-60 mins in warm place until doubled.\n4. Knock back, divide into 12 equal balls. Flatten slightly, cover, prove 15 mins.\n5. Heat sunflower oil to 180°C. Fry 3-4 at a time, 3-4 mins per side until deep golden and cooked through. Drain on paper towel.\n6. **Curried mince (optional filling)**: Heat oil, fry onion until translucent. Add garlic, ginger and Durban curry powder, toast 1 min. Add beef mince, break up, brown. Add diced tomato and 1/2 cup water, simmer 15 mins until thick. Season with salt.\n7. Split vetkoek, fill with curried mince, or serve with All Gold apricot jam and cheese.",
                'category' => 'meals',
                'prep_time' => 20,
                'cook_time' => 30,
                'servings' => 6,
                'is_featured' => true,
                'is_published' => true,
            ],
            [
                'slug' => 'malva-pudding',
                'title' => 'Malva Pudding',
                'description' => 'South Africa’s most beloved baked pudding — soft, spongy, caramelised, soaked in buttery cream sauce. Cape Dutch roots, best served warm with custard or ice cream. Serves 8.',
                'image' => 'recipes/Malva-Pudding.jpg',
                'ingredients' => [
                    '1 cup white sugar',
                    '2 large free range eggs',
                    '1 tbsp smooth apricot jam',
                    '1.5 cups cake flour',
                    '1 tsp bicarbonate of soda',
                    '1 tsp baking powder',
                    'pinch table salt',
                    '1 tbsp butter, melted',
                    '1 tsp white spirit vinegar',
                    '1 cup full cream milk',
                    '1 cup brown sugar (for sauce)',
                    '1/2 cup fresh cream (for sauce)',
                    '1/2 cup butter (for sauce)',
                    '1 tsp vanilla essence (for sauce)',
                ],
                'method' => "1. Preheat oven to 180°C. Butter a 20x20cm oven dish.\n2. Beat white sugar and eggs until thick, pale and fluffy (3-4 mins).\n3. Add apricot jam and mix.\n4. Sift cake flour, bicarbonate of soda, baking powder and salt.\n5. In a jug, mix melted butter, vinegar and milk.\n6. Fold dry ingredients into egg mixture alternately with milk mixture — don’t overmix.\n7. Pour into dish, bake 35-40 mins until well risen, brown, and skewer comes out clean.\n8. **Sauce**: While baking, heat brown sugar, fresh cream, butter and vanilla in saucepan until butter melted and sugar dissolved. Don’t boil hard.\n9. Remove pudding from oven, poke all over with skewer, pour hot sauce over little by little — it will soak in. Rest 10 mins.\n10. Serve warm with Clover fresh cream or custard. Optional: add Amarula to sauce for grown-up version.",
                'category' => 'desserts',
                'prep_time' => 15,
                'cook_time' => 40,
                'servings' => 8,
                'is_featured' => true,
                'is_published' => true,
            ],
            [
                'slug' => 'peppermint-crisp-tart',
                'title' => 'Peppermint Crisp Tart',
                'description' => 'The iconic no-bake South African fridge tart — layers of Tennis biscuits, caramel cream and crunchy Peppermint Crisp. 20 mins to assemble, then chill overnight. Pure nostalgia in a dish.',
                'image' => 'recipes/Peppermint-Crisp-Tart.png',
                'ingredients' => [
                    '2 packets Tennis biscuits (200g each)',
                    '1 tin caramel treat (360g)',
                    '2 cups whipping cream, cold',
                    '3 bars Peppermint Crisp chocolate (49g each), crushed',
                    '1 tsp vanilla essence',
                    'pinch table salt (optional)',
                ],
                'method' => "1. **Caramel cream**: Whip whipping cream to soft peaks. In separate bowl, loosen caramel treat with fork until smooth. Add vanilla and salt.\n2. Fold caramel into cream gently — don’t knock out air. Stir in 2/3 of crushed Peppermint Crisp.\n3. **Layer**: Arrange single layer Tennis biscuits in 23x33cm dish (cut to fit). Spoon 1/3 caramel cream over, spread evenly. Sprinkle some crushed chocolate.\n4. Repeat: biscuits, cream, chocolate — 2-3 layers, ending with cream on top.\n5. Top generously with remaining Peppermint Crisp. Optional dust with cocoa.\n6. Cover, refrigerate at least 4 hours, preferably overnight — biscuits soften to cake-like texture.\n7. Slice and serve cold. Keeps 2 days in fridge. Variation: use 300g biscuit crumbs mixed with melted butter for base, or add sliced banana between layers.",
                'category' => 'desserts',
                'prep_time' => 20,
                'cook_time' => 0,
                'servings' => 10,
                'is_featured' => true,
                'is_published' => true,
            ],
            [
                'slug' => 'durban-chicken-curry',
                'title' => 'Durban Chicken Curry',
                'description' => 'Hot, red, aromatic Durban curry — 12-spice masala, slow-cooked chicken, potatoes and tomatoes. The curry that made Durban famous. Best with rice, roti and sambals. Serves 4.',
                'image' => 'recipes/Durban-Chicken-Curry.jpg',
                'ingredients' => [
                    '1 kg chicken thighs, skinless (or Grain Field Chickens drumsticks & thighs)',
                    '2 tbsp sunflower oil',
                    '1 onion, diced',
                    '2 tsp garlic, crushed',
                    '2 tsp fresh ginger, grated',
                    '2 tbsp Durban curry powder',
                    '1 tsp ground cinnamon',
                    '1 tsp ground ginger',
                    '2 large tomatoes, diced',
                    '2 potatoes, peeled and halved',
                    '1 cup coconut milk',
                    '1 cup water',
                    'pinch table salt',
                    'fresh coriander for garnish (optional)',
                ],
                'method' => "1. Wash chicken, pat dry. Season lightly with salt.\n2. Heat sunflower oil in heavy pot. Fry onion until golden (5 mins). Add garlic, fresh ginger, Durban curry powder, ground cinnamon and ground ginger — toast 1 min until fragrant.\n3. Add chicken, coat in masala, sear on high 5 mins until sealed.\n4. Add diced tomatoes, stir. Reduce to medium, cook 20 mins, stirring, until tomatoes break down.\n5. Add potatoes, water and coconut milk. Bring to boil, then simmer covered 30 mins until chicken tender and potatoes cooked, sauce thick and red.\n6. If too thick, add splash water. If too thin, simmer uncovered 5 mins.\n7. Taste, adjust salt and curry heat. Garnish with coriander.\n8. Serve with rice, roti, or vetkoek, plus Mrs Ball’s chutney. Note: Durban masala traditionally has 12 spices — coriander, cumin, fennel, turmeric, cinnamon, cloves, cardamom, etc. Our Rajah Durban Curry Powder already blends them. For bunny chow, hollow a loaf of white bread and fill with curry.",
                'category' => 'meals',
                'prep_time' => 15,
                'cook_time' => 60,
                'servings' => 4,
                'is_featured' => true,
                'is_published' => true,
            ],
            [
                'slug' => 'koeksisters',
                'title' => 'Koeksisters',
                'description' => 'Sticky, syrupy, plaited koeksisters — crunchy outside, juicy inside. The trick: ice-cold syrup, hot fried dough. A true South African tea-time legend. Makes 24.',
                'image' => 'recipes/Koeksister.png',
                'ingredients' => [
                    '2 cups cake flour',
                    '2 tbsp baking powder',
                    '1/2 tsp table salt',
                    '1/4 cup butter, cold and cubed',
                    '3/4 cup full cream milk',
                    '1 large free range egg, beaten',
                    '2 cups white sugar (for syrup)',
                    '1 cup water (for syrup)',
                    '1 tsp ground cinnamon (for syrup)',
                    '1 tsp ground ginger (for syrup)',
                    '1 tbsp lemon juice (for syrup)',
                    '1 tsp vanilla essence (for syrup)',
                    'sunflower oil for deep frying',
                ],
                'method' => "1. **Syrup (make day before, must be ice cold)**: In pot, combine white sugar, water, ground cinnamon, ground ginger. Heat low, stir until sugar dissolved, simmer 5 mins. Remove from heat, add lemon juice and vanilla essence. Pour into bowl, refrigerate overnight. Keep over ice bath when using.\n2. **Dough**: Sift cake flour, baking powder and salt. Rub in cold butter with fingertips until coarse crumbs.\n3. Whisk milk and beaten egg, add to flour, mix until soft dough forms. Don’t overmix.\n4. Knead lightly 2 mins until smooth, wrap in clingfilm, rest 30 mins (or fridge 1 hour).\n5. Roll out 6mm thick on floured surface. Cut into 14cm x 6cm rectangles, then cut 2 slits lengthwise leaving top joined (3 strips). Plait, pinch ends to seal.\n6. Heat sunflower oil to 180°C. Test with small dough piece — should bubble and float in 5 secs.\n7. Fry 3-4 koeksisters at a time until golden (2 mins per side). Remove with slotted spoon, immediately dunk into ice-cold syrup for 1 min while still sizzling — they must bubble in syrup to soak.\n8. Lift with fork, drain on rack. Keep syrup cold between batches (return to fridge). Store in fridge, best next day when syrup soaked through. Optional: roll in desiccated coconut.",
                'category' => 'desserts',
                'prep_time' => 30,
                'cook_time' => 30,
                'servings' => 12,
                'is_featured' => true,
                'is_published' => true,
            ],
        ];
    }
}
