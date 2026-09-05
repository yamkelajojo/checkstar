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

describe('findIngredientProduct', () => {
  const catalogue = [
    product({ id: 1, name: 'Sugar', slug: 'sugar' }),
    product({ id: 2, name: 'Brown Sugar', slug: 'brown-sugar' }),
    product({ id: 3, name: 'Milk', slug: 'milk' }),
    product({ id: 4, name: 'Buttermilk', slug: 'buttermilk' }),
    product({ id: 5, name: 'Eggs', slug: 'eggs' }),
    product({ id: 6, name: 'Olive Oil', slug: 'olive-oil' }),
  ]

  it('links a plain ingredient to its product', () => {
    expect(findIngredientProduct('1 tsp sugar', catalogue)?.slug).toBe('sugar')
    expect(findIngredientProduct('500 ml milk', catalogue)?.slug).toBe('milk')
  })

  it('is case- and punctuation-insensitive', () => {
    expect(findIngredientProduct('2 tbsp. Brown Sugar!', catalogue)?.slug).toBe('brown-sugar')
  })

  it('requires whole words — Milk must not hijack Buttermilk', () => {
    expect(findIngredientProduct('500 ml buttermilk', catalogue)?.slug).toBe('buttermilk')
  })

  it('prefers the longest (most specific) product name', () => {
    expect(findIngredientProduct('1 cup brown sugar', catalogue)?.slug).toBe('brown-sugar')
  })

  it('folds simple plurals in the ingredient line', () => {
    expect(findIngredientProduct('3 eggs', catalogue)?.slug).toBe('eggs')
    expect(findIngredientProduct('3 egg', catalogue)?.slug).toBe('eggs')
  })

  it('matches multi-word products inside longer lines', () => {
    expect(findIngredientProduct('2 tbsp olive oil for frying', catalogue)?.slug).toBe('olive-oil')
  })

  it('returns null when nothing plausibly matches', () => {
    expect(findIngredientProduct('a pinch of salt', catalogue)).toBeNull()
    expect(findIngredientProduct('', catalogue)).toBeNull()
  })

  it('ignores degenerate product names', () => {
    const weird = [product({ id: 9, name: 'Ma', slug: 'ma' })]
    expect(findIngredientProduct('1 ripe mango', weird)).toBeNull()
  })
})
