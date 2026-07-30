import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'
import { api } from '@/lib/api'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  decrementItem: (productId: number) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
  syncToServer: () => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, 8)
          set({ items: items.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i) })
        } else {
          set({ items: [...items, { product, quantity: Math.min(quantity, 8) }] })
        }
      },
      decrementItem: (productId) => {
        const items = get().items
        const existing = items.find(i => i.product.id === productId)
        if (existing) {
          if (existing.quantity > 1) {
            set({ items: items.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i) })
          } else {
            set({ items: items.filter(i => i.product.id !== productId) })
          }
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter(i => i.product.id !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        set({ items: get().items.map(i => i.product.id === productId ? { ...i, quantity: Math.min(Math.max(quantity, 1), 8) } : i) })
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + Number(i.product.sale_price ?? i.product.price) * i.quantity, 0),
      itemCount: () => get().items.length,
      syncToServer: async () => {
        const items = get().items
        await api.syncCart(items.map(i => ({ product_id: i.product.id, quantity: i.quantity })))
      },
    }),
    { name: 'cart-storage' }
  )
)
