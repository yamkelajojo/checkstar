'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Package, ChevronRight, Loader2, ShoppingBag, Clock, CheckCircle, XCircle, Bike, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useOrders } from '@/lib/query'

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock, label: 'Pending' },
  confirmed: { color: 'text-blue-600', bg: 'bg-blue-100', icon: AlertCircle, label: 'Confirmed' },
  preparing: { color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Package, label: 'Preparing' },
  out_for_delivery: { color: 'text-purple-600', bg: 'bg-purple-100', icon: Bike, label: 'Out for Delivery' },
  delivered: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle, label: 'Cancelled' },
}

export default function OrdersClient() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore()
  const { data: orders = [], isLoading: loading, error } = useOrders()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [authLoading, isAuthenticated, router])

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
          <h1 className="font-display text-3xl font-bold mb-8">My Orders</h1>

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
                          <span className="text-sm font-semibold">R{Number(order.total).toFixed(2)}</span>
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
