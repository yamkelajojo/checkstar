'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronRight, Loader2, ShoppingBag, Package } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useOrders } from '@/lib/query'
import EmptyState from '@/components/EmptyState'
import ErrorNotice from '@/components/ErrorNotice'
import Select from '@/components/ui/select'
import { statusConfig } from '@/lib/motion/variants'
import { formatZar } from '@/lib/money'
import { formatDate } from '@/lib/dates'

export default function OrdersClient() {
  // Auth bootstrap + redirect live in the (account) layout AuthGuard.
  const { isLoading: authLoading } = useAuthStore()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const queryParams: Record<string, string> = {}
  if (statusFilter) queryParams.status = statusFilter
  if (sortOrder === 'oldest') queryParams.sort = 'oldest'
  const { data: orders = [], isLoading: loading, error, refetch, isFetching } = useOrders(Object.keys(queryParams).length ? queryParams : undefined)

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
            <Select
              ariaLabel="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'retrying', label: 'Finding Rider' },
                { value: 'preparing', label: 'Preparing' },
                { value: 'ready', label: 'Ready for Pickup' },
                { value: 'out_for_delivery', label: 'Out for Delivery' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
              placeholder="All statuses"
              className="w-48"
            />
            <Select
              ariaLabel="Sort orders"
              value={sortOrder}
              onChange={v => setSortOrder(v as 'newest' | 'oldest')}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'oldest', label: 'Oldest first' },
              ]}
              className="w-40"
            />
          </div>

          {error && (
            <div className="mb-6">
              <ErrorNotice
                title="We couldn't load your orders"
                error={error}
                onRetry={() => refetch()}
                retrying={isFetching}
              />
            </div>
          )}

          {orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState
                icon={Package}
                title="No orders yet"
                caption="Place your first order and it will show up here."
                action={
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                  >
                    Start shopping
                  </Link>
                }
              />
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
                            <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
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
