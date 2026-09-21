import { describe, it, expect } from 'vitest'
import { findIngredientProduct, _test } from '../ingredientMatch'
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

describe('ingredientMatch improvements', () => {
  it('handles SA synonyms: baby marrow -> zucchini', () => {
    const catalogue = [product({ id: 1, name: 'Zucchini 500g', slug: 'zucchini' })]
    expect(findIngredientProduct('2 baby marrows, sliced', catalogue)?.slug).toBe('zucchini')
    expect(findIngredientProduct('1 courgette', catalogue)?.slug).toBe('zucchini')
  })

  it('handles brinjal -> eggplant', () => {
    const catalogue = [product({ id: 1, name: 'Eggplant 1kg', slug: 'eggplant' })]
    expect(findIngredientProduct('1 brinjal, diced', catalogue)?.slug).toBe('eggplant')
    expect(findIngredientProduct('2 aubergines', catalogue)?.slug).toBe('eggplant')
  })

  it('handles mielie -> corn and naartjie -> mandarin', () => {
    const cat = [
      product({ id: 1, name: 'Sweet Corn 4 Pack', slug: 'corn' }),
      product({ id: 2, name: 'Naartjies 1kg', slug: 'naartjie', category: category('fruits-vegetables') }),
    ]
    expect(findIngredientProduct('2 mielies', cat)?.slug).toBe('corn')
    expect(findIngredientProduct('3 mandarins', cat)?.slug).toBe('naartjie')
  })

  it('handles capsicum -> pepper and chilli typo tolerance', () => {
    const cat = [
      product({ id: 1, name: 'Green Pepper 3 Pack', slug: 'pepper' }),
      product({ id: 2, name: 'Red Chilli 50g', slug: 'chili' }),
    ]
    expect(findIngredientProduct('1 capsicum, diced', cat)?.slug).toBe('pepper')
    expect(findIngredientProduct('1 bell pepper', cat)?.slug).toBe('pepper')
    expect(findIngredientProduct('1 chilli', cat)?.slug).toBe('chili')
  })

  it('fuzzy matches typos: mozzarela -> mozzarella', () => {
    const cat = [product({ id: 1, name: 'Mozzarella Cheese 250g', slug: 'mozzarella' })]
    const single = [product({ id: 2, name: 'Mozzarella', slug: 'mozzarella-single' })]
    expect(findIngredientProduct('1 cup mozzarela cheese', cat)?.slug).toBe('mozzarella')
    // single token fuzzy on head noun should work when product is just mozzarella
    expect(findIngredientProduct('mozzareela', single)?.slug).toBe('mozzarella-single')
    expect(findIngredientProduct('mozzarela', single)?.slug).toBe('mozzarella-single')
  })

  it('fuzzy does not over-match short tokens', () => {
    const cat = [product({ id: 1, name: 'Ma', slug: 'ma' })]
    expect(findIngredientProduct('mango', cat)).toBeNull()
  })

  it('expanded stopwords do not break existing matches', () => {
    const cat = [
      product({ id: 1, name: 'Sugar', slug: 'sugar' }),
      product({ id: 2, name: 'Butter', slug: 'butter' }),
    ]
    expect(findIngredientProduct('2 tbsp sugar', cat)?.slug).toBe('sugar')
    expect(findIngredientProduct('2 tbsp butter, softened', cat)?.slug).toBe('butter')
    expect(findIngredientProduct('1 lemon, halved', [product({ name: 'Lemons 7 Pack', slug: 'lemons' })])?.slug).toBe('lemons')
  })

  it('levenshtein helper works', () => {
    expect(_test.levenshtein('mozzarella', 'mozzarela')).toBe(1)
    expect(_test.levenshtein('sugar', 'sugar')).toBe(0)
    expect(_test.isFuzzyMatch('mozzarella', 'mozzarela')).toBe(true)
    expect(_test.isFuzzyMatch('ma', 'mango')).toBe(false)
  })

  it('phrase synonym replacement is case-insensitive', () => {
    expect(_test.normalize('Baby Marrows')).toContain('zucchini')
    expect(_test.normalize('Bell Pepper')).toContain('pepper')
  })
})
