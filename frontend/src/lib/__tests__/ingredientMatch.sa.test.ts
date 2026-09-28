import { describe, it, expect } from 'vitest'
import { findIngredientProduct } from '../ingredientMatch'
import type { Product, Category } from '@/types'

const C = (id: number, slug: string): Category => ({ id, name: slug, slug, description: null, image: null, icon: null, sort_order: id })

/**
 * SA recipes against the REAL catalogue (products_dataset/products.json).
 *
 * History: a previous session added 29 "South African pantry" products purely
 * so every SA recipe ingredient would have something to link to. Those
 * products were removed at the owner's request (2026-09-28) — this is a
 * supermarket catalogue, not an ingredient-driven system. The contract pinned
 * here is the agreed one: an ingredient shows a product link ONLY when a real
 * catalogue product matches; otherwise it renders as plain text (null match).
 * Never fake a link, never throw.
 */

// Names lifted verbatim from products_dataset/products.json — the catalogue
// the store actually stocks.
const catalogue: Product[] = [
  ['Grain Field Chickens Fresh Chicken Thighs Per kg', 'meat-poultry'],
  ['Festive Fresh Chicken Thighs Per kg', 'meat-poultry'],
  ['Grain Field Chickens Fresh Chicken Drumsticks & Thighs Per kg', 'meat-poultry'],
  ['Beef Mince (per kg)', 'meat-poultry'],
  ['Lean Beef Mince (per kg)', 'meat-poultry'],
  ['Stewing Beef Per kg', 'meat-poultry'],
  ['Clover Fresh Full Cream Milk 1L', 'dairy-eggs'],
  ['Douglasdale Full Cream Milk 2L', 'dairy-eggs'],
  ['Ladismith Unsalted Butter 500g', 'dairy-eggs'],
  ['Crystal Valley Salted Butter Brick 500g', 'dairy-eggs'],
  ['Galbani Mozzarella Cheese 300g', 'dairy-eggs'],
  ['LANCEWOOD Medium Fat Mozzarella Cheese 250g', 'dairy-eggs'],
  ['SASKO Premium Slices White Bread 700g', 'bakery'],
  ['Blue Ribbon Classic Brown Bread 700g', 'bakery'],
  ['Bananas 1.2kg', 'fruits-vegetables'],
  ['Top Red Apples 1.5kg', 'fruits-vegetables'],
  ['Starking Apples 1.5kg', 'fruits-vegetables'],
  ['White Seedless Grapes 500g', 'fruits-vegetables'],
  ['Red Seedless Grapes 500g', 'fruits-vegetables'],
  ['Lemons 7 Pack', 'fruits-vegetables'],
  ['Celery 75g', 'fruits-vegetables'],
  ['Tim Tam Original Biscuits 200g', 'snacks-treats'],
  ['Whiskas Lamb In Gravy Cat Food 85g', 'pet-supplies'],
].map(([name, cat], i) => ({
  id: i + 1,
  category_id: i + 1,
  name,
  slug: `p-${i + 1}`,
  description: null,
  image: `/products/img-${i + 1}.jpg`,
  images: [`/products/img-${i + 1}.jpg`],
  unit: 'each',
  price: 20,
  sale_price: null,
  tags: null,
  is_featured: false,
  category: C(i + 1, cat),
}))

const byName = (name: string) => catalogue.find(p => p.name === name)!.slug

// Ingredient lines from the seeded SA recipes that DO have a real catalogue
// product behind them — these must link.
const LINKED: Array<[string, string]> = [
  // Vetkoek
  ['500 g beef mince (for curried mince filling)', byName('Beef Mince (per kg)')],
  // Durban chicken curry (the parenthetical alternative is an annotation —
  // the matcher reads "chicken thighs, skinless" and picks the thighs pack)
  ['1 kg chicken thighs, skinless (or Grain Field Chickens drumsticks & thighs)', byName('Grain Field Chickens Fresh Chicken Thighs Per kg')],
  // Koeksisters
  ['1 tbsp lemon juice (for syrup)', byName('Lemons 7 Pack')],
  ['3/4 cup full cream milk', byName('Clover Fresh Full Cream Milk 1L')],
  ['1/4 cup butter, cold and cubed', byName('Ladismith Unsalted Butter 500g')],
  // Malva pudding
  ['1 tbsp butter, melted', byName('Ladismith Unsalted Butter 500g')],
  ['1 cup full cream milk', byName('Clover Fresh Full Cream Milk 1L')],
]

// Ingredient lines from the seeded SA recipes that have NO product in the
// real catalogue — these must return null (plain text, no link). This is
// intended behaviour since the pantry products were removed.
const UNLINKED: string[] = [
  '4 cups cake flour',
  '1 sachet instant yeast (10g)',
  '2 tsp white sugar',
  '2 tsp table salt',
  '2 tsp Durban curry powder',
  '1 tbsp smooth apricot jam',
  '1 tsp bicarbonate of soda',
  '1 tsp baking powder',
  '1 tsp white spirit vinegar',
  '1 tsp vanilla essence (for sauce)',
  '2 packets Tennis biscuits (200g each)',
  '1 tin caramel treat (360g)',
  '2 cups whipping cream, cold',
  '3 bars Peppermint Crisp chocolate (49g each), crushed',
  '1 cup coconut milk',
  '2 large free range eggs',
  '1 onion, finely chopped',
  '2 large tomatoes, diced',
  '2 potatoes, peeled and halved',
  '2 tsp garlic, crushed',
  '1 tsp fresh ginger, grated',
  '1 tsp ground cinnamon',
]

// Every ingredient line across all five seeded SA recipes.
const ALL_RECIPE_INGREDIENTS = [
  // Vetkoek
  '4 cups cake flour', '1 sachet instant yeast (10g)', '2 tsp white sugar', '2 tsp table salt',
  '1.5 cups lukewarm water', '2 tbsp sunflower oil, plus extra for frying',
  '500 g beef mince (for curried mince filling)', '1 onion, finely chopped',
  '2 tsp Durban curry powder', '1 tomato, diced', '1 tsp garlic, crushed', '1 tsp fresh ginger, grated',
  // Malva pudding
  '1 cup white sugar', '2 large free range eggs', '1 tbsp smooth apricot jam', '1.5 cups cake flour',
  '1 tsp bicarbonate of soda', '1 tsp baking powder', 'pinch table salt', '1 tbsp butter, melted',
  '1 tsp white spirit vinegar', '1 cup full cream milk', '1 cup brown sugar (for sauce)',
  '1/2 cup fresh cream (for sauce)', '1/2 cup butter (for sauce)', '1 tsp vanilla essence (for sauce)',
  // Peppermint crisp tart
  '2 packets Tennis biscuits (200g each)', '1 tin caramel treat (360g)', '2 cups whipping cream, cold',
  '3 bars Peppermint Crisp chocolate (49g each), crushed', '1 tsp vanilla essence', 'pinch table salt (optional)',
  // Durban chicken curry
  '1 kg chicken thighs, skinless (or Grain Field Chickens drumsticks & thighs)', '2 tbsp sunflower oil',
  '1 onion, diced', '2 tsp garlic, crushed', '2 tsp fresh ginger, grated', '2 tbsp Durban curry powder',
  '1 tsp ground cinnamon', '1 tsp ground ginger', '2 large tomatoes, diced', '2 potatoes, peeled and halved',
  '1 cup coconut milk', '1 cup water', 'pinch table salt', 'fresh coriander for garnish (optional)',
  // Koeksisters
  '2 cups cake flour', '2 tbsp baking powder', '1/2 tsp table salt', '1/4 cup butter, cold and cubed',
  '3/4 cup full cream milk', '1 large free range egg, beaten', '2 cups white sugar (for syrup)',
  '1 cup water (for syrup)', '1 tsp ground cinnamon (for syrup)', '1 tsp ground ginger (for syrup)',
  '1 tbsp lemon juice (for syrup)', '1 tsp vanilla essence (for syrup)', 'sunflower oil for deep frying',
]

describe('SA recipes against the real catalogue (post pantry-removal contract)', () => {
  it('links an ingredient only when a real catalogue product matches', () => {
    for (const [ingredient, slug] of LINKED) {
      expect(findIngredientProduct(ingredient, catalogue)?.slug, ingredient).toBe(slug)
    }
  })

  it('returns null — no link — when the catalogue has no matching product', () => {
    for (const ingredient of UNLINKED) {
      expect(findIngredientProduct(ingredient, catalogue), ingredient).toBeNull()
    }
  })

  it('never matches a non-edible (pet/baby) product into a recipe', () => {
    for (const ingredient of ALL_RECIPE_INGREDIENTS) {
      const match = findIngredientProduct(ingredient, catalogue)
      expect(match?.category?.slug, ingredient).not.toBe('pet-supplies')
      expect(match?.category?.slug, ingredient).not.toBe('baby-toddler')
    }
  })

  it('handles every seeded SA recipe ingredient without throwing', () => {
    for (const ingredient of ALL_RECIPE_INGREDIENTS) {
      expect(() => findIngredientProduct(ingredient, catalogue)).not.toThrow()
    }
  })

  it('Tim Tam biscuits are not mistaken for Tennis biscuits', () => {
    // The catalogue stocks Tim Tams but not Tennis biscuits — the tart must
    // not fake a link to a different biscuit.
    expect(findIngredientProduct('2 packets Tennis biscuits (200g each)', catalogue)).toBeNull()
  })
})
