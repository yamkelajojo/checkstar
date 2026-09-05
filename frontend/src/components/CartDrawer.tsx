'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { mediaUrl } from '@/lib/media'
import { useCartStore } from '@/stores/cart-store'
import type { CartItem } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, restoreItem, updateQuantity, total, clearCart } = useCartStore()

  const [toast, setToast] = useState<{ item: CartItem } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const removeWithUndo = (item: CartItem) => {
    removeItem(item.product.id)
    setToast({ item })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setToast(null), 5000)
  }

  const undo = () => {
    if (!toast) return
    if (timerRef.current) clearTimeout(timerRef.current)
    restoreItem(toast.item.product, toast.item.quantity)
    setToast(null)
  }

  const decrement = (item: CartItem) => {
    if (item.quantity <= 1) {
      removeWithUndo(item)
    } else {
      updateQuantity(item.product.id, item.quantity - 1)
    }
  }

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
              <h2 className="font-display text-base sm:text-lg font-semibold">Your Cart</h2>
              <button onClick={onClose} aria-label="Close cart" className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.4, 0.01, 0.165, 0.99] }}
                  className="flex flex-col items-center justify-center py-16 text-[#968D84]"
                >
                  <motion.div
                    initial={{ rotate: -5, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <ShoppingBag size={48} className="mb-4" />
                  </motion.div>
                  <p className="text-sm font-medium">Your cart is empty</p>
                  <p className="text-xs mt-1 opacity-60">Add some groceries to get started</p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  {items.map(item => (
                    <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      <div className="relative w-14 h-14 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                        {item.product.image && <Image src={mediaUrl(item.product.image)} alt={item.product.name} fill sizes="56px" className="object-contain" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.product.unit}</p>
                        <p className="text-sm font-semibold text-primary mt-1">
                          R{(Number(item.product.effective_price ?? item.product.sale_price ?? item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => decrement(item)} aria-label="Decrease quantity" className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100">
                          -</button>
                        <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label="Increase quantity" className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center text-sm hover:bg-gray-100">
                          +</button>
                      </div>
                      <button onClick={() => removeWithUndo(item)} aria-label="Remove item" className="p-1 text-gray-300 hover:text-accent transition-colors">
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
                  <span className="font-bold text-lg">R{total.toFixed(2)}</span>
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

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 40, opacity: 0, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-[60] flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm"
          >
            <span>Removed</span>
            <button onClick={undo} className="font-semibold underline underline-offset-2 hover:opacity-80" style={{ color: '#EB6522' }}>
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
