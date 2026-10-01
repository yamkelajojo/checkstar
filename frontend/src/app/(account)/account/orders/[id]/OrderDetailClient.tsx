'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ErrorNotice from '@/components/ErrorNotice'
import { motion } from 'motion/react'
import { ArrowLeft, Loader2, MapPin, CreditCard, Star, AlertCircle, XCircle, CheckCircle, User, Package, Bike, Clock, Navigation } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { api, apiErrorReason } from '@/lib/api'
import { useOrder } from '@/lib/query'
import { useQueryClient } from '@tanstack/react-query'
import type { Order, OrderActivityLog } from '@/types'
import { statusConfig, paymentStatusConfig } from '@/lib/motion/variants'
import OrderTrackingMap from '@/components/OrderTrackingMap'
import { formatZar } from '@/lib/money'
import { formatDateTime } from '@/lib/dates'
import { humanize } from '@/lib/labels'

function cancelReasonLabel(reason: string | null): string {
  if (reason === 'order_not_cancellable') return "Can't cancel — order already out for delivery"
  if (reason === 'order_not_claimable' || reason === 'rider_not_eligible') return 'Dispatch failed — check rider eligibility'
  if (reason) return humanize(reason)
  return "This order can't be cancelled right now."
}

function OrderTimeline({ logs }: { logs?: OrderActivityLog[] }) {
  if (!logs || logs.length === 0) return null
  return (
    <div className="space-y-0">
      {logs.map((log, i) => {
        const isLast = i === logs.length - 1
        return (
          <div key={log.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${isLast ? 'bg-primary' : 'bg-gray-300'}`} />
              {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>
            <div className={`pb-4 ${isLast ? '' : ''}`}>
              <p className="text-sm text-gray-700">
                {humanize(log.event_type || log.new_status || (log as any).status || 'order_updated')}
              </p>
              <p className="text-xs text-gray-400">{formatDateTime(log.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)} className="p-0.5">
          <Star size={20} className={star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
        </button>
      ))}
    </div>
  )
}

export default function OrderDetailClient({ id }: { id: string }) {
  // Auth bootstrap + redirect live in the (account) layout AuthGuard.
  const { isLoading: authLoading } = useAuthStore()
  const { data: order, isLoading: loading, error } = useOrder(id)
  const queryClient = useQueryClient()
  const [mutationError, setMutationError] = useState('')
  const [cancelReason, setCancelReason] = useState<string | null>(null)
  const displayError = error?.message || mutationError
  const [cancelling, setCancelling] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    if ((order as any)?.review || (order as any)?.rider_rating != null) {
      setReviewSubmitted(true)
    }
  }, [order])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return
    setCancelling(true)
    setMutationError('')
    setCancelReason(null)
    try {
      await api.cancelOrder(Number(id))
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    } catch (err: any) {
      setMutationError(err.message)
      setCancelReason(apiErrorReason(err))
    } finally {
      setCancelling(false)
    }
  }

  const handleConfirmDelivery = async () => {
    setConfirming(true)
    setMutationError('')
    try {
      await api.confirmDelivery(Number(id))
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    } catch (err: any) {
      setMutationError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return
    setSubmittingReview(true)
    setMutationError('')
    try {
      await api.reviewRider(Number(id), { rating, comment: reviewComment || undefined })
      setReviewSubmitted(true)
      queryClient.invalidateQueries({ queryKey: ['order', id] })
    } catch (err: any) {
      setMutationError(err.message)
    } finally {
      setSubmittingReview(false)
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-primary" />
        </main>
      </>
    )
  }

  if (error && !order) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-16">
          <ErrorNotice title="We couldn't load this order" error={error} />
          <Link href="/account/orders" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft size={14} /> Back to orders
          </Link>
        </main>
      </>
    )
  }

  if (!order) return null

  const statusCfg = statusConfig[order.status] || statusConfig.pending
  const paymentCfg = paymentStatusConfig[order.payment_status] || paymentStatusConfig.pending
  const StatusIcon = statusCfg.icon
  // Server-driven cancellation gate (#05): prefer API can_cancel, no hardcoded array.
  const isCancellable = order.can_cancel ?? false
  const isPickup = (order.fulfilment_method ?? 'delivery') === 'pickup'
  const isOutForDelivery = order.status === 'out_for_delivery'
  const isDelivered = order.status === 'delivered'
  const alreadyReviewed = !!(order as any).review || (order as any).rider_rating != null
  // Pickup orders have no rider, so there is nobody to rate.
  const canReview = isDelivered && !!order.rider && !reviewSubmitted && !alreadyReviewed

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to orders
          </Link>

          {displayError && (
            <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3 mb-6">{displayError}</div>
          )}
          {cancelReason && (
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 mb-4 text-xs font-medium text-accent">
              <AlertCircle size={14} /> {cancelReasonLabel(cancelReason)}
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="font-display text-2xl font-bold">Order #{order.order_number}</h1>
                <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.color} flex items-center gap-1.5`}>
                  <StatusIcon size={14} /> {statusCfg.label}
                </span>
                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${paymentCfg.bg} ${paymentCfg.color} flex items-center gap-1.5`}>
                  <CreditCard size={14} /> {paymentCfg.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Subtotal</span>
                <p className="font-medium">{formatZar(order.subtotal)}</p>
              </div>
              <div>
                <span className="text-gray-400">{isPickup ? 'Pickup' : 'Delivery Fee'}</span>
                <p className="font-medium">{Number(order.delivery_fee) === 0 ? 'Free' : formatZar(order.delivery_fee)}</p>
              </div>
              <div>
                <span className="text-gray-400">Total</span>
                <p className="font-semibold text-lg">{formatZar(order.total)}</p>
              </div>
              <div>
                <span className="text-gray-400">{isPickup ? 'Collect From' : 'Delivery Address'}</span>
                {isPickup ? (
                  <p className="font-medium flex items-start gap-1.5">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    {order.store ? `${order.store.name} — ${order.store.address}` : 'Store pickup'}
                  </p>
                ) : (
                  <p className="font-medium flex items-start gap-1.5">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    {order.delivery_address || 'No address specified'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              {isCancellable && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 border border-accent/30 text-accent rounded-lg text-sm font-medium hover:bg-accent/5 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {cancelling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Cancel Order
                </button>
              )}
              {isOutForDelivery && (
                <button
                  onClick={handleConfirmDelivery}
                  disabled={confirming}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {confirming ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Confirm Delivery
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {order.store && (
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Store</h2>
                <p className="font-medium">{order.store.name}</p>
                <p className="text-sm text-gray-500">{order.store.address}</p>
              </div>
            )}

            {order.rider && (
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Rider</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center">
                    <User size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{order.rider.user?.name || `Rider #${order.rider.id}`}</p>
                    <p className="text-xs text-gray-400">{order.rider.vehicle_type || 'Motorbike'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live tracking — mandatory for delivery orders, real-time rider location */}
          {!isPickup && ['confirmed', 'preparing', 'out_for_delivery', 'retrying'].includes(order.status) && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wider">Live Tracking</h2>
                <Link href={`/account/orders/${order.id}/tracking`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  <Navigation size={12} /> Full tracking
                </Link>
              </div>
              <OrderTrackingMap
                orderId={order.id}
                orderStatus={order.status}
                storeName={order.store?.name || 'Store'}
                storeLat={order.store?.latitude != null ? Number(order.store.latitude) : undefined}
                storeLng={order.store?.longitude != null ? Number(order.store.longitude) : undefined}
                deliveryLat={order.delivery_latitude != null ? Number(order.delivery_latitude) : undefined}
                deliveryLng={order.delivery_longitude != null ? Number(order.delivery_longitude) : undefined}
                deliveryAddress={order.delivery_address}
                riderName={order.rider?.user?.name || null}
                height={380}
              />
            </div>
          )}

          {order.activity_logs && order.activity_logs.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 mt-6">
              <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Timeline</h2>
              <OrderTimeline logs={order.activity_logs} />
            </div>
          )}

          {order.items && order.items.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 mt-6">
              <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Items</h2>
              <div className="space-y-3">
                {order.items!.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 w-6 text-right">{item.quantity}x</span>
                      <span>{item.product_snapshot?.name || `Product #${item.product_id}`}</span>
                    </div>
                    <span className="font-medium">{formatZar(item.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canReview && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 mt-6">
              <h2 className="font-display text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Rate Your Rider</h2>
              <form onSubmit={handleSubmitReview} className="space-y-3">
                <StarRating value={rating} onChange={setRating} />
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                  placeholder="Leave a comment (optional)"
                />
                <button
                  type="submit"
                  disabled={rating === 0 || submittingReview}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submittingReview ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />}
                  Submit Review
                </button>
              </form>
            </div>
          )}

          {reviewSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 mt-6 text-center">
              <CheckCircle size={24} className="mx-auto text-green-600 mb-2" />
              <p className="text-sm font-medium text-green-700">Review submitted! Thanks for your feedback.</p>
            </div>
          )}
        </motion.div>
      </main>
    </>
  )
}
