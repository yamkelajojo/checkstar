'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, MapPin } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { usePlaceOrder } from '@/lib/query'
import { getDeliveryCoords, type DeliveryCoords } from '@/lib/delivery-coords'
import LocationFallbackNotice from '@/components/LocationFallbackNotice'
import type { Dispatch } from '@/types'
import OrderConfirmation from './OrderConfirmation'

export default function CartClient() {
  const router = useRouter()
  const { items, total, removeItem, updateQuantity, decrementItem, addItem, clearCart } = useCartStore()
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [placedOrder, setPlacedOrder] = useState<{ order_number: string; id: number; payment_status?: string } | null>(null)
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [coords, setCoords] = useState<DeliveryCoords | null>(null)

  const placeOrderMutation = usePlaceOrder()

  const handleProceedToCheckout = () => {
    setShowCheckoutForm(true)
    getDeliveryCoords().then(setCoords)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlaceError('')
    if (!deliveryAddress.trim()) {
      setPlaceError('Please enter a delivery address.')
      return
    }
    try {
      const resolved = coords ?? (await getDeliveryCoords())
      const result = await placeOrderMutation.mutateAsync({
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        delivery_address: deliveryAddress.trim(),
        delivery_latitude: resolved.latitude,
        delivery_longitude: resolved.longitude,
        payment_method: 'cash_on_delivery',
      })
      // Keep-on-cancel decision (#04): OrderCartPolicy keeps cart when dispatch is
      // cancelled/retrying so Customer can re-checkout. Only clear when backend
      // confirms the order proceeded (assigned).
      if (result.dispatch?.status === 'assigned') {
        clearCart()
      }
      setPlacedOrder({ order_number: result.data.order_number, id: result.data.id, payment_status: result.data.payment_status })
      setDispatch(result.dispatch)
    } catch (err: any) {
      setPlaceError(err.message || 'Failed to place order.')
    }
  }

  const subtotal = total()
  const deliveryFee: number = 0

  if (placedOrder) {
    return <OrderConfirmation order={placedOrder} dispatch={dispatch} />
  }

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-xl sm:text-3xl font-bold">Your Cart</h1>
            {items.length > 0 && (
              <span className="text-sm text-gray-400">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            )}
          </div>

          {items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h2>
              <p className="text-sm text-gray-400 mb-6">Add some groceries to get started.</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Browse Products <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-1">
                <AnimatePresence initial={false}>
                  {items.map(item => {
                    const price = Number(item.product.effective_price ?? item.product.sale_price ?? item.product.price)
                    return (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                        className="flex items-center gap-4 py-4 border-b border-gray-100"
                      >
                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {item.product.image ? (
                            <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag size={20} className="text-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-400">{item.product.unit}</p>
                          <p className="text-sm font-semibold text-primary mt-0.5">
                            R{price.toFixed(2)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => decrementItem(item.product.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() => addItem(item.product, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-right w-20">
                          <p className="text-sm font-semibold">R{(price * item.quantity).toFixed(2)}</p>
                        </div>

                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-1.5 text-gray-300 hover:text-accent transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
                  <h2 className="font-display text-base sm:text-lg font-semibold mb-4">Order Summary</h2>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span>R{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery</span>
                      <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                        {deliveryFee === 0 ? 'Free' : `R${deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>R{(subtotal + deliveryFee).toFixed(2)}</span>
                    </div>
                  </div>

                  {!showCheckoutForm ? (
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleProceedToCheckout}
                      className="w-full mt-5 bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout <ArrowRight size={16} />
                    </motion.button>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handlePlaceOrder}
                      className="mt-5 space-y-3"
                    >
                      {placeError && (
                        <p className="text-xs text-accent">{placeError}</p>
                      )}

                      {coords?.usedFallback && <LocationFallbackNotice />}

                      <div>
                        <label htmlFor="delivery-address" className="block text-xs font-medium text-gray-600 mb-1">
                          Delivery Address
                        </label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                          <textarea
                            id="delivery-address"
                            rows={2}
                            value={deliveryAddress}
                            onChange={e => setDeliveryAddress(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                            placeholder="Enter your delivery address"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCheckoutForm(false)}
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                        <motion.button
                          type="submit"
                          disabled={placeOrderMutation.isPending}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {placeOrderMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                          {placeOrderMutation.isPending ? 'Placing...' : 'Place Order'}
                        </motion.button>
                      </div>
                    </motion.form>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </>
  )
}
