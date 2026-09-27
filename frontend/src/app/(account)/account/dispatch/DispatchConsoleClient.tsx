'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Package, Bike, Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { usePendingDispatch, useDispatchRiders } from '@/lib/query'
import { useQueryClient } from '@tanstack/react-query'
import { formatDateTime } from '@/lib/dates'
import { orderStatusLabel } from '@/lib/labels'

const allowedRoles = ['store_manager', 'logistics_officer', 'store_owner', 'developer']

export default function DispatchConsoleClient() {
  const { isLoading: authLoading, user } = useAuthStore()
  const queryClient = useQueryClient()
  const [storeIdInput, setStoreIdInput] = useState('')
  const [selectedRider, setSelectedRider] = useState<Record<number, string>>({})
  const [selectedReassignRider, setSelectedReassignRider] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const authResolved = !authLoading && !!user
  const authorized = authResolved && allowedRoles.includes(user!.role)
  const storeId = user?.role === 'developer' && storeIdInput ? Number(storeIdInput) : undefined
  const canQuery = authorized && (user?.role !== 'developer' || !!storeId)

  const { data: pending = [], isLoading, error, refetch, isFetching } = usePendingDispatch(storeId, {
    enabled: canQuery,
  })

  const { data: riders = [] } = useDispatchRiders(storeId, {
    enabled: canQuery,
  })

  useEffect(() => {
    if (message?.type !== 'success') return
    const t = setTimeout(() => setMessage(null), 5000)
    return () => clearTimeout(t)
  }, [message])

  const handleDispatch = async (orderId: number) => {
    const riderIdStr = selectedRider[orderId]
    if (!riderIdStr) {
      setMessage({ type: 'error', text: 'Select a rider from the dropdown' })
      return
    }
    try {
      const riderId = Number(riderIdStr)
      await api.dispatchOrder(orderId, riderId, storeId)
      setMessage({ type: 'success', text: `Order #${orderId} dispatched to rider ${riderId}` })
      setSelectedRider((s) => ({ ...s, [orderId]: '' }))
      queryClient.invalidateQueries({ queryKey: ['pending-dispatch'] })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dispatch failed'
      const reason = (err as { payload?: { reason?: string } })?.payload?.reason
      setMessage({ type: 'error', text: reason ? `${msg} (${reason})` : msg })
    }
  }

  const handleReassign = async (orderId: number) => {
    const riderIdStr = selectedReassignRider[orderId]
    if (!riderIdStr) {
      setMessage({ type: 'error', text: 'Select a rider to reassign' })
      return
    }
    try {
      await api.reassignOrder(orderId, Number(riderIdStr), storeId)
      setMessage({ type: 'success', text: `Order #${orderId} reassigned to rider ${riderIdStr}` })
      setSelectedReassignRider((s) => ({ ...s, [orderId]: '' }))
      queryClient.invalidateQueries({ queryKey: ['pending-dispatch'] })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reassign failed'
      const reason = (err as { payload?: { reason?: string } })?.payload?.reason
      setMessage({ type: 'error', text: reason ? `${msg} (${reason})` : msg })
    }
  }

  if (authLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-primary" />
      </main>
    )
  }

  if (!authorized) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-rose-500" />
        </div>
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-gray-500 mt-2">
          The dispatch console requires Store Manager, Logistics Officer, Store Owner or Developer access.
        </p>
        <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-4">
          Go to My Account
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Dispatch Console</h1>
            <p className="text-gray-500 text-sm">Confirmed orders awaiting riders at your Store. All assignments flow through the atomic Order Claim path.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
            aria-label="Refresh pending orders"
          >
            <Loader2 size={16} className={isFetching ? 'animate-spin text-primary' : ''} />
          </button>
        </div>

        {user?.role === 'developer' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <label className="block text-xs font-medium text-amber-800 mb-1">Developer: explicit store_id required (StoreContext)</label>
            <input value={storeIdInput} onChange={e => setStoreIdInput(e.target.value)} placeholder="Store ID (e.g. 1)" className="w-32 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white" />
            {!storeId && <p className="text-xs text-amber-700 mt-2">Enter a Store ID to load dispatch data.</p>}
          </div>
        )}

        {user?.role === 'developer' && !storeId ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <h2 className="font-semibold text-gray-600">Select a store</h2>
            <p className="text-sm text-gray-400 mt-1">Developers must specify a store ID to view dispatch orders.</p>
          </div>
        ) : null}

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-accent/10 border border-accent/20 text-accent'}`} role="status">
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {message.text}
          </div>
        )}

        {error && (
          <div className="bg-accent/10 border border-accent/20 text-accent text-sm rounded-lg px-4 py-3 mb-6">{(error as Error).message}</div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 w-32 bg-gray-100 rounded" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <h2 className="font-semibold text-gray-600">No pending dispatch orders</h2>
            <p className="text-sm text-gray-400 mt-1">Orders with status confirmed/retrying and no rider will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map(order => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-mono text-sm font-semibold">#{order.order_number}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(order.created_at)} · {orderStatusLabel(order.status)} · {order.items?.length ?? 0} items</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Bike size={12} /> {order.delivery_address ?? 'No address'}</p>
                    {order.rider_id ? (
                      <p className="text-xs text-gray-400 mt-0.5">Current rider: #{order.rider_id}</p>
                    ) : null}
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${order.status === 'retrying' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{orderStatusLabel(order.status)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {order.rider_id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedReassignRider[order.id] ?? ''}
                        onChange={e => setSelectedReassignRider(s => ({ ...s, [order.id]: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                      >
                        <option value="">Select rider...</option>
                        {riders.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.user?.name ?? 'Unknown'} ({r.vehicle_type ?? 'Bike'})
                          </option>
                        ))}
                      </select>
                      <button onClick={() => handleReassign(order.id)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Reassign</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedRider[order.id] ?? ''}
                        onChange={e => setSelectedRider(s => ({ ...s, [order.id]: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none bg-white"
                      >
                        <option value="">Select rider...</option>
                        {riders.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.user?.name ?? 'Unknown'} ({r.vehicle_type ?? 'Bike'})
                          </option>
                        ))}
                      </select>
                      <button onClick={() => handleDispatch(order.id)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">Dispatch</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">How it works</p>
          <p>Manual dispatch uses <code className="bg-white px-1 py-0.5 rounded border">OrderClaim::claim</code> with <code className="bg-white px-1 py-0.5 rounded border">FOR UPDATE SKIP LOCKED</code> — never a raw rider_id write. Every action is appended to the Order Activity Log. Reassign swaps rider via atomic transaction.</p>
        </div>
      </motion.div>
    </main>
  )
}
