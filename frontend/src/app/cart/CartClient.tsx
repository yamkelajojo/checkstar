'use client'

import { motion } from 'motion/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCartStore } from '@/stores/cart-store'

export default function CartClient() {
  const { items, total, removeItem, updateQuantity } = useCartStore()

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-6">Your Cart</h1>
          {items.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <div>
              {items.map(item => (
                <div key={item.product.id} className="flex items-center gap-4 py-3 border-b border-gray-100">
                  <span className="flex-1 text-sm">{item.product.name}</span>
                  <span className="text-sm font-medium">R{((item.product.sale_price ?? item.product.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="mt-6 text-right">
                <span className="font-bold text-lg">Total: R{total().toFixed(2)}</span>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
