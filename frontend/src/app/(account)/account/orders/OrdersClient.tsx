'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronRight, Loader2, ShoppingBag, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useOrders } from '@/lib/query'
import { statusConfig } from '@/lib/motion/variants'
import { formatZar } from '@/lib/money'

export default function OrdersClient() {
  // Auth bootstrap + redirect live in the (account) layout AuthGuard.
  const { isLoading: authLoading } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const queryParams: Record<string, string> = {}
  if (statusFilter) queryParams.status = statusFilter
  if (sortOrder === 'oldest') queryParams.sort = 'oldest'
  const { data: orders = [], isLoading: loading, error } = useOrders(Object.keys(queryParams).length ? queryParams : undefined)

  if (authLoading || loading) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-primary" />
        </main>
      </>
    )
  }

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2">My Orders</h1>
          <div className="flex flex-wrap gap-3 mb-6">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary outline-none">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="retrying">Finding Rider</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready for Pickup</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={sortOrder} onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary outline-none">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          {error && (
            <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3 mb-6">{error.message}</div>
          )}

          {orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <Package size={48} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-lg font-semibold text-gray-600 mb-2">No orders yet</h2>
              <p className="text-sm text-gray-400 mb-6">Place your first order to see it here.</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => {
                const cfg = statusConfig[order.status] || statusConfig.pending
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="block bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center`}>
                            <Icon size={18} className={cfg.color} />
                          </div>
                          <div>
                            <p className="font-mono text-sm font-semibold">#{order.order_number}</p>
                            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-sm font-semibold">{formatZar(order.total)}</span>
                          <ChevronRight size={16} className="text-gray-300" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </main>
    </>
  )
}
