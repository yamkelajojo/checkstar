'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Edit3, Trash2, Search, AlertCircle, Sparkles, X, Save } from 'lucide-react'
import { useAdminSpecials, useCreateAdminSpecial, useUpdateAdminSpecial, useDeleteAdminSpecial } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import type { Special } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function SpecialsAdminClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: specials = [], isLoading, error, refetch } = useAdminSpecials()
  const createMut = useCreateAdminSpecial()
  const updateMut = useUpdateAdminSpecial()
  const deleteMut = useDeleteAdminSpecial()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Special | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = () => { setEditing(null); setTitle(''); setSlug(''); setDescription(''); setStartDate(''); setEndDate(''); setFormError(null); setShowForm(true) }
  const openEdit = (s: Special) => { setEditing(s); setTitle(s.title); setSlug(s.slug); setDescription(s.description ?? ''); setStartDate(s.start_date?.slice(0,10) ?? ''); setEndDate(s.end_date?.slice(0,10) ?? ''); setFormError(null); setShowForm(true) }

  const handleSave = () => {
    if (!title.trim()) { setFormError('Title required'); return }
    const finalSlug = slug.trim() || slugify(title)
    const payload: Record<string, unknown> = { title: title.trim(), slug: finalSlug, description: description.trim() || null, start_date: startDate || null, end_date: endDate || null }
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload } as any, { onSuccess: () => { toast.success('Special updated'); setShowForm(false) }, onError: (e: any) => setFormError(e.message) })
    } else {
      createMut.mutate(payload, { onSuccess: () => { toast.success('Special created'); setShowForm(false) }, onError: (e: any) => setFormError(e.message) })
    }
  }

  const filtered = specials.filter(s => !search.trim() || s.title.toLowerCase().includes(search.toLowerCase()))

  if (!canManage) return <main className="max-w-4xl mx-auto px-4 py-16 text-center"><h1 className="text-xl font-semibold">Developer only</h1><Link href="/admin/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">Back</Link></main>

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-3xl font-bold flex items-center gap-2"><Sparkles size={24} /> Specials</h1><p className="text-sm text-gray-500">{filtered.length} specials</p></div>
          <button onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> New Special</button>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6 bg-white border rounded-xl p-4">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search specials…" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" /></div>
        </motion.div>

        {error && <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border rounded-xl p-4 flex items-center gap-2"><AlertCircle size={16} className="text-accent" /><span className="text-sm">{(error as Error).message}</span><button onClick={() => refetch()} className="ml-auto text-primary text-sm">Retry</button></motion.div>}

        {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-16" />)}</div> : filtered.length === 0 ? <div className="bg-white border rounded-xl p-12 text-center text-sm text-gray-500">No specials</div> : (
          <motion.div variants={fadeUp} className="bg-white border rounded-xl overflow-hidden divide-y">
            {filtered.map(s => (
              <div key={s.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0"><span className="font-medium text-sm">{s.title}</span><span className="text-xs text-gray-400 ml-2">{s.slug}</span><div className="text-xs text-gray-400 mt-0.5">{s.start_date ? new Date(s.start_date).toLocaleDateString() : ''} {s.end_date ? `→ ${new Date(s.end_date).toLocaleDateString()}` : ''} {s.products?.length ? `· ${s.products.length} products` : ''}</div></div>
                <div className="flex gap-1"><button onClick={() => openEdit(s)} className="p-2 text-gray-400 hover:text-primary rounded-lg"><Edit3 size={14} /></button><button onClick={() => setDeletingId(s.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button></div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b flex items-center justify-between"><h2 className="font-semibold">{editing ? 'Edit Special' : 'New Special'}</h2><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
              <div className="p-6 space-y-4">
                <input value={title} onChange={e => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} placeholder="Title *" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug *" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-3"><input value={startDate} onChange={e => setStartDate(e.target.value)} type="date" className="border rounded-lg px-3 py-2 text-sm" /><input value={endDate} onChange={e => setEndDate(e.target.value)} type="date" className="border rounded-lg px-3 py-2 text-sm" /></div>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
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
              <h3 className="font-semibold mb-2">Delete special?</h3><p className="text-sm text-gray-500 mb-6">This removes the special bundle.</p>
              <div className="flex justify-end gap-2"><button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm">Cancel</button><button onClick={() => deleteMut.mutate(deletingId, { onSuccess: () => { toast.success('Deleted'); setDeletingId(null) }, onError: (e: any) => toast.error(e.message) })} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Delete</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
