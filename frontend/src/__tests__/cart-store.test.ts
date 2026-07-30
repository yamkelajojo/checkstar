import { describe, it, expect, beforeEach } from 'vitest'
import { useCartStore } from '@/stores/cart-store'
import type { Product } from '@/types'

const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  category_id: 1,
  name: 'Test Product',
  slug: 'test-product',
  description: null,
  image: null,
  images: null,
  unit: 'each',
  price: 10.00,
  sale_price: null,
  tags: null,
  is_featured: false,
  ...overrides,
})

describe('cart-store', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] })
  })

  it('store initializes with empty cart', () => {
    const { items } = useCartStore.getState()
    expect(items).toEqual([])
  })

  it('add new product to cart', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe(1)
    expect(items[0].quantity).toBe(1)
  })

  it('add existing product increments quantity', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product)
    useCartStore.getState().addItem(product)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('add product caps at max quantity 8', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product, 5)
    useCartStore.getState().addItem(product, 5)
    const { items } = useCartStore.getState()
    expect(items[0].quantity).toBe(8)
  })

  it('decrement item reduces quantity', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product, 3)
    useCartStore.getState().decrementItem(1)
    const { items } = useCartStore.getState()
    expect(items[0].quantity).toBe(2)
  })

  it('decrement item at quantity 1 removes it entirely', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product)
    useCartStore.getState().decrementItem(1)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(0)
  })

  it('remove item removes entirely regardless of quantity', () => {
    const product = mockProduct()
    useCartStore.getState().addItem(product, 5)
    useCartStore.getState().removeItem(1)
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(0)
  })

  it('clear cart removes all items', () => {
    useCartStore.getState().addItem(mockProduct({ id: 1 }))
    useCartStore.getState().addItem(mockProduct({ id: 2 }))
    useCartStore.getState().clearCart()
    const { items } = useCartStore.getState()
    expect(items).toHaveLength(0)
  })

  it('total calculated correctly', () => {
    useCartStore.getState().addItem(mockProduct({ id: 1, price: 10 }), 2)
    useCartStore.getState().addItem(mockProduct({ id: 2, price: 5, sale_price: 3 }), 3)
    const total = useCartStore.getState().total()

    // 2 × 10 + 3 × 3 = 20 + 9 = 29
    expect(total).toBe(29)
  })
})
