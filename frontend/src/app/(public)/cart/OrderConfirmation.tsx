import Link from 'next/link'
import { CheckCircle, XCircle, Clock, ArrowRight, RotateCcw } from 'lucide-react'
import type { Dispatch } from '@/types'

interface OrderConfirmationProps {
  order: { order_number: string; id: number; payment_status?: string }
  dispatch?: Dispatch | null
}

export default function OrderConfirmation({ order, dispatch }: OrderConfirmationProps) {
  if (dispatch?.status === 'retrying') {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RotateCcw size={32} className="text-yellow-600 animate-spin" />
        </div>
        <h1 className="font-display text-lg sm:text-2xl font-bold mb-2">Finding a Rider</h1>
        <p className="text-gray-500 mb-1">Order #{order.order_number}</p>
        <p className="text-sm text-gray-500 mb-8">
          We&apos;re looking for an available rider at nearby stores. You&apos;ll be notified as soon as one is assigned.
        </p>
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Track Order <ArrowRight size={16} />
        </Link>
      </main>
    )
  }

  if (dispatch?.status === 'cancelled') {
    const paid = order.payment_status === 'paid'
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-600" />
        </div>
        <h1 className="font-display text-lg sm:text-2xl font-bold mb-2">Order Cancelled</h1>
        <p className="text-gray-500 mb-1">Order #{order.order_number}</p>
        <p className="text-sm text-gray-500 mb-8">
          {paid
            ? 'Your order was cancelled — a refund will be issued if you were charged.'
            : "Your order was cancelled before dispatch and you haven't been charged."}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </main>
    )
  }

  if (dispatch?.status === 'assigned') {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h1 className="font-display text-lg sm:text-2xl font-bold mb-2">Order Placed!</h1>
        <p className="text-gray-500 mb-1">Your order number is</p>
        <p className="font-mono text-2xl font-bold text-primary mb-6">#{order.order_number}</p>
        {dispatch.rider_name && dispatch.store_name && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm space-y-1.5">
            <p>
              <span className="font-medium text-gray-700">Store: </span>
              {dispatch.store_name}
            </p>
            <p>
              <span className="font-medium text-gray-700">Rider: </span>
              {dispatch.rider_name}
            </p>
          </div>
        )}
        <p className="text-sm text-gray-500 mb-8">We&apos;ll start preparing your order shortly. You can track it in real-time.</p>
        <div className="flex flex-col gap-3">
          <Link
            href={`/account/orders/${order.id}`}
            className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors inline-flex items-center justify-center gap-2"
          >
            Track Order <ArrowRight size={16} />
          </Link>
          <Link
            href="/products"
            className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock size={32} className="text-gray-600" />
      </div>
      <h1 className="font-display text-lg sm:text-2xl font-bold mb-2">Confirming your order</h1>
      <p className="text-gray-500 mb-1">Order #{order.order_number}</p>
      <p className="text-sm text-gray-500 mb-8">
        Your order has been received. You can check its status in your account.
      </p>
      <Link
        href={`/account/orders/${order.id}`}
        className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
      >
        Track Order <ArrowRight size={16} />
      </Link>
    </main>
  )
}
