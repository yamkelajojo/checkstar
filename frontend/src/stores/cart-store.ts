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
  total: number
  itemCount: number
  distinctCount: number
  totalQuantity: number
  syncToServer: () => Promise<{ data: any; dropped: any } | undefined>
}

function computeDerived(items: CartItem[]) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalQuantity = itemCount
  const distinctCount = items.length
  const total = items.reduce((sum, i) => sum + Number(i.product.effective_price ?? i.product.sale_price ?? i.product.price) * i.quantity, 0)
  return { itemCount, totalQuantity, distinctCount, total }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ...computeDerived([]),
      addItem: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, 8)
          const next = items.map(i => i.product.id === product.id ? { ...i, quantity: newQty } : i)
          set({ ...computeDerived(next), items: next })
        } else {
          const next = [...items, { product, quantity: Math.min(quantity, 8) }]
          set({ ...computeDerived(next), items: next })
        }
      },
      decrementItem: (productId) => {
        const items = get().items
        const existing = items.find(i => i.product.id === productId)
        if (existing) {
          if (existing.quantity > 1) {
            const next = items.map(i => i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i)
            set({ ...computeDerived(next), items: next })
          } else {
            const next = items.filter(i => i.product.id !== productId)
            set({ ...computeDerived(next), items: next })
          }
        }
      },
      removeItem: (productId) => {
        const next = get().items.filter(i => i.product.id !== productId)
        set({ ...computeDerived(next), items: next })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          const next = get().items.filter(i => i.product.id !== productId)
          set({ ...computeDerived(next), items: next })
          return
        }
        const next = get().items.map(i => i.product.id === productId ? { ...i, quantity: Math.min(Math.max(quantity, 1), 8) } : i)
        set({ ...computeDerived(next), items: next })
      },
      clearCart: () => set({ items: [], ...computeDerived([]) }),
      syncToServer: async () => {
        const items = get().items
        const res = await api.syncCart(items.map(i => ({ product_id: i.product.id, quantity: i.quantity })))
        if (res?.data) {
          const serverItems: typeof items = res.data.map((ci: any) => ({
            product: ci.product,
            quantity: ci.quantity,
          }))
          set({ ...computeDerived(serverItems), items: serverItems })
        }
        return res
      },
    }),
    { name: 'cart-storage' }
  )
)
