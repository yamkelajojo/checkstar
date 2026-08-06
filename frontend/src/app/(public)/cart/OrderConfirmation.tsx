import Link from 'next/link'
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react'

interface OrderConfirmationProps {
  order: { order_number: string; id: number }
  dispatchStatus?: string | null
}

export default function OrderConfirmation({ order, dispatchStatus }: OrderConfirmationProps) {
  const notDispatched = dispatchStatus === 'cancelled' || dispatchStatus === 'no_rider_available'

  if (notDispatched) {
    return (
      <main className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-red-600" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-2">Order Not Dispatched</h1>
        <p className="text-gray-500 mb-1">Order #{order.order_number}</p>
        <p className="text-sm text-gray-500 mb-8">
          We couldn&apos;t find an available rider right now. Your order was cancelled and you haven&apos;t been
          charged.
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

  return (
    <main className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h1 className="font-display text-2xl font-bold mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-1">Your order number is</p>
      <p className="font-mono text-2xl font-bold text-primary mb-6">#{order.order_number}</p>
      <p className="text-sm text-gray-500 mb-8">
        We&apos;ll start preparing your order shortly. You can track it in real-time.
      </p>
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
