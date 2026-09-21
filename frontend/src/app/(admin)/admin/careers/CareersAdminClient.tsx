'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, Search, Loader2, X, Save } from 'lucide-react'
import { useAdminCareers, useCreateAdminCareer, useUpdateAdminCareer, useDeleteAdminCareer } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import type { CareerListing } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function CareersAdminClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: careers = [], isLoading, error } = useAdminCareers()
  const createMut = useCreateAdminCareer()
  const updateMut = useUpdateAdminCareer()
  const deleteMut = useDeleteAdminCareer()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CareerListing | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState<'full_time' | 'part_time' | 'contract'>('full_time')
  const [isActive, setIsActive] = useState(true)

  const filtered = careers.filter((c: any) => c.title.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setTitle(''); setSlug(''); setDescription(''); setLocation(''); setType('full_time'); setIsActive(true); setShowForm(true) }
  const openEdit = (c: any) => { setEditing(c); setTitle(c.title); setSlug(c.slug); setDescription(c.description || ''); setLocation(c.location || ''); setType(c.type || 'full_time'); setIsActive(c.is_active ?? true); setShowForm(true) }

  const submit = async () => {
    const payload: any = { title, slug: slug || slugify(title), description, location, type, is_active: isActive }
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, ...payload } as any); toast.success('Updated') }
      else { await createMut.mutateAsync(payload); toast.success('Created') }
      setShowForm(false)
    } catch (e: any) { toast.error(e.message || 'Failed') }
  }

  if (!canManage) return <div className="max-w-7xl mx-auto p-8"><p className="text-red-600">Forbidden — developer only.</p></div>
  if (isLoading) return <div className="max-w-7xl mx-auto p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading…</div>
  if (error) return <div className="max-w-7xl mx-auto p-8 text-red-600">Failed: {(error as any).message}</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Careers</h1><p className="text-sm text-gray-500">{careers.length} total</p></div><button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg"><Plus size={16} /> New Listing</button></div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" /></div>
      <div className="bg-white border rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="text-left px-4 py-2">Title</th><th className="text-left px-4 py-2">Location</th><th className="text-left px-4 py-2">Type</th><th className="text-left px-4 py-2">Active</th><th className="text-right px-4 py-2">Actions</th></tr></thead><tbody>
        {filtered.map((c: any) => (<tr key={c.id} className="border-t hover:bg-gray-50"><td className="px-4 py-2 font-medium">{c.title}</td><td className="px-4 py-2">{c.location}</td><td className="px-4 py-2">{c.type}</td><td className="px-4 py-2">{c.is_active ? 'Yes' : 'No'}</td><td className="px-4 py-2"><div className="flex justify-end gap-1"><button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded"><Edit3 size={14} /></button><button onClick={async () => { if (!confirm(`Delete ${c.title}?`)) return; try { await deleteMut.mutateAsync(c.id); toast.success('Deleted') } catch (e: any) { toast.error(e.message) } }} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button></div></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No listings</td></tr>}
      </tbody></table></div></div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} /><div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"><div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between"><h2 className="font-semibold">{editing ? 'Edit Listing' : 'New Listing'}</h2><button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button></div><div className="p-5 space-y-4">
          <div><label className="text-xs font-medium">Title</label><input value={title} onChange={e => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-medium">Slug</label><input value={slug} onChange={e => setSlug(slugify(e.target.value))} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-medium">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-medium">Location</label><input value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-medium">Type</label><select value={type} onChange={e => setType(e.target.value as any)} className="mt-1 w-full border rounded px-3 py-2 text-sm"><option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option></select></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active</label>
          <button onClick={submit} disabled={createMut.isPending || updateMut.isPending} className="w-full inline-flex justify-center items-center gap-2 bg-primary text-white py-2 rounded-lg disabled:opacity-50"><Save size={16} /> {editing ? 'Save' : 'Create'}</button>
        </div></div></div>
      )}
    </div>
  )
}
