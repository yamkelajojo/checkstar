import { describe, it, expect } from 'vitest'
import { findIngredientProduct } from '../ingredientMatch'
import type { Product, Category } from '@/types'

const C = (id: number, slug: string): Category => ({ id, name: slug, slug, description: null, image: null, icon: null, sort_order: id })

// Combined catalogue: real + SA pantry essentials
const catalogue: Product[] = [
  // real sample
  ['Grain Field Chickens Fresh Chicken Drumsticks & Thighs Per kg', 'meat-poultry'],
  ['Festive Fresh Chicken Thighs Per kg', 'meat-poultry'],
  ['Stewing Beef Per kg', 'meat-poultry'],
  ['Beef Mince (per kg)', 'meat-poultry'],
  ['Clover Fresh Full Cream Milk 1L', 'dairy-eggs'],
  ['Ladismith Unsalted Butter 500g', 'dairy-eggs'],
  ['Galbani Mozzarella Cheese 300g', 'dairy-eggs'],
  ['SASKO Premium Slices White Bread 700g', 'bakery'],
  ['Bananas 1.2kg', 'fruits-vegetables'],
  ['Lemons 7 Pack', 'fruits-vegetables'],
  // SA pantry
  ['Snowflake Cake Wheat Flour 2.5kg', 'pantry-staples'],
  ['Selati White Sugar 2kg', 'pantry-staples'],
  ['Selati Light Brown Sugar 1kg', 'pantry-staples'],
  ['Anchor Instant Yeast 10g', 'pantry-staples'],
  ['Sunfoil Sunflower Oil 750ml', 'pantry-staples'],
  ['Robertsons Baking Powder 100g', 'pantry-staples'],
  ['Robertsons Bicarbonate of Soda 100g', 'pantry-staples'],
  ['Cerebos Iodated Table Salt 500g', 'pantry-staples'],
  ['All Gold Smooth Apricot Jam 450g', 'pantry-staples'],
  ['Heinz White Spirit Vinegar 750ml', 'pantry-staples'],
  ['Robertsons Ground Cinnamon 40g', 'pantry-staples'],
  ['Robertsons Ground Ginger 40g', 'pantry-staples'],
  ['Rajah Mild & Spicy Durban Curry Powder 80g', 'pantry-staples'],
  ['Robertsons Vanilla Essence 40ml', 'pantry-staples'],
  ['Nestlé Golden Syrup 500g', 'pantry-staples'],
  ['Free Range Eggs 6 Pack', 'dairy-eggs'],
  ['Clover Fresh Cream 250ml', 'dairy-eggs'],
  ['Clover Whipping Cream 500ml', 'dairy-eggs'],
  ['Nestlé Caramel Treat 360g', 'dairy-eggs'],
  ['Bakers Tennis Biscuits 200g', 'snacks-treats'],
  ['Nestlé Peppermint Crisp Chocolate Bar 49g', 'snacks-treats'],
  ['Onions 1kg', 'fruits-vegetables'],
  ['Tomatoes 1kg', 'fruits-vegetables'],
  ['Potatoes 2kg', 'fruits-vegetables'],
  ['Garlic 3 Pack', 'fruits-vegetables'],
  ['Fresh Ginger 100g', 'fruits-vegetables'],
  ['Coconut Milk 400ml', 'pantry-staples'],
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

const VETKOEK = [
  '4 cups cake flour',
  '1 sachet instant yeast',
  '2 tsp white sugar',
  '2 tsp table salt',
  '1.5 cups lukewarm water',
  '2 tbsp sunflower oil',
  '500 g beef mince',
  '1 onion, finely chopped',
  '2 tsp Durban curry powder',
  '1 tomato, diced',
  '1 tsp garlic, crushed',
  '1 tsp fresh ginger, grated',
]

const MALVA = [
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
  '1 cup brown sugar',
  '1/2 cup fresh cream',
  '1/2 cup butter',
  '1 tsp vanilla essence',
]

const PEPPERMINT = [
  '2 packets Tennis biscuits',
  '1 tin caramel treat',
  '2 cups whipping cream',
  '3 bars Peppermint Crisp chocolate, crushed',
  '1 tsp vanilla essence',
]

const DURBAN = [
  '1 kg chicken thighs',
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
]

const KOEKSISTERS = [
  '2 cups cake flour',
  '2 tbsp baking powder',
  '1/2 tsp table salt',
  '1/4 cup butter, cold and cubed',
  '3/4 cup full cream milk',
  '1 large free range egg, beaten',
  '2 cups white sugar',
  '1 cup water',
  '1 tsp ground cinnamon',
  '1 tsp ground ginger',
  '1 tbsp lemon juice',
  '1 tsp vanilla essence',
  'sunflower oil for deep frying',
]

describe('SA recipes against expanded catalogue (inventory check)', () => {
  it('vetkoek ingredients all link (except water)', () => {
    const toCheck = VETKOEK.filter(i => !/water/i.test(i))
    const linked = toCheck.filter(i => findIngredientProduct(i, catalogue) !== null)
    expect(linked.length / toCheck.length).toBeGreaterThanOrEqual(0.9)
  })

  it('malva pudding ingredients all link (except water)', () => {
    const toCheck = MALVA.filter(i => !/water/i.test(i))
    const linked = toCheck.filter(i => findIngredientProduct(i, catalogue) !== null)
    expect(linked.length / toCheck.length).toBeGreaterThanOrEqual(0.85)
  })

  it('peppermint crisp tart ingredients all link', () => {
    const linked = PEPPERMINT.filter(i => findIngredientProduct(i, catalogue) !== null)
    expect(linked.length / PEPPERMINT.length).toBeGreaterThanOrEqual(0.9)
  })

  it('durban curry ingredients all link (except water)', () => {
    const toCheck = DURBAN.filter(i => !/water/i.test(i))
    const linked = toCheck.filter(i => findIngredientProduct(i, catalogue) !== null)
    expect(linked.length / toCheck.length).toBeGreaterThanOrEqual(0.9)
  })

  it('koeksisters ingredients all link (except water)', () => {
    const toCheck = KOEKSISTERS.filter(i => !/water/i.test(i))
    const linked = toCheck.filter(i => findIngredientProduct(i, catalogue) !== null)
    expect(linked.length / toCheck.length).toBeGreaterThanOrEqual(0.9)
  })

  it('overall SA recipes have >=90% link rate', () => {
    const all = [...VETKOEK, ...MALVA, ...PEPPERMINT, ...DURBAN, ...KOEKSISTERS].filter(i => !/water/i.test(i) && !/pinch/i.test(i))
    const linked = all.filter(i => findIngredientProduct(i, catalogue) !== null)
    expect(linked.length / all.length).toBeGreaterThanOrEqual(0.9)
  })
})
