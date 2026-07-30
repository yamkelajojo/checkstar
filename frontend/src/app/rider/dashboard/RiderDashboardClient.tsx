'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import OrderTimeline from '@/components/OrderTimeline'
import StarRating from '@/components/StarRating'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Order, Rider } from '@/types'
import {
  Clock, Truck, TrendingUp, History, MapPin, Store,
  AlertCircle, ChevronRight, Loader2,
  Award, Zap, ShoppingBag, Navigation,
  Star, Shield, RefreshCw, CircleCheck, CircleX,
  Bike, Package, Phone,
} from 'lucide-react'

function formatCurrency(amount: number): string {
  return `R${Number(amount).toFixed(2)}`
}

function xpProgress(xp: number, level: number): number {
  const base = (level - 1) * 1000
  const inLevel = xp - base
  return Math.min((inLevel / 1000) * 100, 100)
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const tabs = [
  { id: 'available' as const, label: 'Available Orders', icon: Clock },
  { id: 'active' as const, label: 'Active Deliveries', icon: Truck },
  { id: 'stats' as const, label: 'Stats', icon: TrendingUp },
  { id: 'history' as const, label: 'History', icon: History },
]

type TabId = (typeof tabs)[number]['id']

interface RiderStats {
  xp: number
  level: number
  total_deliveries: number
  average_rating: number
  badges: any[]
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <motion.div variants={fadeUp} className="text-center py-16">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon size={32} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div variants={fadeUp} className="text-center py-12">
      <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={28} className="text-accent" />
      </div>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        <RefreshCw size={16} /> Retry
      </button>
    </motion.div>
  )
}

export default function RiderDashboardClient() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabId>('available')
  const [rider, setRider] = useState<Rider | null>(null)
  const [storeNames, setStoreNames] = useState<Record<number, string>>({})
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [activeDeliveries, setActiveDeliveries] = useState<Order[]>([])
  const [riderStats, setRiderStats] = useState<RiderStats | null>(null)
  const [history, setHistory] = useState<Order[]>([])
  const [loading, setLoading] = useState({
    rider: true, stores: true, available: false,
    active: false, stats: false, history: false, toggle: false,
  })
  const [error, setError] = useState<Record<string, string | null>>({
    rider: null, available: null, active: null, stats: null, history: null,
  })

  useEffect(() => {
    fetchRiderProfile()
    fetchStores()
    fetchAvailableOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === 'active') fetchActiveDeliveries()
    if (activeTab === 'stats') fetchRiderStats()
    if (activeTab === 'history') fetchRiderHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fetchRiderProfile = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, rider: true }))
      const res = await api.getRiderProfile()
      setRider(res)
    } catch (err: any) {
      setError(e => ({ ...e, rider: err.message }))
    } finally {
      setLoading(l => ({ ...l, rider: false }))
    }
  }, [])

  const fetchStores = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, stores: true }))
      const res = await api.getStores()
      const map: Record<number, string> = {}
      res.data.forEach(s => { map[s.id] = s.name })
      setStoreNames(map)
    } catch {
    } finally {
      setLoading(l => ({ ...l, stores: false }))
    }
  }, [])

  const fetchAvailableOrders = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, available: true }))
      setError(e => ({ ...e, available: null }))
      const res = await api.getAvailableOrders()
      setAvailableOrders(res.data)
    } catch (err: any) {
      setError(e => ({ ...e, available: err.message }))
    } finally {
      setLoading(l => ({ ...l, available: false }))
    }
  }, [])

  const fetchActiveDeliveries = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, active: true }))
      setError(e => ({ ...e, active: null }))
      const res = await api.getActiveDeliveries()
      setActiveDeliveries(res.data)
    } catch (err: any) {
      setError(e => ({ ...e, active: err.message }))
    } finally {
      setLoading(l => ({ ...l, active: false }))
    }
  }, [])

  const fetchRiderStats = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, stats: true }))
      setError(e => ({ ...e, stats: null }))
      const res = await api.getRiderStats()
      setRiderStats(res.data)
    } catch (err: any) {
      setError(e => ({ ...e, stats: err.message }))
    } finally {
      setLoading(l => ({ ...l, stats: false }))
    }
  }, [])

  const fetchRiderHistory = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, history: true }))
      setError(e => ({ ...e, history: null }))
      const res = await api.getRiderHistory()
      setHistory(res.data)
    } catch (err: any) {
      setError(e => ({ ...e, history: err.message }))
    } finally {
      setLoading(l => ({ ...l, history: false }))
    }
  }, [])

  const handleToggleAvailability = useCallback(async () => {
    try {
      setLoading(l => ({ ...l, toggle: true }))
      const updated = await api.toggleAvailability()
      setRider(updated)
    } catch {
    } finally {
      setLoading(l => ({ ...l, toggle: false }))
    }
  }, [])

  const handleClaimOrder = useCallback(async (orderId: number) => {
    try {
      await api.claimOrder(orderId)
      setAvailableOrders(o => o.filter(o => o.id !== orderId))
      fetchActiveDeliveries()
    } catch {
    }
  }, [fetchActiveDeliveries])

  const advanceOrder = useCallback(async (orderId: number, action: string) => {
    try {
      if (action === 'items_bought') await api.markItemsBought(orderId)
      else if (action === 'out_for_delivery') await api.markOutForDelivery(orderId)
      else if (action === 'delivered') await api.markDelivered(orderId)
      fetchActiveDeliveries()
      if (action === 'delivered') {
        fetchRiderStats()
        fetchRiderHistory()
      }
    } catch {
    }
  }, [fetchActiveDeliveries, fetchRiderStats, fetchRiderHistory])

  const storeName = rider?.store_id ? storeNames[rider.store_id] : null

  function renderNextAction(order: Order) {
    if (order.status === 'cancelled' || order.status === 'delivered') return null
    const actions: Record<string, { label: string; action: string }> = {
      confirmed: { label: 'Items Bought', action: 'items_bought' },
      preparing: { label: 'Out for Delivery', action: 'out_for_delivery' },
      out_for_delivery: { label: 'Delivered', action: 'delivered' },
    }
    const act = actions[order.status]
    if (!act) return null
    return (
      <button
        onClick={() => advanceOrder(order.id, act.action)}
        className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        <CircleCheck size={16} />
        {act.label}
      </button>
    )
  }

  function renderOrderCard(order: Order, showAction = false) {
    return (
      <motion.div
        key={order.id}
        variants={fadeUp}
        className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{order.order_number}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                order.status === 'delivered' ? 'bg-success/10 text-success' :
                order.status === 'cancelled' ? 'bg-accent/10 text-accent' :
                order.status === 'pending' ? 'bg-warning/10 text-amber-700' :
                'bg-primary/10 text-primary'
              }`}>
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <span className="text-lg font-bold text-primary">{formatCurrency(order.total)}</span>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mb-3 space-y-1">
            {order.items.slice(0, 4).map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product_snapshot?.name || `Product #${item.product_id}`} x{item.quantity}
                </span>
                <span className="text-gray-500">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
            {order.items.length > 4 && (
              <p className="text-xs text-gray-400">+{order.items.length - 4} more items</p>
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

        {showAction && (
          <div className="flex justify-end">
            {renderNextAction(order)}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          {/* Top bar */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-gray-900">Rider Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">
                Welcome back, {user?.name?.split(' ')[0] || 'Rider'}
                {storeName && (
                  <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 bg-primary-light rounded-full text-primary text-xs font-medium">
                    <Store size={12} /> {storeName}
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={handleToggleAvailability}
              disabled={loading.toggle}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                rider?.is_available
                  ? 'bg-success/10 text-success border border-success/20 hover:bg-success/20'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${rider?.is_available ? 'bg-success animate-pulse' : 'bg-gray-400'}`} />
              {loading.toggle ? 'Updating...' : rider?.is_available ? 'Available' : 'Unavailable'}
              <div className={`w-10 h-6 rounded-full p-0.5 transition-colors ${rider?.is_available ? 'bg-success' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${rider?.is_available ? 'translate-x-4' : ''}`} />
              </div>
            </button>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeUp} className="flex gap-1 border-b border-gray-100 mb-8">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </motion.div>

          {/* Available Orders Tab */}
          {activeTab === 'available' && (
            <motion.div key="available" initial="hidden" animate="show" variants={stagger}>
              {loading.available ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                      <Skeleton className="h-5 w-48 mb-3" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-4 w-64 mb-2" />
                      <Skeleton className="h-10 w-28 mt-4" />
                    </div>
                  ))}
                </div>
              ) : error.available ? (
                <ErrorState message={error.available} onRetry={fetchAvailableOrders} />
              ) : availableOrders.length === 0 ? (
                <EmptyState icon={Clock} title="No available orders" description="Check back soon for new delivery requests." />
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(order => (
                    <motion.div
                      key={order.id}
                      variants={fadeUp}
                      className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{order.order_number}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Available
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                        <span className="text-lg font-bold text-primary">{formatCurrency(order.total)}</span>
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {order.items.slice(0, 5).map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.product_snapshot?.name || `Product #${item.product_id}`} x{item.quantity}
                              </span>
                              <span className="text-gray-500">{formatCurrency(item.total_price)}</span>
                            </div>
                          ))}
                          {order.items.length > 5 && (
                            <p className="text-xs text-gray-400">+{order.items.length - 5} more items</p>
                          )}
                        </div>
                      )}

                      {order.delivery_address && (
                        <div className="flex items-start gap-2 text-sm text-gray-500 mb-4">
                          <MapPin size={14} className="mt-0.5 shrink-0" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => handleClaimOrder(order.id)}
                          className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                        >
                          <Bike size={16} />
                          Claim Order
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Active Deliveries Tab */}
          {activeTab === 'active' && (
            <motion.div key="active" initial="hidden" animate="show" variants={stagger}>
              {loading.active ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                      <Skeleton className="h-5 w-48 mb-3" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-20 w-full mb-3" />
                      <Skeleton className="h-10 w-36" />
                    </div>
                  ))}
                </div>
              ) : error.active ? (
                <ErrorState message={error.active} onRetry={fetchActiveDeliveries} />
              ) : activeDeliveries.length === 0 ? (
                <EmptyState icon={Truck} title="No active deliveries" description="Claim an order to start delivering." />
              ) : (
                <div className="space-y-4">
                  {activeDeliveries.map(order => renderOrderCard(order, true))}
                </div>
              )}
            </motion.div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial="hidden" animate="show" variants={stagger}>
              {loading.stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-6">
                      <Skeleton className="h-4 w-24 mb-3" />
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : error.stats ? (
                <ErrorState message={error.stats} onRetry={fetchRiderStats} />
              ) : !riderStats ? (
                <EmptyState icon={TrendingUp} title="No stats available" description="Complete deliveries to see your stats." />
              ) : (
                <div className="space-y-8">
                  {/* Level & XP */}
                  <motion.div variants={fadeUp} className="bg-gradient-to-br from-primary-light to-white rounded-2xl p-6 border border-primary/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                          <Award size={28} className="text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Level</p>
                          <p className="font-display text-2xl font-bold text-gray-900">{riderStats.level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">XP</p>
                        <p className="font-semibold text-gray-900">{riderStats.xp.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress(riderStats.xp, riderStats.level)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1.5">
                      {riderStats.xp - (riderStats.level - 1) * 1000} / 1000 XP to next level
                    </p>
                  </motion.div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-5 text-center">
                      <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Package size={20} className="text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{riderStats.total_deliveries}</p>
                      <p className="text-sm text-gray-500">Total Deliveries</p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-5 text-center">
                      <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Star size={20} className="text-warning" />
                      </div>
                      <div className="flex justify-center mb-1">
                        <StarRating value={riderStats.average_rating} readonly />
                      </div>
                      <p className="text-sm text-gray-500">Average Rating</p>
                    </motion.div>

                    <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-5 text-center">
                      <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Zap size={20} className="text-success" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{riderStats.xp}</p>
                      <p className="text-sm text-gray-500">Total XP</p>
                    </motion.div>
                  </div>

                  {/* Badges */}
                  {riderStats.badges && riderStats.badges.length > 0 && (
                    <motion.div variants={fadeUp}>
                      <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-primary" />
                        Badges
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {riderStats.badges.map((badge: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 bg-gradient-to-br from-primary-light to-amber-50 border border-primary/10 rounded-xl px-4 py-2.5"
                          >
                            <Award size={18} className="text-primary" />
                            <span className="text-sm font-medium text-gray-700">
                              {badge.name || badge}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div key="history" initial="hidden" animate="show" variants={stagger}>
              {loading.history ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                      <Skeleton className="h-5 w-48 mb-3" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-4 w-64 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : error.history ? (
                <ErrorState message={error.history} onRetry={fetchRiderHistory} />
              ) : history.length === 0 ? (
                <EmptyState icon={History} title="No delivery history" description="Your completed deliveries will appear here." />
              ) : (
                <div className="space-y-4">
                  {history.map(order => renderOrderCard(order))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
