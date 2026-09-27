'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Search, AlertCircle, Bike, Edit3, X, Save, Star, Package, MapPin } from 'lucide-react'
import { useAdminRiders, useUpdateAdminRider, useStores } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import type { Rider } from '@/types'

export default function RidersClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: riders = [], isLoading, error, refetch } = useAdminRiders()
  const { data: stores = [] } = useStores()
  const updateMut = useUpdateAdminRider()

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Rider | null>(null)
  const [storeId, setStoreId] = useState<string>('')
  const [vehicle, setVehicle] = useState('')
  const [maxRadius, setMaxRadius] = useState('10')

  const openEdit = (r: Rider) => {
    setEditing(r)
    setStoreId(r.store_id ? String(r.store_id) : '')
    setVehicle(r.vehicle_type ?? '')
    setMaxRadius(String(r.max_radius_km ?? 10))
  }

  const handleUpdate = () => {
    if (!editing) return
    updateMut.mutate({ id: editing.id, store_id: storeId ? Number(storeId) : null, vehicle_type: vehicle || null, max_radius_km: Number(maxRadius) || 10 } as any, {
      onSuccess: () => { toast.success('Rider updated'); setEditing(null) },
      onError: (e: any) => toast.error(e.message || 'Update failed'),
    })
  }

  const filtered = riders.filter(r => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (r.user?.name?.toLowerCase().includes(q) || r.user?.email?.toLowerCase().includes(q) || r.vehicle_type?.toLowerCase().includes(q))
  })

  if (!canManage) return <main className="max-w-4xl mx-auto px-4 py-16 text-center"><h1 className="text-xl font-semibold">Developer only</h1><Link href="/admin/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">Back</Link></main>

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-3xl font-bold flex items-center gap-2"><Bike size={24} /> Riders</h1><p className="text-sm text-gray-500">{filtered.length} riders</p></div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6 bg-white border rounded-xl p-4">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search riders…" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" /></div>
        </motion.div>

        {error && <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border rounded-xl p-4 flex items-center gap-2"><AlertCircle size={16} className="text-accent" /><span className="text-sm">{(error as Error).message}</span><button onClick={() => refetch()} className="ml-auto text-primary text-sm">Retry</button></motion.div>}

        {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-20" />)}</div> : (
          <motion.div variants={fadeUp} className="bg-white border rounded-xl overflow-hidden divide-y">
            {filtered.map(r => (
              <div key={r.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="w-10 h-10 bg-primary-light rounded-full flex items-center justify-center"><Bike size={18} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{r.user?.name ?? `Rider #${r.id}`}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${r.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.is_available ? 'Available' : 'Offline'}</span></div>
                  <div className="text-xs text-gray-400 flex items-center gap-3 mt-0.5"><span className="flex items-center gap-1"><MapPin size={11} />Store {r.store_id ?? '—'}</span><span className="flex items-center gap-1"><Package size={11} />{r.total_deliveries} deliveries</span><span className="flex items-center gap-1"><Star size={11} />{r.average_rating != null ? Number(r.average_rating).toFixed(1) : '—'}</span><span>{r.vehicle_type ?? 'No vehicle'}</span></div>
                </div>
                <button onClick={() => openEdit(r)} className="p-2 text-gray-400 hover:text-primary rounded-lg"><Edit3 size={14} /></button>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between"><h2 className="font-semibold">Edit Rider — {editing.user?.name ?? editing.id}</h2><button onClick={() => setEditing(null)}><X size={18} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs text-gray-500">Store</label><select value={storeId} onChange={e => setStoreId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1"><option value="">No store</option>{stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="text-xs text-gray-500">Vehicle type</label><input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="e.g. motorbike, bicycle" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
              <div><label className="text-xs text-gray-500">Max radius km</label><input value={maxRadius} onChange={e => setMaxRadius(e.target.value)} type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1" /></div>
              <div className="flex justify-end gap-2"><button onClick={() => setEditing(null)} className="px-4 py-2 text-sm">Cancel</button><button onClick={handleUpdate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"><Save size={14} />Update</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
