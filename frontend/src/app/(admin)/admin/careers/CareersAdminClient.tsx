'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, Save, Loader2, Briefcase } from 'lucide-react'
import { useAdminCareers, useCreateAdminCareer, useUpdateAdminCareer, useDeleteAdminCareer } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import PageHeader from '@/components/admin/PageHeader'
import SearchInput from '@/components/admin/SearchInput'
import Modal from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import EmptyState from '@/components/admin/EmptyState'
import ErrorState from '@/components/admin/ErrorState'
import Select from '@/components/ui/select'
import type { CareerListing } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function CareersAdminClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: careers = [], isLoading, error, refetch } = useAdminCareers({ enabled: canManage })
  const createMut = useCreateAdminCareer()
  const updateMut = useUpdateAdminCareer()
  const deleteMut = useDeleteAdminCareer()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CareerListing | null>(null)
  const [deleting, setDeleting] = useState<CareerListing | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [type, setType] = useState<'full_time' | 'part_time' | 'contract'>('full_time')
  const [isActive, setIsActive] = useState(true)

  const filtered = careers.filter((c: CareerListing) => c.title.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setTitle(''); setSlug(''); setDescription(''); setLocation(''); setType('full_time'); setIsActive(true); setShowForm(true) }
  const openEdit = (c: CareerListing) => { setEditing(c); setTitle(c.title); setSlug(c.slug); setDescription(c.description || ''); setLocation(c.location || ''); setType((c.type as 'full_time' | 'part_time' | 'contract') || 'full_time'); setIsActive(c.is_active ?? true); setShowForm(true) }

  const submit = async () => {
    const payload: Record<string, unknown> = { title, slug: slug || slugify(title), description, location, type, is_active: isActive }
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, ...payload } as never); toast.success('Listing updated') }
      else { await createMut.mutateAsync(payload); toast.success('Listing created') }
      setShowForm(false)
    } catch (e) { toast.error((e as Error).message || 'Failed to save the listing') }
  }

  if (!canManage) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={Briefcase}
          title="Developer only"
          hint="Career listings are managed by the platform team."
        />
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Careers"
        subtitle={`${careers.length} total`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark"
          >
            <Plus size={16} /> New Listing
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search listings by title…" />

      {error && <ErrorState message={(error as Error).message} onRetry={() => refetch()} />}

      {isLoading ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2">Title</th>
                  <th className="text-left px-4 py-2">Location</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Active</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: CareerListing) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.title}</td>
                    <td className="px-4 py-2">{c.location}</td>
                    <td className="px-4 py-2">{c.type}</td>
                    <td className="px-4 py-2">{c.is_active ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(c)} aria-label={`Edit ${c.title}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800">
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={() => setDeleting(c)} aria-label={`Delete ${c.title}`} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                      {search ? `No listings match “${search}”` : 'No listings yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit listing' : 'New listing'}
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg">
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={createMut.isPending || updateMut.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
            >
              {(createMut.isPending || updateMut.isPending) && <Loader2 size={14} className="animate-spin" />}
              <Save size={14} /> {editing ? 'Save' : 'Create'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="career-title" className="text-xs font-medium text-gray-500 block mb-1">Title</label>
            <input
              id="career-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="career-slug" className="text-xs font-medium text-gray-500 block mb-1">Slug</label>
            <input
              id="career-slug"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="career-description" className="text-xs font-medium text-gray-500 block mb-1">Description</label>
            <textarea
              id="career-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="career-location" className="text-xs font-medium text-gray-500 block mb-1">Location</label>
            <input
              id="career-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="career-type" className="text-xs font-medium text-gray-500 block mb-1">Type</label>
            <div className="mt-1">
              <Select
                id="career-type"
                value={type}
                onChange={(v) => setType(v as 'full_time' | 'part_time' | 'contract')}
                options={[
                  { value: 'full_time', label: 'Full time' },
                  { value: 'part_time', label: 'Part time' },
                  { value: 'contract', label: 'Contract' },
                ]}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
            Active
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting != null}
        title="Delete this listing?"
        body={deleting ? `“${deleting.title}” will no longer appear on the careers page.` : ''}
        confirmLabel="Delete listing"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMut.mutate(deleting.id, {
              onSuccess: () => {
                toast.success('Listing deleted')
                setDeleting(null)
              },
              onError: (e) => toast.error((e as Error).message),
            })
          }
        }}
        onClose={() => setDeleting(null)}
      />
    </main>
  )
}
