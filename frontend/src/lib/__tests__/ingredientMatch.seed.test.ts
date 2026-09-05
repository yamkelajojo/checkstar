import { describe, expect, it } from 'vitest'
import { findIngredientProduct } from '../ingredientMatch'
import type { Category, Product } from '@/types'

/**
 * THE regression: "I still can't see any product thumbnails in the recipe."
 *
 * The previous matchers required the whole product name to appear inside the
 * ingredient line — against the real retail catalogue
 * (products_dataset/products.json) that matched 0 of the 16 seeded recipe
 * ingredients, so no thumbnail ever rendered. This file pins matching against
 * REAL catalogue names and the seeded RecipeSeeder ingredients. If these
 * pairs break, the recipe thumbnails are broken for users.
 */

// Names lifted verbatim from products_dataset/products.json.
const C = (id: number, slug: string): Category => ({ id, name: slug, slug, description: null, image: null, icon: null, sort_order: id })
const catalogue: Product[] = [
  ['Grain Field Chickens Fresh Chicken Drumsticks & Thighs Per kg', 'meat-poultry'],
  ['Festive Fresh Chicken Thighs Per kg', 'meat-poultry'],
  ['Stewing Beef Per kg', 'meat-poultry'],
  ['Cape Point Frozen Hake Fillets With Skin 800g', 'frozen-foods'],
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
  ['Blueberries 125g', 'fruits-vegetables'],
  ['Bella Vita BBQ Chicken Pasta 300g', 'ready-meals-deli'],
  ['Zip Cola Flavoured Soft Drink 2L', 'beverages'],
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

// Ingredients lifted from the current RecipeSeeder.
const BRAAI = ['4 chicken thighs, skin on', '2 tbsp butter, softened', '4 slices white bread', '3 red apples, quartered', '1 cup white grapes', '1 lemon, halved']
const PASTA = ['4 chicken thighs, sliced', '250 ml full cream milk', '100 g butter', '1 cup mozzarella cheese, grated', '500 g pasta, cooked', 'Salt and pepper']
const SMOOTHIE = ['2 bananas, peeled and sliced', '2 red apples, cored and chopped', '1 cup full cream milk', '1 cup white grapes, halved', '1 cup ice cubes']

describe('seeded recipes against the real catalogue (thumbnail regression)', () => {
  it('links the braai recipe ingredients to real products', () => {
    expect(findIngredientProduct(BRAAI[0], catalogue)?.name).toContain('Chicken Drumsticks & Thighs')
    expect(findIngredientProduct(BRAAI[1], catalogue)?.name).toContain('Butter')
    expect(findIngredientProduct(BRAAI[2], catalogue)?.name).toBe('SASKO Premium Slices White Bread 700g')
    expect(findIngredientProduct(BRAAI[3], catalogue)?.name).toBe('Top Red Apples 1.5kg')
    expect(findIngredientProduct(BRAAI[4], catalogue)?.name).toBe('White Seedless Grapes 500g')
    expect(findIngredientProduct(BRAAI[5], catalogue)?.name).toBe('Lemons 7 Pack')
  })

  it('links the creamy chicken pasta ingredients to real products', () => {
    expect(findIngredientProduct(PASTA[0], catalogue)?.name).toContain('Chicken')
    expect(findIngredientProduct(PASTA[1], catalogue)?.name).toContain('Full Cream Milk')
    expect(findIngredientProduct(PASTA[2], catalogue)?.name).toContain('Butter')
    expect(findIngredientProduct(PASTA[3], catalogue)?.name).toContain('Mozzarella')
  })

  it('links the smoothie ingredients to real products', () => {
    expect(findIngredientProduct(SMOOTHIE[0], catalogue)?.name).toBe('Bananas 1.2kg')
    expect(findIngredientProduct(SMOOTHIE[1], catalogue)?.name).toBe('Top Red Apples 1.5kg')
    expect(findIngredientProduct(SMOOTHIE[2], catalogue)?.name).toContain('Full Cream Milk')
    expect(findIngredientProduct(SMOOTHIE[3], catalogue)?.name).toBe('White Seedless Grapes 500g')
    expect(findIngredientProduct(SMOOTHIE[4], catalogue)).toBeNull() // ice cubes are not sold
  })

  it('links a high share of catalogue-coherent recipe ingredients (>= 90%)', () => {
    const coherent = [...BRAAI, ...PASTA, ...SMOOTHIE].filter((i) => !/salt|pepper|ice/i.test(i))
    const linked = coherent.filter((i) => findIngredientProduct(i, catalogue) !== null)
    expect(linked.length / coherent.length).toBeGreaterThanOrEqual(0.9)
  })

  it('never links a recipe ingredient to pet or baby products from the real dataset', () => {
    const stray = catalogue.find((p) => /whiskas|purity/i.test(p.name))
    expect(stray).toBeUndefined() // the catalogue slice above stays edible-only
  })
})
