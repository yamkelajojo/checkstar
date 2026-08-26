'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Package, Bike, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'
import { usePendingDispatch } from '@/lib/query'
import { useQueryClient } from '@tanstack/react-query'

export default function DispatchConsoleClient() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, checkAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const [storeIdInput, setStoreIdInput] = useState('')
  const [riderInputs, setRiderInputs] = useState<Record<number, string>>({})
  const [reassignInputs, setReassignInputs] = useState<Record<number, string>>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const storeId = user?.role === 'developer' && storeIdInput ? Number(storeIdInput) : undefined
  const { data: pending = [], isLoading, error, refetch } = usePendingDispatch(storeId)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login')
  }, [authLoading, isAuthenticated, router])

  const allowedRoles = ['store_manager', 'logistics_officer', 'store_owner', 'developer']
  if (!authLoading && user && !allowedRoles.includes(user.role)) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={32} className="mx-auto text-accent mb-4" />
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-gray-500 mt-2">Logistics console requires Store Manager, Logistics Officer, Store Owner or Developer.</p>
      </main>
    )
  }

  const handleDispatch = async (orderId: number) => {
    const riderIdStr = riderInputs[orderId]
    if (!riderIdStr) {
      setMessage({ type: 'error', text: 'Enter a Rider ID' })
      return
    }
    try {
      const riderId = Number(riderIdStr)
      await api.dispatchOrder(orderId, riderId, storeId)
      setMessage({ type: 'success', text: `Order #${orderId} dispatched to rider ${riderId}` })
      queryClient.invalidateQueries({ queryKey: ['pending-dispatch'] })
      void refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dispatch failed'
      const reason = (err as { payload?: { reason?: string } })?.payload?.reason
      setMessage({ type: 'error', text: reason ? `${msg} (${reason})` : msg })
    }
  }

  const handleReassign = async (orderId: number) => {
    const riderIdStr = reassignInputs[orderId]
    if (!riderIdStr) {
      setMessage({ type: 'error', text: 'Enter new Rider ID for reassign' })
      return
    }
    try {
      await api.reassignOrder(orderId, Number(riderIdStr))
      setMessage({ type: 'success', text: `Order #${orderId} reassigned` })
      queryClient.invalidateQueries({ queryKey: ['pending-dispatch'] })
      void refetch()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reassign failed'
      const reason = (err as { payload?: { reason?: string } })?.payload?.reason
      setMessage({ type: 'error', text: reason ? `${msg} (${reason})` : msg })
    }
  }

  if (authLoading || isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-primary" />
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2">Dispatch Console</h1>
        <p className="text-gray-500 text-sm mb-6">Confirmed orders awaiting riders at your Store. All assignments flow through the atomic Order Claim path.</p>

        {user?.role === 'developer' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className="block text-xs font-medium text-amber-800 mb-1">Developer: explicit store_id required (StoreContext)</label>
            <input value={storeIdInput} onChange={e => setStoreIdInput(e.target.value)} placeholder="Store ID (e.g. 1)" className="w-32 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
        )}

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-accent/10 border border-accent/20 text-accent'}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {message.text}
          </div>
        )}

        {error && (
          <div className="bg-accent/10 border border-accent/20 text-accent text-sm rounded-lg px-4 py-3 mb-6">{(error as Error).message}</div>
        )}

        {pending.length === 0 ? (
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
                    <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('en-ZA')} · {order.status} · {order.items?.length ?? 0} items</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Bike size={12} /> {order.delivery_address ?? 'No address'}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${order.status === 'retrying' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <input value={riderInputs[order.id] ?? ''} onChange={e => setRiderInputs(s => ({ ...s, [order.id]: e.target.value }))} placeholder="Rider ID" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                    <button onClick={() => handleDispatch(order.id)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">Dispatch</button>
                  </div>
                  {(order.status === 'preparing' && (order as any).rider_id) && (
                    <div className="flex items-center gap-2">
                      <input value={reassignInputs[order.id] ?? ''} onChange={e => setReassignInputs(s => ({ ...s, [order.id]: e.target.value }))} placeholder="New Rider ID (reassign)" className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
                      <button onClick={() => handleReassign(order.id)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">Reassign</button>
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
