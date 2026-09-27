'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, MapPin, Store as StoreIcon } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import AnimatedNumber from '@/components/AnimatedNumber'
import AuthRequiredModal from '@/components/AuthRequiredModal'
import { usePlaceOrder } from '@/lib/query'
import { api, ApiError } from '@/lib/api'
import { getDeliveryCoords, type DeliveryCoords } from '@/lib/delivery-coords'
import LocationFallbackNotice from '@/components/LocationFallbackNotice'
import type { Dispatch, FulfilmentMethod, Store as StoreType, UserAddress } from '@/types'
import OrderConfirmation from './OrderConfirmation'
import { spring, ease } from '@/lib/motion/tokens'
import { formatAmount, formatZar } from '@/lib/money'

export default function CartClient() {
  const queryClient = useQueryClient()
  const { items, total, itemCount, removeItem, updateQuantity, decrementItem, addItem, clearCart } = useCartStore()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [showCheckoutForm, setShowCheckoutForm] = useState(false)
  const [placeError, setPlaceError] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<{ order_number: string; id: number; payment_status?: string } | null>(null)
  const [dispatch, setDispatch] = useState<Dispatch | null>(null)
  const [coords, setCoords] = useState<DeliveryCoords | null>(null)
  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>('delivery')
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>('new')
  const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('')
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressLabel, setAddressLabel] = useState('Home')
  const shouldReduce = useReducedMotion()

  const placeOrderMutation = usePlaceOrder()

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: api.getAddresses,
    enabled: showCheckoutForm && isAuthenticated,
  })
  const { data: storesData } = useQuery({
    queryKey: ['stores'],
    queryFn: api.getStores,
    enabled: showCheckoutForm && fulfilment === 'pickup',
  })
  const savedAddresses: UserAddress[] = useMemo(() => addressesData?.data ?? [], [addressesData])
  const stores: StoreType[] = useMemo(() => (storesData?.data ?? []).filter(s => s.is_active), [storesData])

  useEffect(() => {
    if (savedAddresses.length === 0) return
    if (selectedAddressId !== 'new') return
    const preferred = savedAddresses.find(a => a.is_default) ?? savedAddresses[0]
    setSelectedAddressId(preferred.id)
  }, [savedAddresses, selectedAddressId])

  useEffect(() => {
    if (selectedStoreId === '' && stores.length > 0) {
      setSelectedStoreId(stores[0].id)
    }
  }, [stores, selectedStoreId])

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    setShowCheckoutForm(true)
    getDeliveryCoords().then(setCoords)
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlaceError('')

    let payload: Parameters<typeof api.placeOrder>[0] = {
      items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
      fulfilment_method: fulfilment,
      payment_method: 'cash_on_delivery',
    }

    if (fulfilment === 'pickup') {
      if (!selectedStoreId) {
        setPlaceError('Please choose a store to collect from.')
        return
      }
      payload.store_id = selectedStoreId
    } else {
      const saved = selectedAddressId === 'new' ? null : savedAddresses.find(a => a.id === selectedAddressId)
      if (saved) {
        payload.delivery_address = saved.address
        payload.delivery_latitude = saved.latitude
        payload.delivery_longitude = saved.longitude
      } else {
        if (!deliveryAddress.trim()) {
          setPlaceError('Please enter a delivery address.')
          return
        }
        const resolved = coords ?? (await getDeliveryCoords())
        payload.delivery_address = deliveryAddress.trim()
        payload.delivery_latitude = resolved.latitude
        payload.delivery_longitude = resolved.longitude
      }
    }

    try {
      const result = await placeOrderMutation.mutateAsync(payload)
      clearCart()
      if (fulfilment === 'delivery' && selectedAddressId === 'new' && saveAddress && payload.delivery_address && payload.delivery_latitude != null) {
        try {
          await api.createAddress({
            label: addressLabel.trim() || 'Home',
            address: payload.delivery_address,
            latitude: payload.delivery_latitude,
            longitude: payload.delivery_longitude!,
            is_default: savedAddresses.length === 0,
          })
          queryClient.invalidateQueries({ queryKey: ['addresses'] })
        } catch {}
      }
      setPlacedOrder({ order_number: result.data.order_number, id: result.data.id, payment_status: result.data.payment_status })
      setDispatch(result.dispatch)
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 401) {
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
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: ease.apple }}
        >
          <motion.div
            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: ease.apple, delay: 0.06 }}
            className="flex items-center justify-between mb-8"
          >
            <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight">Your Cart</h1>
            {items.length > 0 && (
              <span className="text-sm text-gray-500 tabular-nums">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            )}
          </motion.div>

          {items.length === 0 ? (
            <motion.div
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ type: 'spring', ...spring.apple, delay: 0.1 }}
              className="text-center py-20 bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            >
              <motion.div
                initial={shouldReduce ? undefined : { scale: 0.8, rotate: -4 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', ...spring.appleBounce, delay: 0.15 }}
              >
                <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
              </motion.div>
              <h2 className="text-[15px] font-semibold text-gray-900 tracking-tight mb-2">Your cart is empty</h2>
              <p className="text-[13px] text-gray-500 mb-6 leading-relaxed max-w-[28ch] mx-auto">Add some groceries to get started — fresh picks every day.</p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', ...spring.press }}>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-full text-[13px] font-semibold hover:bg-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-colors"
                >
                  Browse Products <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
                  }}
                  className="space-y-1 bg-white rounded-[16px] border border-gray-100/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-2 sm:p-3"
                >
                  <AnimatePresence initial={false}>
                    {items.map((item, idx) => {
                      const price = Number(item.product.effective_price ?? item.product.sale_price ?? item.product.price)
                      return (
                        <motion.div
                          key={item.product.id}
                          layout
                          variants={{
                            hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' },
                            visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.35, ease: ease.apple } },
                          }}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, filter: 'blur(4px)', transition: { duration: 0.25, ease: ease.apple } }}
                          transition={{ delay: idx * 0.03 }}
                          className="flex items-start gap-3 py-4 px-2 sm:px-3 rounded-[12px] hover:bg-gray-50/80 transition-colors border border-transparent hover:border-gray-100 sm:items-center sm:gap-4"
                        >
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-[12px] flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100/50">
                            {item.product.image ? (
                              <SafeImage src={item.product.image} alt={item.product.name} fill sizes="64px" className="object-cover" />
                            ) : (
                              <ShoppingBag size={20} className="text-gray-300" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[13px] font-semibold tracking-tight line-clamp-2 sm:truncate text-gray-900">{item.product.name}</p>
                            {item.product.unit && <p className="text-[11px] text-gray-500 mt-0.5 tracking-wide">{item.product.unit}</p>}
                            <p className="text-[13px] font-bold text-primary mt-1 sm:mt-0.5 tabular-nums">
                              {formatZar(price)}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <p className="order-1 text-right text-sm sm:w-20 text-[14px] font-bold tabular-nums tracking-tight sm:order-2">
                              <span className="tabular-nums">
                                {'R '}<AnimatedNumber value={price * item.quantity} precision={2} format={formatAmount} />
                              </span>
                            </p>

                            <div className="order-2 flex items-center gap-1.5 sm:order-1 bg-white rounded-full border border-gray-200 p-0.5 shadow-sm">
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: 'spring', ...spring.press }}
                                onClick={() => decrementItem(item.product.id)}
                                aria-label={`Decrease quantity of ${item.product.name}`}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                <Minus size={12} strokeWidth={2} />
                              </motion.button>
                              <span className="w-7 text-center text-[13px] font-semibold tabular-nums">
                                <AnimatedNumber value={item.quantity} precision={0} stiffness={260} damping={26} />
                              </span>
                              <motion.button
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: 'spring', ...spring.press }}
                                onClick={() => addItem(item.product, 1)}
                                aria-label={`Increase quantity of ${item.product.name}`}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-900 text-white hover:bg-black transition-colors shadow-sm"
                              >
                                <Plus size={12} strokeWidth={2} />
                              </motion.button>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              transition={{ type: 'spring', ...spring.snap }}
                              onClick={() => removeItem(item.product.id)}
                              aria-label={`Remove ${item.product.name} from cart`}
                              className="order-3 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={15} strokeWidth={1.75} />
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              </div>

              <div className="lg:col-span-1">
                <motion.div
                  initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  transition={{ type: 'spring', ...spring.apple, delay: 0.18 }}
                  className="bg-white rounded-[16px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 sm:p-6 sticky top-24"
                >
                  <h2 className="font-display text-[15px] font-semibold tracking-tight mb-4">Order Summary</h2>

                  <div className="space-y-2.5 text-[13px]">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span>
                      <span className="tabular-nums font-medium text-gray-900">
                        {'R '}<AnimatedNumber value={subtotal} precision={2} format={formatAmount} />
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                      <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : 'font-medium'}>
                        {deliveryFee === 0 ? 'Free' : formatZar(deliveryFee)}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-bold text-[15px] tracking-tight">
                      <span>Total</span>
                      <span className="tabular-nums">
                        {'R '}<AnimatedNumber value={subtotal + deliveryFee} precision={2} format={formatAmount} />
                      </span>
                    </div>
                  </div>

                  {!showCheckoutForm ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', ...spring.press }}
                      onClick={handleProceedToCheckout}
                      className="w-full mt-5 bg-gray-900 text-white py-3 rounded-full text-[13px] font-semibold hover:bg-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-colors flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout <ArrowRight size={15} strokeWidth={2} />
                    </motion.button>
                  ) : (
                    <motion.form
                      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.35, ease: ease.apple }}
                      onSubmit={handlePlaceOrder}
                      className="mt-5 space-y-3"
                    >
                      {placeError && (
                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-500 font-medium bg-red-50 border border-red-100 rounded-[10px] px-3 py-2">{placeError}</motion.p>
                      )}

                      <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-full" role="group" aria-label="Fulfilment method">
                        {(['delivery', 'pickup'] as const).map(method => (
                          <motion.button
                            key={method}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            aria-pressed={fulfilment === method}
                            onClick={() => setFulfilment(method)}
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-full text-[12px] font-semibold tracking-wide transition-all ${
                              fulfilment === method ? 'bg-white text-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {method === 'delivery' ? <MapPin size={13} strokeWidth={2} /> : <StoreIcon size={13} strokeWidth={2} />}
                            {method === 'delivery' ? 'Deliver' : 'Pickup'}
                          </motion.button>
                        ))}
                      </div>

                      {coords?.usedFallback && fulfilment === 'delivery' && selectedAddressId === 'new' && <LocationFallbackNotice />}

                      {fulfilment === 'delivery' ? (
                        savedAddresses.length > 0 || addressesLoading ? (
                          <div>
                            <label htmlFor="saved-address" className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5 uppercase">
                              Deliver to
                            </label>
                            {addressesLoading ? (
                              <div className="h-10 rounded-[12px] bg-gray-100 animate-pulse" aria-hidden="true" />
                            ) : (
                              <select
                                id="saved-address"
                                value={String(selectedAddressId)}
                                onChange={e => setSelectedAddressId(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[12px] text-[13px] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
                              >
                                {savedAddresses.map(a => (
                                  <option key={a.id} value={a.id}>
                                    {a.label} — {a.address}
                                  </option>
                                ))}
                                <option value="new">Enter a new address…</option>
                              </select>
                            )}
                          </div>
                        ) : null
                      ) : (
                        <div>
                          <label htmlFor="pickup-store" className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5 uppercase">
                            Collect from
                          </label>
                          <select
                            id="pickup-store"
                            value={selectedStoreId === '' ? '' : String(selectedStoreId)}
                            onChange={e => setSelectedStoreId(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-[12px] text-[13px] bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          >
                            {stores.length === 0 && <option value="">Loading stores…</option>}
                            {stores.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name} — {s.address}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">We&apos;ll pack your order ready for you to collect. No delivery fee.</p>
                        </div>
                      )}

                      {fulfilment === 'delivery' && selectedAddressId === 'new' && (
                        <>
                          <div>
                            <label htmlFor="delivery-address" className="block text-[11px] font-semibold tracking-wide text-gray-600 mb-1.5 uppercase">
                              Delivery Address
                            </label>
                            <div className="relative">
                              <MapPin size={14} className="absolute left-3.5 top-3.5 text-gray-400" strokeWidth={1.75} />
                              <textarea
                                id="delivery-address"
                                rows={2}
                                value={deliveryAddress}
                                onChange={e => setDeliveryAddress(e.target.value)}
                                className="w-full pl-10 pr-3.5 py-2.5 border border-gray-200 rounded-[12px] text-[13px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none leading-relaxed"
                                placeholder="Enter your delivery address"
                              />
                            </div>
                          </div>

                          {coords && (
                            <div className="text-[11px] text-gray-500 space-y-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={saveAddress}
                                  onChange={e => setSaveAddress(e.target.checked)}
                                  className="h-3.5 w-3.5 accent-primary rounded"
                                />
                                Save this address for next time
                              </label>
                              {saveAddress && (
                                <input
                                  type="text"
                                  value={addressLabel}
                                  onChange={e => setAddressLabel(e.target.value)}
                                  maxLength={50}
                                  aria-label="Address label"
                                  placeholder="Label (e.g. Home, Work)"
                                  className="w-full px-3.5 py-2 border border-gray-200 rounded-[12px] text-[12px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}

                      <div className="flex gap-2 pt-1">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowCheckoutForm(false)}
                          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={placeOrderMutation.isPending}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ type: 'spring', ...spring.press }}
                          className="flex-1 bg-gray-900 text-white py-2.5 rounded-full text-[13px] font-semibold hover:bg-black shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {placeOrderMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                          {placeOrderMutation.isPending ? 'Placing...' : 'Place Order'}
                        </motion.button>
                      </div>
                    </motion.form>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <AuthRequiredModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} redirectTo="/cart" />
    </>
  )
}
