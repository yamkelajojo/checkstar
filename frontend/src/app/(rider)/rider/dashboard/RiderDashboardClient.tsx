'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Order } from '@/types'
import { humanize, orderStatusLabel } from '@/lib/labels'
import {
  useRiderProfile, useAvailableOrders, useActiveDeliveries,
  useRiderStats, useRiderHistory, useClaimOrder, useAdvanceOrder, useStores,
} from '@/lib/query'
import {
  Clock, Truck, TrendingUp, History, Store,
  Award, Zap, Navigation,
  Star, Shield,
  Bike, Package,
} from 'lucide-react'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import { Skeleton, EmptyState, ErrorState } from '@/components/rider/RiderDashboardParts'
import OrderCard from '@/components/rider/OrderCard'
import StarRating from '@/components/StarRating'

function xpProgress(xp: number, level: number): number {
  const base = (level - 1) * 1000
  const inLevel = xp - base
  return Math.min((inLevel / 1000) * 100, 100)
}

const tabs = [
  { id: 'available' as const, label: 'Available Orders', icon: Clock },
  { id: 'active' as const, label: 'Active Deliveries', icon: Truck },
  { id: 'stats' as const, label: 'Stats', icon: TrendingUp },
  { id: 'history' as const, label: 'History', icon: History },
]

type TabId = (typeof tabs)[number]['id']

export default function RiderDashboardClient() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('available')
  const [toggleLoading, setToggleLoading] = useState(false)

  const { data: rider, isLoading: riderLoading, error: riderError } = useRiderProfile()
  const { data: stores } = useStores()
  const { data: availableOrders = [], isLoading: availableLoading, error: availableError, refetch: refetchAvailable } = useAvailableOrders()
  const { data: activeDeliveries = [], isLoading: activeLoading, error: activeError, refetch: refetchActive } = useActiveDeliveries()
  const { data: riderStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useRiderStats()
  const { data: history = [], isLoading: historyLoading, error: historyError, refetch: refetchHistory } = useRiderHistory()
  const claimMutation = useClaimOrder()
  const advanceMutation = useAdvanceOrder()

  const storeNames: Record<number, string> = {}
  stores?.forEach((s: { id: number; name: string }) => { storeNames[s.id] = s.name })

  const loading = {
    rider: riderLoading, stores: false, available: availableLoading,
    active: activeLoading, stats: statsLoading, history: historyLoading, toggle: toggleLoading,
  }

  const error: Record<string, string | null> = {
    rider: riderError ? 'Failed to load profile' : null,
    available: availableError ? 'Failed to load available orders' : null,
    active: activeError ? 'Failed to load active deliveries' : null,
    stats: statsError ? 'Failed to load stats' : null,
    history: historyError ? 'Failed to load history' : null,
  }

  const handleToggleAvailability = useCallback(async () => {
    setToggleLoading(true)
    try {
      await api.toggleAvailability()
      await qc.invalidateQueries({ queryKey: ['rider-profile'] })
    } catch {
    } finally {
      setToggleLoading(false)
    }
  }, [qc])

  const handleClaimOrder = useCallback(async (orderId: number) => {
    await claimMutation.mutateAsync(orderId)
  }, [claimMutation])

  const advanceOrder = useCallback(async (orderId: number, action: string, itemIds: number[]) => {
    await advanceMutation.mutateAsync({ orderId, action, itemIds })
  }, [advanceMutation])

  const storeName = rider?.store_id ? storeNames[rider.store_id] : null

  function getNextAction(order: Order): { label: string; action: string } | null {
    if (order.status === 'cancelled' || order.status === 'delivered') return null
    const actions: Record<string, { label: string; action: string }> = {
      confirmed: { label: 'Items Bought', action: 'items_bought' },
      preparing: { label: 'Out for Delivery', action: 'out_for_delivery' },
      out_for_delivery: { label: 'Delivered', action: 'delivered' },
    }
    return actions[order.status] ?? null
  }

  return (
    <>
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
              aria-pressed={!!rider?.is_available}
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
                <ErrorState message={error.available} onRetry={refetchAvailable} />
              ) : availableOrders.length === 0 ? (
                <EmptyState icon={Clock} title="No available orders" description="Check back soon for new delivery requests." />
              ) : (
                <div className="space-y-4">
                  {availableOrders.map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      badge={{ label: 'Available', variant: 'available' }}
                      action={
                        <button
                          onClick={() => handleClaimOrder(order.id)}
                          className="inline-flex items-center gap-1.5 bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                        >
                          <Bike size={16} />
                          Claim Order
                        </button>
                      }
                    />
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
                <ErrorState message={error.active} onRetry={refetchActive} />
              ) : activeDeliveries.length === 0 ? (
                <EmptyState icon={Truck} title="No active deliveries" description="Claim an order to start delivering." />
              ) : (
                <div className="space-y-4">
                  {activeDeliveries.map(order => {
                    const next = getNextAction(order)
                    return (
                      <OrderCard
                        key={order.id}
                        order={order}
                        badge={{ label: orderStatusLabel(order.status) }}
                        action={next ? (
                          <button
                            onClick={() => advanceOrder(order.id, next.action, order.items?.map(i => i.id) ?? [])}
                            className="inline-flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                          >
                            {next.label}
                          </button>
                        ) : undefined}
                      />
                    )
                  })}
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
                <ErrorState message={error.stats} onRetry={refetchStats} />
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
                              {badge.badge_type ? humanize(badge.badge_type) : 'Badge'}
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
                <ErrorState message={error.history} onRetry={refetchHistory} />
              ) : history.length === 0 ? (
                <EmptyState icon={History} title="No delivery history" description="Your completed deliveries will appear here." />
              ) : (
                <div className="space-y-4">
                  {history.map(order => (
                    <OrderCard key={order.id} order={order} badge={{ label: orderStatusLabel(order.status) }} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </main>
    </>
  )
}
