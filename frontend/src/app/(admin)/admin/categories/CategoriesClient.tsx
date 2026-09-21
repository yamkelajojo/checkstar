'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Edit3, Trash2, Search, Loader2, AlertCircle, Tags, X, Save } from 'lucide-react'
import { useAdminCategories, useCreateAdminCategory, useUpdateAdminCategory, useDeleteAdminCategory } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import type { Category } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function CategoriesClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: categories = [], isLoading, error, refetch } = useAdminCategories()
  const createMut = useCreateAdminCategory()
  const updateMut = useUpdateAdminCategory()
  const deleteMut = useDeleteAdminCategory()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = () => { setEditing(null); setName(''); setSlug(''); setDescription(''); setSortOrder('0'); setFormError(null); setShowForm(true) }
  const openEdit = (c: Category) => { setEditing(c); setName(c.name); setSlug(c.slug); setDescription(c.description ?? ''); setSortOrder(String(c.sort_order)); setFormError(null); setShowForm(true) }

  const handleSave = () => {
    if (!name.trim()) { setFormError('Name required'); return }
    const finalSlug = slug.trim() || slugify(name)
    const payload: Record<string, unknown> = { name: name.trim(), slug: finalSlug, description: description.trim() || null, sort_order: Number(sortOrder) || 0 }
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload } as any, { onSuccess: () => { toast.success('Category updated'); setShowForm(false) }, onError: (e: any) => setFormError(e.message) })
    } else {
      createMut.mutate(payload, { onSuccess: () => { toast.success('Category created'); setShowForm(false) }, onError: (e: any) => setFormError(e.message) })
    }
  }

  const filtered = categories.filter(c => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase()))

  if (!canManage) return <main className="max-w-4xl mx-auto px-4 py-16 text-center"><h1 className="text-xl font-semibold">Developer only</h1><Link href="/admin/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">Back</Link></main>

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-3xl font-bold flex items-center gap-2"><Tags size={24} /> Categories</h1><p className="text-sm text-gray-500">{filtered.length} categories</p></div>
          <button onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"><Plus size={16} /> New Category</button>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6 bg-white border rounded-xl p-4">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" /></div>
        </motion.div>

        {error && <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-2"><AlertCircle size={16} className="text-accent" /><span className="text-sm">{(error as Error).message}</span><button onClick={() => refetch()} className="ml-auto text-primary text-sm">Retry</button></motion.div>}

        {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-16" />)}</div> : filtered.length === 0 ? <div className="bg-white border rounded-xl p-12 text-center text-sm text-gray-500">No categories</div> : (
          <motion.div variants={fadeUp} className="bg-white border rounded-xl overflow-hidden divide-y">
            {filtered.map(c => (
              <div key={c.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0"><span className="font-medium text-sm">{c.name}</span><span className="text-xs text-gray-400 ml-2">{c.slug} · order {c.sort_order}</span>{c.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{c.description}</p>}</div>
                <div className="flex gap-1"><button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-primary rounded-lg"><Edit3 size={14} /></button><button onClick={() => setDeletingId(c.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button></div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md">
              <div className="px-6 py-4 border-b flex items-center justify-between"><h2 className="font-semibold">{editing ? 'Edit Category' : 'New Category'}</h2><button onClick={() => setShowForm(false)}><X size={18} /></button></div>
              <div className="p-6 space-y-4">
                <input value={name} onChange={e => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} placeholder="Name *" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug *" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input value={sortOrder} onChange={e => setSortOrder(e.target.value)} placeholder="Sort order" type="number" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <div className="flex justify-end gap-2"><button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm">Cancel</button><button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"><Save size={14} />{editing ? 'Update' : 'Create'}</button></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId != null && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-semibold mb-2">Delete category?</h3><p className="text-sm text-gray-500 mb-6">Fails if products still use it — re-home products first.</p>
              <div className="flex justify-end gap-2"><button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm">Cancel</button><button onClick={() => deleteMut.mutate(deletingId, { onSuccess: () => { toast.success('Deleted'); setDeletingId(null) }, onError: (e: any) => toast.error(e.message) })} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Delete</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
