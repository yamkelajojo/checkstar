'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, Search, Loader2, X, Save } from 'lucide-react'
import { useAdminRecipes, useCreateAdminRecipe, useUpdateAdminRecipe, useDeleteAdminRecipe } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import type { Recipe } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function RecipesAdminClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: recipes = [], isLoading, error } = useAdminRecipes()
  const createMut = useCreateAdminRecipe()
  const updateMut = useUpdateAdminRecipe()
  const deleteMut = useDeleteAdminRecipe()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState('[]')
  const [method, setMethod] = useState('')
  const [isPublished, setIsPublished] = useState(true)

  const filtered = recipes.filter((r: Recipe) => r.title.toLowerCase().includes(search.toLowerCase()) || r.slug.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setTitle(''); setSlug(''); setDescription(''); setIngredients('[]'); setMethod(''); setIsPublished(true); setShowForm(true) }
  const openEdit = (r: Recipe) => {
    setEditing(r); setTitle(r.title); setSlug(r.slug); setDescription((r as any).description || ''); setIngredients(JSON.stringify((r as any).ingredients || [])); setMethod((r as any).method || ''); setIsPublished((r as any).is_published ?? true); setShowForm(true)
  }

  const submit = async () => {
    let ing: any
    try { ing = JSON.parse(ingredients); if (!Array.isArray(ing)) throw new Error('must be array') } catch { toast.error('Ingredients must be valid JSON array'); return }
    const payload: any = { title, slug: slug || slugify(title), description: description || null, ingredients: ing, method, is_published: isPublished }
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, ...payload } as any); toast.success('Recipe updated') }
      else { await createMut.mutateAsync(payload); toast.success('Recipe created') }
      setShowForm(false)
    } catch (e: any) { toast.error(e.message || 'Failed') }
  }

  if (!canManage) return <div className="max-w-7xl mx-auto p-8"><p className="text-red-600">Forbidden — developer only.</p></div>
  if (isLoading) return <div className="max-w-7xl mx-auto p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Loading recipes…</div>
  if (error) return <div className="max-w-7xl mx-auto p-8 text-red-600">Failed to load: {(error as any).message}</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Recipes</h1><p className="text-sm text-gray-500">{recipes.length} total</p></div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"><Plus size={16} /> New Recipe</button>
      </div>
      <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" /></div>
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="text-left px-4 py-2">Title</th><th className="text-left px-4 py-2">Slug</th><th className="text-left px-4 py-2">Published</th><th className="text-right px-4 py-2">Actions</th></tr></thead>
            <tbody>
              {filtered.map((r: Recipe) => (
                <tr key={r.id} className="border-t hover:bg-gray-50"><td className="px-4 py-2 font-medium">{r.title}</td><td className="px-4 py-2 text-gray-500">{r.slug}</td><td className="px-4 py-2">{(r as any).is_published ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2"><div className="flex justify-end gap-1"><button onClick={() => openEdit(r)} className="p-1.5 hover:bg-gray-100 rounded"><Edit3 size={14} /></button><button onClick={async () => { if (!confirm(`Delete ${r.title}?`)) return; try { await deleteMut.mutateAsync(r.id); toast.success('Deleted') } catch (e: any) { toast.error(e.message) } }} className="p-1.5 hover:bg-red-50 text-red-600 rounded"><Trash2 size={14} /></button></div></td></tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No recipes</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between"><h2 className="font-semibold">{editing ? 'Edit Recipe' : 'New Recipe'}</h2><button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={16} /></button></div>
            <div className="p-5 space-y-4">
              <div><label className="text-xs font-medium">Title</label><input value={title} onChange={e => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium">Slug</label><input value={slug} onChange={e => setSlug(slugify(e.target.value))} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
              <div><label className="text-xs font-medium">Ingredients (JSON array)</label><textarea value={ingredients} onChange={e => setIngredients(e.target.value)} rows={3} className="mt-1 w-full border rounded px-3 py-2 text-sm font-mono" placeholder='[{"name":"Spinach","amount":"1 bunch"}]' /></div>
              <div><label className="text-xs font-medium">Method</label><textarea value={method} onChange={e => setMethod(e.target.value)} rows={4} className="mt-1 w-full border rounded px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} /> Published</label>
              <button onClick={submit} disabled={createMut.isPending || updateMut.isPending} className="w-full inline-flex justify-center items-center gap-2 bg-primary text-white py-2 rounded-lg disabled:opacity-50"><Save size={16} /> {editing ? 'Save' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
