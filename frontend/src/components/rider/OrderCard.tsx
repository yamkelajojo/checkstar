'use client'

import { motion } from 'motion/react'
import { fadeUpTight as fadeUp } from '@/lib/motion/variants'
import OrderTimeline from '@/components/OrderTimeline'
import { MapPin, Store } from 'lucide-react'
import type { Order } from '@/types'
import { formatZar } from '@/lib/money'

// Money renders through the house formatter (lib/money) like every other surface.

interface OrderCardProps {
  order: Order
  badge?: { label: string; variant?: 'available' | 'status' }
  action?: React.ReactNode
  children?: React.ReactNode
}

export default function OrderCard({ order, badge, action, children }: OrderCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">{order.order_number}</span>
            {badge && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                badge.variant === 'available' ? 'bg-primary/10 text-primary' :
                order.status === 'delivered' ? 'bg-success/10 text-success' :
                order.status === 'cancelled' ? 'bg-accent/10 text-accent' :
                order.status === 'pending' ? 'bg-warning/10 text-amber-700' :
                'bg-primary/10 text-primary'
              }`}>
                {badge.label}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <span className="text-lg font-bold text-primary">{formatZar(order.total)}</span>
      </div>

      {order.items && order.items.length > 0 && (
        <div className="mb-3 space-y-1">
          {order.items.slice(0, 5).map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.product_snapshot?.name || `Product #${item.product_id}`} x{item.quantity}
              </span>
              <span className="text-gray-500">{formatZar(item.total_price)}</span>
            </div>
          ))}
          {order.items.length > 5 && (
            <p className="text-xs text-gray-400">+{order.items.length - 5} more items</p>
          )}
        </div>
      )}

      {order.delivery_address && (
        <div className="flex items-start gap-2 text-sm text-gray-500 mb-3">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span>{order.delivery_address}</span>
        </div>
      )}

      {order.store && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Store size={14} />
          <span>{order.store.name}</span>
        </div>
      )}

      {order.activity_logs && order.activity_logs.length > 0 && (
        <div className="mb-3">
          <OrderTimeline currentStatus={order.status} logs={order.activity_logs as any} />
        </div>
      )}

      {(action || children) && (
        <div className="flex justify-end">
          {action || children}
        </div>
      )}
    </motion.div>
  )
}
