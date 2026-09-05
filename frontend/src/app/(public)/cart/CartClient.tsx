'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { mediaUrl } from '@/lib/media'
import { motion, AnimatePresence } from 'motion/react'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, MapPin } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import AnimatedNumber from '@/components/AnimatedNumber'
import AuthRequiredModal from '@/components/AuthRequiredModal'
import { usePlaceOrder } from '@/lib/query'
import { ApiError } from '@/lib/api'
import { getDeliveryCoords, type DeliveryCoords } from '@/lib/delivery-coords'
import LocationFallbackNotice from '@/components/LocationFallbackNotice'
import type { Dispatch } from '@/types'
import OrderConfirmation from './OrderConfirmation'

export default function CartClient() {
  const router = useRouter()
  const { items, total, removeItem, updateQuantity, decrementItem, addItem, clearCart } = useCartStore()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<{ order_number: string; id: number; payment_status?: string } | null>(null)
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [coords, setCoords] = useState<DeliveryCoords | null>(null)

  const placeOrderMutation = usePlaceOrder()

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      // Guests meet a friendly gate instead of filling the form and failing.
      setAuthModalOpen(true)
      return
    }
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
      if (err instanceof ApiError && err.status === 401) {
        // Session gone (or guest) — the modal explains it far better than a banner.
        setAuthModalOpen(true)
        return
      }
      setPlaceError(err.message || 'Failed to place order.')
    }
  }

  const subtotal = total
  const deliveryFee: number = 0

  if (placedOrder) {
    return <OrderConfirmation order={placedOrder} dispatch={dispatch} />
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-display text-xl sm:text-3xl font-bold">Your Cart</h1>
            {items.length > 0 && (
              <span className="text-sm text-gray-500">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
            )}
          </div>

          {items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-lg font-semibold text-gray-600 mb-2">Your cart is empty</h2>
              <p className="text-sm text-gray-500 mb-6">Add some groceries to get started.</p>
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
                        className="flex items-start gap-3 py-4 border-b border-gray-100 sm:items-center sm:gap-4"
                      >
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {item.product.image ? (
                            <Image src={mediaUrl(item.product.image)} alt={item.product.name} fill sizes="64px" className="object-cover" />
                          ) : (
                            <ShoppingBag size={20} className="text-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm font-medium line-clamp-2 sm:truncate">{item.product.name}</p>
                          {item.product.unit && <p className="text-xs text-gray-500 mt-0.5">{item.product.unit}</p>}
                          <p className="text-sm font-semibold text-primary mt-1 sm:mt-0.5">
                            R{price.toFixed(2)}
                          </p>
                        </div>

                        {/* Mobile: line total above the stepper, delete below —
                            the five-column row physically cannot fit a phone,
                            which squeezed the name into one character per line. */}
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                          <p className="order-1 text-right text-sm sm:w-20 text-base font-semibold tabular-nums sm:order-2">
                            <span className="tabular-nums">
                              R<AnimatedNumber value={price * item.quantity} format={(n) => n.toFixed(2)} />
                            </span>
                          </p>

                          <div className="order-2 flex items-center gap-1.5 sm:order-1">
                            <button
                              onClick={() => decrementItem(item.product.id)}
                              aria-label={`Decrease quantity of ${item.product.name}`}
                              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium tabular-nums">
                              <AnimatedNumber value={item.quantity} />
                            </span>
                            <button
                              onClick={() => addItem(item.product, 1)}
                              aria-label={`Increase quantity of ${item.product.name}`}
                              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.product.id)}
                            aria-label={`Remove ${item.product.name} from cart`}
                            className="order-3 p-1.5 text-gray-300 hover:text-accent transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
                      <span className="tabular-nums">
                        R<AnimatedNumber value={subtotal} format={(n) => n.toFixed(2)} />
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Delivery</span>
                      <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                        {deliveryFee === 0 ? 'Free' : `R${deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span className="tabular-nums">
                        R<AnimatedNumber value={subtotal + deliveryFee} format={(n) => n.toFixed(2)} />
                      </span>
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
      </div>
      <AuthRequiredModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} redirectTo="/cart" />
    </>
  )
}
