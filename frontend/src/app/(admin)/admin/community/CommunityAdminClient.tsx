'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, Save, Loader2, HeartHandshake } from 'lucide-react'
import { useAdminCommunityPosts, useCreateAdminCommunityPost, useUpdateAdminCommunityPost, useDeleteAdminCommunityPost } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import PageHeader from '@/components/admin/PageHeader'
import SearchInput from '@/components/admin/SearchInput'
import Modal from '@/components/admin/Modal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import EmptyState from '@/components/admin/EmptyState'
import ErrorState from '@/components/admin/ErrorState'
import type { CommunityPost } from '@/types'

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export default function CommunityAdminClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: posts = [], isLoading, error, refetch } = useAdminCommunityPosts({ enabled: canManage })
  const createMut = useCreateAdminCommunityPost()
  const updateMut = useUpdateAdminCommunityPost()
  const deleteMut = useDeleteAdminCommunityPost()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CommunityPost | null>(null)
  const [deleting, setDeleting] = useState<CommunityPost | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<'gallery' | 'csr'>('gallery')
  const [isPublished, setIsPublished] = useState(true)

  const filtered = posts.filter((p: CommunityPost) => p.title.toLowerCase().includes(search.toLowerCase()))

  const openCreate = () => { setEditing(null); setTitle(''); setSlug(''); setContent(''); setCategory('gallery'); setIsPublished(true); setShowForm(true) }
  const openEdit = (p: CommunityPost) => { setEditing(p); setTitle(p.title); setSlug(p.slug); setContent(p.content || ''); setCategory(p.category || 'gallery'); setIsPublished(p.is_published ?? true); setShowForm(true) }

  const submit = async () => {
    const payload: Record<string, unknown> = { title, slug: slug || slugify(title), content: content || null, category, is_published: isPublished }
    try {
      if (editing) { await updateMut.mutateAsync({ id: editing.id, ...payload } as never); toast.success('Post updated') }
      else { await createMut.mutateAsync(payload); toast.success('Post created') }
      setShowForm(false)
    } catch (e) { toast.error((e as Error).message || 'Failed to save the post') }
  }

  if (!canManage) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          icon={HeartHandshake}
          title="Developer only"
          hint="Community posts are managed by the platform team."
        />
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <PageHeader
        title="Community Posts"
        subtitle={`${posts.length} total`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark"
          >
            <Plus size={16} /> New Post
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Search posts by title…" />

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
                  <th className="text-left px-4 py-2">Category</th>
                  <th className="text-left px-4 py-2">Published</th>
                  <th className="text-right px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: CommunityPost) => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{p.title}</td>
                    <td className="px-4 py-2">{p.category}</td>
                    <td className="px-4 py-2">{p.is_published ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => openEdit(p)} aria-label={`Edit ${p.title}`} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800">
                          <Edit3 size={14} />
                        </button>
                        <button type="button" onClick={() => setDeleting(p)} aria-label={`Delete ${p.title}`} className="p-2 hover:bg-red-50 text-red-600 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      {search ? `No posts match “${search}”` : 'No posts yet'}
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
        title={editing ? 'Edit post' : 'New post'}
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
            <label htmlFor="post-title" className="text-xs font-medium text-gray-500 block mb-1">Title</label>
            <input
              id="post-title"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (!editing) setSlug(slugify(e.target.value)) }}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="post-slug" className="text-xs font-medium text-gray-500 block mb-1">Slug</label>
            <input
              id="post-slug"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <label htmlFor="post-category" className="text-xs font-medium text-gray-500 block mb-1">Category</label>
            <select
              id="post-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as 'gallery' | 'csr')}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="gallery">Gallery</option>
              <option value="csr">CSR</option>
            </select>
          </div>
          <div>
            <label htmlFor="post-content" className="text-xs font-medium text-gray-500 block mb-1">Content</label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30" />
            Published
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleting != null}
        title="Delete this post?"
        body={deleting ? `“${deleting.title}” will be removed from the community page.` : ''}
        confirmLabel="Delete post"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteMut.mutate(deleting.id, {
              onSuccess: () => {
                toast.success('Post deleted')
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
