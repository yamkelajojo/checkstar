'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Edit3, Trash2, Search, Loader2, AlertCircle, Store, X, Save, MapPin } from 'lucide-react'
import { useAdminStores, useCreateAdminStore, useUpdateAdminStore, useDeleteAdminStore } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import type { Store as StoreType } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function StoresAdminClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: stores = [], isLoading, error, refetch } = useAdminStores()
  const createMut = useCreateAdminStore()
  const updateMut = useUpdateAdminStore()
  const deleteMut = useDeleteAdminStore()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StoreType | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [radius, setRadius] = useState('8')
  const [isActive, setIsActive] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null); setName(''); setSlug(''); setAddress(''); setCity('Durban'); setProvince('KwaZulu-Natal'); setPostalCode(''); setPhone(''); setLat('-29.8587'); setLng('31.0218'); setRadius('8'); setIsActive(true); setFormError(null); setShowForm(true)
  }
  const openEdit = (s: StoreType) => {
    setEditing(s); setName(s.name); setSlug(s.slug); setAddress(s.address); setCity(s.city); setProvince((s as any).province ?? 'KwaZulu-Natal'); setPostalCode((s as any).postal_code ?? ''); setPhone(s.phone); setLat(String(s.latitude)); setLng(String(s.longitude)); setRadius(String(s.delivery_radius_km)); setIsActive(s.is_active); setFormError(null); setShowForm(true)
  }

  const handleSave = () => {
    if (!name.trim() || !address.trim() || !city.trim() || !phone.trim()) { setFormError('Name, address, city, phone required'); return }
    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      address: address.trim(),
      city: city.trim(),
      province: province.trim() || 'KwaZulu-Natal',
      postal_code: postalCode.trim() || '4001',
      phone: phone.trim(),
      latitude: Number(lat),
      longitude: Number(lng),
      delivery_radius_km: Number(radius) || 8,
      is_active: isActive,
    }
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload } as any, { onSuccess: () => { toast.success('Store updated'); setShowForm(false) }, onError: (e: any) => setFormError(e.message) })
    } else {
      createMut.mutate(payload, { onSuccess: () => { toast.success('Store created'); setShowForm(false) }, onError: (e: any) => setFormError(e.message) })
    }
  }

  const filtered = stores.filter(s => !search.trim() || s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase()))

  if (!canManage) return <main className="max-w-4xl mx-auto px-4 py-16 text-center"><h1 className="text-xl font-semibold">Developer only</h1><Link href="/admin/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">Back</Link></main>

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-3xl font-bold flex items-center gap-2"><Store size={24} /> Stores</h1><p className="text-sm text-gray-500">{filtered.length} stores</p></div>
          <button onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> New Store</button>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6 bg-white border rounded-xl p-4">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search stores…" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" /></div>
        </motion.div>

        {error && <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border rounded-xl p-4 flex items-center gap-2"><AlertCircle size={16} className="text-accent" /><span className="text-sm">{(error as Error).message}</span><button onClick={() => refetch()} className="ml-auto text-primary text-sm">Retry</button></motion.div>}

        {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-20" />)}</div> : filtered.length === 0 ? <div className="bg-white border rounded-xl p-12 text-center text-sm text-gray-500">No stores</div> : (
          <motion.div variants={fadeUp} className="bg-white border rounded-xl overflow-hidden divide-y">
            {filtered.map(s => (
              <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center"><Store size={18} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm">{s.name}</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{s.slug}</span>{!s.is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}</div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2"><MapPin size={11} />{s.address}, {s.city} · {s.delivery_radius_km}km · {s.phone}</div>
                </div>
                <div className="flex gap-1"><button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-primary rounded-lg"><Edit3 size={14} /></button><button onClick={() => setDeletingId(s.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button></div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b flex items-center justify-between"><h2 className="font-semibold">{editing ? 'Edit Store' : 'New Store'}</h2><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3"><input value={name} onChange={e => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} placeholder="Name *" className="border rounded-lg px-3 py-2 text-sm" /><input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug *" className="border rounded-lg px-3 py-2 text-sm" /></div>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address *" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-3 gap-3"><input value={city} onChange={e => setCity(e.target.value)} placeholder="City *" className="border rounded-lg px-3 py-2 text-sm" /><input value={province} onChange={e => setProvince(e.target.value)} placeholder="Province" className="border rounded-lg px-3 py-2 text-sm" /><input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="Postal code" className="border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="grid grid-cols-3 gap-3"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone *" className="border rounded-lg px-3 py-2 text-sm" /><input value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude" className="border rounded-lg px-3 py-2 text-sm" /><input value={lng} onChange={e => setLng(e.target.value)} placeholder="Longitude" className="border rounded-lg px-3 py-2 text-sm" /></div>
                <div className="grid grid-cols-2 gap-3"><input value={radius} onChange={e => setRadius(e.target.value)} placeholder="Delivery radius km" type="number" className="border rounded-lg px-3 py-2 text-sm" /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active</label></div>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm">Cancel</button><button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"><Save size={14} />{editing ? 'Update' : 'Create'}</button></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId != null && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-semibold mb-2">Delete store?</h3><p className="text-sm text-gray-500 mb-6">Fails if active orders or order history exists — deactivate instead.</p>
              <div className="flex justify-end gap-2"><button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm">Cancel</button><button onClick={() => deleteMut.mutate(deletingId, { onSuccess: () => { toast.success('Deleted'); setDeletingId(null) }, onError: (e: any) => toast.error(e.message) })} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Delete</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
