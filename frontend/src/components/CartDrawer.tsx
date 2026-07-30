'use client'

import { motion, AnimatePresence } from 'motion/react'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useCartStore } from '@/stores/cart-store'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-display text-lg font-semibold">Your Cart</h2>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <ShoppingBag size={48} className="mb-4" />
                  <p className="text-sm">Your cart is empty</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                        {item.product.image && <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">{item.product.unit}</p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          R{(Number(item.product.sale_price ?? item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100">
                          -</button>
                        <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100">
                          +</button>
                      </div>
                      <button onClick={() => removeItem(item.product.id)} className="p-1 text-gray-300 hover:text-accent transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">Total</span>
                  <span className="font-bold text-lg">R{total().toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={clearCart} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    Clear
                  </button>
                  <Link href="/cart" onClick={onClose} className="flex-1 px-4 py-2 text-sm bg-primary text-white rounded-lg text-center hover:bg-primary-dark transition-colors">
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
