'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Edit3, Trash2, Search, Loader2, AlertCircle, Package, X, Save, Eye, EyeOff } from 'lucide-react'
import { useAdminProducts, useCreateAdminProduct, useUpdateAdminProduct, useDeleteAdminProduct, useCategories } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import type { Product } from '@/types'
import { formatZar } from '@/lib/money'

const ROLES = ['developer']

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductsClient() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const canManage = !!user && ROLES.includes(user.role)
  const { data: products = [], isLoading, error, refetch } = useAdminProducts()
  const { data: categories = [] } = useCategories()
  const createMut = useCreateAdminProduct()
  const updateMut = useUpdateAdminProduct()
  const deleteMut = useDeleteAdminProduct()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [unit, setUnit] = useState('each')
  const [description, setDescription] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSlug('')
    setCategoryId(categories[0] ? String((categories[0] as any).id) : '')
    setPrice('')
    setSalePrice('')
    setUnit('each')
    setDescription('')
    setIsFeatured(false)
    setIsActive(true)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setName(p.name)
    setSlug(p.slug)
    setCategoryId(String(p.category_id))
    setPrice(String(p.price))
    setSalePrice(p.sale_price != null ? String(p.sale_price) : '')
    setUnit(p.unit)
    setDescription(p.description ?? '')
    setIsFeatured(p.is_featured)
    setIsActive((p as any).is_active ?? true)
    setFormError(null)
    setShowForm(true)
  }

  const handleSave = () => {
    setFormError(null)
    if (!name.trim()) { setFormError('Name required'); return }
    const finalSlug = slug.trim() || slugify(name)
    if (!finalSlug) { setFormError('Slug required'); return }
    if (!categoryId) { setFormError('Category required'); return }
    const priceNum = Number(price)
    if (isNaN(priceNum) || priceNum < 0) { setFormError('Valid price required'); return }
    const saleNum = salePrice.trim() ? Number(salePrice) : null
    if (saleNum != null && (isNaN(saleNum) || saleNum < 0 || saleNum > priceNum)) { setFormError('Sale price must be <= price'); return }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      slug: finalSlug,
      category_id: Number(categoryId),
      price: priceNum,
      sale_price: saleNum,
      unit: unit.trim() || 'each',
      description: description.trim() || null,
      is_featured: isFeatured,
      is_active: isActive,
    }

    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload } as any, {
        onSuccess: () => { toast.success('Product updated'); setShowForm(false) },
        onError: (e: any) => setFormError(e.message || 'Update failed'),
      })
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { toast.success('Product created'); setShowForm(false) },
        onError: (e: any) => setFormError(e.message || 'Create failed'),
      })
    }
  }

  const filtered = products.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
  })

  if (!canManage) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Developer access only</h1>
        <p className="text-sm text-gray-500 mt-2">Product management requires developer role.</p>
        <Link href="/admin/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">Back to Dashboard</Link>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Package size={24} /> Products</h1>
            <p className="text-sm text-gray-500 mt-1">{filtered.length} products</p>
          </div>
          <button onClick={openCreate} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-dark"><Plus size={16} /> New Product</button>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6 bg-white border border-gray-100 rounded-xl p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
          </div>
        </motion.div>

        {error && (
          <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-accent" /><span className="text-sm">{(error as Error).message}</span>
            <button onClick={() => refetch()} className="ml-auto text-primary text-sm">Retry</button>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-16" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border rounded-xl p-12 text-center"><Package size={32} className="mx-auto text-gray-200 mb-2" /><p className="text-sm text-gray-500">No products</p></div>
        ) : (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map(p => (
                <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{p.name}</span>
                      {p.is_featured && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Featured</span>}
                      {!(p as any).is_active && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff size={10} />Hidden</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{p.slug} · {p.unit} · {formatZar(p.price)} {p.sale_price ? `→ ${formatZar(p.sale_price)}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"><Edit3 size={14} /></button>
                    <button onClick={() => setDeletingId(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="font-semibold">{editing ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setShowForm(false)}><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <input value={name} onChange={e => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} placeholder="Name *" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug *" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Select category</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit (each, kg…)" className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price *" type="number" step="0.01" className="border rounded-lg px-3 py-2 text-sm" />
                  <input value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="Sale price (optional)" type="number" step="0.01" className="border rounded-lg px-3 py-2 text-sm" />
                </div>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" rows={3} className="w-full border rounded-lg px-3 py-2 text-sm" />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} /> Featured</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active</label>
                </div>
                {formError && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={12} />{formError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm">Cancel</button>
                  <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">
                    {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin" />}<Save size={14} />{editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId != null && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-semibold mb-2">Delete product?</h3>
              <p className="text-sm text-gray-500 mb-6">If it has order history it will be deactivated instead of deleted.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm">Cancel</button>
                <button onClick={() => deleteMut.mutate(deletingId, { onSuccess: () => { toast.success('Deleted'); setDeletingId(null) }, onError: (e: any) => toast.error(e.message) })} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}
