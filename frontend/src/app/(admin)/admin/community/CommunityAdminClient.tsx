'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, Search, Loader2, X, Save } from 'lucide-react'
import { useAdminCommunityPosts, useCreateAdminCommunityPost, useUpdateAdminCommunityPost, useDeleteAdminCommunityPost } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import type { CommunityPost } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function CommunityAdminClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: posts = [], isLoading, error } = useAdminCommunityPosts()
  const createMut = useCreateAdminCommunityPost()
  const updateMut = useUpdateAdminCommunityPost()
  const deleteMut = useDeleteAdminCommunityPost()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CommunityPost | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<'gallery' | 'csr'>('gallery')
  const [isPublished, setIsPublished] = useState(true)

  const filtered = posts.filter((p: any) => p.title.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setTitle(''); setSlug(''); setContent(''); setCategory('gallery'); setIsPublished(true); setShowForm(true) }
  const openEdit = (p: any) => { setEditing(p); setTitle(p.title); setSlug(p.slug); setContent(p.content || ''); setCategory(p.category || 'gallery'); setIsPublished(p.is_published ?? true); setShowForm(true) }

  const submit = async () => {
    const payload: any = { title, slug: slug || slugify(title), content: content || null, category, is_published: isPublished }
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
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Community Posts</h1><p className="text-sm text-gray-500">{posts.length} total</p></div><button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg"><Plus size={16} /> New Post</button></div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" /></div>
      <div className="bg-white border rounded-xl overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="text-left px-4 py-2">Title</th><th className="text-left px-4 py-2">Category</th><th className="text-left px-4 py-2">Published</th><th className="text-right px-4 py-2">Actions</th></tr></thead><tbody>
        {filtered.map((p: any) => (<tr key={p.id} className="border-t hover:bg-gray-50"><td className="px-4 py-2 font-medium">{p.title}</td><td className="px-4 py-2">{p.category}</td><td className="px-4 py-2">{p.is_published ? 'Yes' : 'No'}</td><td className="px-4 py-2"><div className="flex justify-end gap-1"><button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded"><Edit3 size={14} /></button><button onClick={async () => { if (!confirm(`Delete ${p.title}?`)) return; try { await deleteMut.mutateAsync(p.id); toast.success('Deleted') } catch (e: any) { toast.error(e.message) } }} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button></div></td></tr>))}
        {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No posts</td></tr>}
      </tbody></table></div></div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} /><div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto"><div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between"><h2 className="font-semibold">{editing ? 'Edit Post' : 'New Post'}</h2><button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button></div><div className="p-5 space-y-4">
          <div><label className="text-xs font-medium">Title</label><input value={title} onChange={e => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-medium">Slug</label><input value={slug} onChange={e => setSlug(slugify(e.target.value))} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
          <div><label className="text-xs font-medium">Category</label><select value={category} onChange={e => setCategory(e.target.value as any)} className="mt-1 w-full border rounded px-3 py-2 text-sm"><option value="gallery">Gallery</option><option value="csr">CSR</option></select></div>
          <div><label className="text-xs font-medium">Content</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} /> Published</label>
          <button onClick={submit} disabled={createMut.isPending || updateMut.isPending} className="w-full inline-flex justify-center items-center gap-2 bg-primary text-white py-2 rounded-lg disabled:opacity-50"><Save size={16} /> {editing ? 'Save' : 'Create'}</button>
        </div></div></div>
      )}
    </div>
  )
}
