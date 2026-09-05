import { describe, expect, it } from 'vitest'
import { findIngredientProduct } from '../ingredientMatch'
import type { Product } from '@/types'

const product = (over: Partial<Product>): Product => ({
  id: 1,
  category_id: 1,
  name: 'Sugar',
  slug: 'sugar',
  description: null,
  image: null,
  images: null,
  unit: 'each',
  price: 10,
  sale_price: null,
  tags: null,
  is_featured: false,
  ...over,
})

const category = (slug: string) => ({ id: 1, name: slug, slug, description: null, image: null, icon: null, sort_order: 1 })

describe('findIngredientProduct', () => {
  const catalogue = [
    product({ id: 1, name: 'Sugar', slug: 'sugar' }),
    product({ id: 2, name: 'Brown Sugar', slug: 'brown-sugar' }),
    product({ id: 3, name: 'Milk', slug: 'milk' }),
    product({ id: 4, name: 'Buttermilk', slug: 'buttermilk' }),
    product({ id: 5, name: 'Eggs', slug: 'eggs' }),
    product({ id: 6, name: 'Olive Oil 750ml', slug: 'olive-oil' }),
    product({ id: 7, name: 'Full Cream Milk 2L', slug: 'full-cream-milk', category: category('dairy-eggs') }),
  ]

  it('links a plain ingredient to its product', () => {
    expect(findIngredientProduct('2 tbsp sugar', catalogue)?.slug).toBe('sugar')
    expect(findIngredientProduct('500 ml milk', catalogue)?.slug).toBe('milk')
  })

  it('is case- and punctuation-insensitive', () => {
    expect(findIngredientProduct('2 tbsp. Brown Sugar!', catalogue)?.slug).toBe('brown-sugar')
  })

  it('requires whole words — Milk must not hijack Buttermilk', () => {
    expect(findIngredientProduct('500 ml buttermilk', catalogue)?.slug).toBe('buttermilk')
  })

  it('prefers the longest (most specific) match', () => {
    expect(findIngredientProduct('1 cup brown sugar', catalogue)?.slug).toBe('brown-sugar')
    expect(findIngredientProduct('olive oil for frying', catalogue)?.slug).toBe('olive-oil')
  })

  it('folds plurals in both directions', () => {
    expect(findIngredientProduct('3 eggs', catalogue)?.slug).toBe('eggs')
    expect(findIngredientProduct('3 egg', catalogue)?.slug).toBe('eggs')
    expect(findIngredientProduct('2 ripe mangoes', [product({ name: 'Mango', slug: 'mango' })])?.slug).toBe('mango')
    expect(findIngredientProduct('4 apples', [product({ name: 'Starking Apples 1.5kg', slug: 'starking-apples' })])?.slug).toBe('starking-apples')
  })

  it('returns null when nothing plausibly matches', () => {
    expect(findIngredientProduct('a pinch of salt', catalogue)).toBeNull()
    expect(findIngredientProduct('', catalogue)).toBeNull()
    expect(findIngredientProduct('ice cubes', catalogue)).toBeNull()
  })

  it('ignores degenerate product names', () => {
    const weird = [product({ id: 9, name: 'Ma', slug: 'ma' })]
    expect(findIngredientProduct('1 ripe mango', weird)).toBeNull()
  })

  it('never links pet or baby food to a food recipe', () => {
    const shelves = [
      product({ id: 10, name: 'Whiskas Lamb In Gravy Cat Food 85g', slug: 'whiskas', category: category('pet-supplies') }),
      product({ id: 11, name: 'PURITY Chicken & Apricot Curry Meal Puree', slug: 'purity-curry', category: category('baby-toddler') }),
    ]
    expect(findIngredientProduct('4 lamb chops', shelves)).toBeNull()
    expect(findIngredientProduct('2 tbsp curry powder', shelves)).toBeNull()
  })

  it('rejects negated products (Zero Sugar drinks for sugar)', () => {
    const drinks = [
      product({ id: 12, name: 'Coca-Cola Zero Sugar Soft Drink 2.25L', slug: 'coke-zero', category: category('beverages') }),
      product({ id: 13, name: 'Pepsi MAX Cola Flavoured Sugar Free Soft Drink 2L', slug: 'pepsi-max', category: category('beverages') }),
    ]
    expect(findIngredientProduct('2 tbsp sugar', drinks)).toBeNull()
  })

  it('links flavour tokens of generically-headed products (cola for 2 cups cola)', () => {
    const drinks = [product({ id: 14, name: 'Zip Cola Flavoured Soft Drink 2L', slug: 'zip-cola', category: category('beverages') })]
    expect(findIngredientProduct('2 cups cola', drinks)?.slug).toBe('zip-cola')
  })

  it('does not link a lone generic head noun (protein powder for curry powder)', () => {
    const shelves = [product({ id: 15, name: 'USN Muscle Fuel Chocolate Flavoured Protein Powder 454g', slug: 'usn', category: category('pantry-staples') })]
    expect(findIngredientProduct('2 tbsp curry powder', shelves)).toBeNull()
  })
})
