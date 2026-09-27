'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { useCartStore } from '@/stores/cart-store'
import type { CartItem } from '@/types'
import { formatZar } from '@/lib/money'
import { useDialogFocus } from '@/hooks/useDialogFocus'

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

  // A slide-over that traps the keyboard is a modal in everything but name:
  // focus has to move in, Tab has to stay inside, Escape has to close it, and
  // focus has to go back to the header control that opened it. Shared with the
  // admin Modal via `useDialogFocus` — the storefront used to have only Escape.
  const panelRef = useRef<HTMLDivElement>(null)
  useDialogFocus({ open, onClose, panelRef })

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
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
          />
          <motion.div
            initial={{ x: '100%', filter: 'blur(8px)' }}
            animate={{ x: 0, filter: 'blur(0px)' }}
            exit={{ x: '100%', filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            tabIndex={-1}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white/95 backdrop-blur-xl z-50 shadow-[-8px_0_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] border-l border-gray-100/50 flex flex-col outline-none"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100/80 backdrop-blur-sm">
              <div>
                <h2 className="font-display text-[17px] font-semibold tracking-tight">Your Cart</h2>
                <p className="text-xs text-gray-500 mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.05)' }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Close cart"
                className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={18} strokeWidth={2} />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center py-20 text-[#968D84]"
                >
                  <motion.div
                    initial={{ rotate: -8, scale: 0.8, y: 8 }}
                    animate={{ rotate: 0, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]"
                  >
                    <ShoppingBag size={28} className="text-gray-400" strokeWidth={1.5} />
                  </motion.div>
                  <p className="text-[15px] font-semibold text-gray-900 tracking-tight">Your cart is empty</p>
                  <p className="text-xs mt-1.5 text-gray-500 max-w-[200px] text-center leading-relaxed">Add some groceries to get started — fresh picks await</p>
                </motion.div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
                  }}
                  className="flex flex-col gap-3"
                >
                  {items.map((item, idx) => (
                    <motion.div
                      key={item.product.id}
                      variants={{
                        hidden: { opacity: 0, y: 12, filter: 'blur(4px)', scale: 0.97 },
                        visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { type: 'spring', stiffness: 400, damping: 28 } },
                      }}
                      layout
                      className="flex items-center gap-3 bg-white rounded-button p-3 border border-gray-100/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow"
                    >
                      <div className="relative w-14 h-14 bg-gradient-to-br from-gray-50 to-white rounded-sm flex items-center justify-center overflow-hidden border border-gray-100/50 shrink-0">
                        {item.product.image && <SafeImage src={item.product.image} alt={item.product.name} fill sizes="56px" className="object-contain p-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate tracking-tight text-gray-900">{item.product.name}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{item.product.unit}</p>
                        <p className="text-[13px] font-bold text-primary mt-1 tabular-nums">
                          {formatZar(Number(item.product.effective_price ?? item.product.sale_price ?? item.product.price) * item.quantity)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5 border border-gray-100">
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => decrement(item)} aria-label="Decrease quantity" className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                          <span className="text-[14px] font-medium">−</span>
                        </motion.button>
                        <span className="w-7 text-center text-[13px] font-semibold tabular-nums">{item.quantity}</span>
                        <motion.button whileTap={{ scale: 0.85 }} onClick={() => updateQuantity(item.product.id, item.quantity + 1)} aria-label="Increase quantity" className="w-7 h-7 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-sm hover:bg-gray-50 transition-colors">
                          <span className="text-[14px] font-medium">+</span>
                        </motion.button>
                      </div>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => removeWithUndo(item)} aria-label="Remove item" className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} strokeWidth={2} />
                      </motion.button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="border-t border-gray-100/80 p-5 bg-gradient-to-t from-white to-white/80 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[13px] font-medium text-gray-500">Total</span>
                  <span className="font-bold text-[20px] tracking-tight tabular-nums">{formatZar(total)}</span>
                </div>
                <div className="flex gap-2.5">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={clearCart} className="flex-1 px-4 py-3 text-[13px] font-medium border border-gray-200 rounded-button hover:bg-gray-50 transition-colors">
                    Clear
                  </motion.button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                    <Link href="/cart" onClick={onClose} className="w-full px-4 py-3 text-[13px] font-semibold bg-primary text-white rounded-button text-center hover:bg-primary-dark shadow-[0_2px_8px_rgba(235,101,34,0.25)] hover:shadow-[0_4px_12px_rgba(235,101,34,0.3)] transition-all flex items-center justify-center">
                      View Cart
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ y: 12, opacity: 0, scale: 0.98, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-gray-900/90 backdrop-blur-xl text-white px-4 py-3 rounded-button shadow-[0_8px_24px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)] border border-white/10 text-[13px]"
          >
            <span className="font-medium">Removed</span>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={undo} className="font-semibold underline underline-offset-2 hover:opacity-80 px-2 py-0.5 rounded-full bg-white/10" style={{ color: '#EB6522' }}>
              Undo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  )
}
