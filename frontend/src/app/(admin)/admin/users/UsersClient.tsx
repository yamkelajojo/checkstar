'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Search, AlertCircle, Users, Edit3, Trash2, Shield, X, Save } from 'lucide-react'
import { useAdminUsers, useUpdateAdminUser, useDeleteAdminUser } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { roleLabel } from '@/lib/labels'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import type { User } from '@/types'

const ROLES = ['developer','store_owner','store_manager','logistics_officer','customer','rider'] as const

export default function UsersClient() {
  const { user } = useAuthStore()
  const canManage = user?.role === 'developer'
  const { data: users = [], isLoading, error, refetch } = useAdminUsers()
  const updateMut = useUpdateAdminUser()
  const deleteMut = useDeleteAdminUser()

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<User | null>(null)
  const [role, setRole] = useState<string>('customer')
  const [isActive, setIsActive] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const openEdit = (u: User) => { setEditing(u); setRole(u.role); setIsActive(u.is_active); }

  const handleUpdate = () => {
    if (!editing) return
    updateMut.mutate({ id: editing.id, role, is_active: isActive } as any, {
      onSuccess: () => { toast.success('User updated'); setEditing(null) },
      onError: (e: any) => toast.error(e.message || 'Update failed'),
    })
  }

  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
  })

  if (!canManage) return <main className="max-w-4xl mx-auto px-4 py-16 text-center"><h1 className="text-xl font-semibold">Developer only</h1><Link href="/admin/dashboard" className="text-primary text-sm mt-4 inline-block hover:underline">Back</Link></main>

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div><h1 className="font-display text-3xl font-bold flex items-center gap-2"><Users size={24} /> Users</h1><p className="text-sm text-gray-500">{filtered.length} users</p></div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-6 bg-white border rounded-xl p-4">
          <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, role…" className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none" /></div>
        </motion.div>

        {error && <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border rounded-xl p-4 flex items-center gap-2"><AlertCircle size={16} className="text-accent" /><span className="text-sm">{(error as Error).message}</span><button onClick={() => refetch()} className="ml-auto text-primary text-sm">Retry</button></motion.div>}

        {isLoading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-16" />)}</div> : (
          <motion.div variants={fadeUp} className="bg-white border rounded-xl overflow-hidden divide-y">
            {filtered.map(u => (
              <div key={u.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm">{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="font-medium text-sm truncate">{u.name}</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1"><Shield size={10} />{roleLabel(u.role)}</span>{!u.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}</div>
                  <div className="text-xs text-gray-400 truncate">{u.email} {u.phone ? `· ${u.phone}` : ''}</div>
                </div>
                <div className="flex gap-1"><button onClick={() => openEdit(u)} className="p-2 text-gray-400 hover:text-primary rounded-lg"><Edit3 size={14} /></button><button onClick={() => setDeletingId(u.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button></div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b flex items-center justify-between"><h2 className="font-semibold">Edit User — {editing.name}</h2><button onClick={() => setEditing(null)}><X size={18} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="text-xs text-gray-500">Role</label><select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white mt-1">{ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}</select></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Active</label>
              <div className="flex justify-end gap-2"><button onClick={() => setEditing(null)} className="px-4 py-2 text-sm">Cancel</button><button onClick={handleUpdate} disabled={updateMut.isPending} className="px-4 py-2 bg-primary text-white rounded-lg text-sm flex items-center gap-2"><Save size={14} />Update</button></div>
            </div>
          </div>
        </div>
      )}

      {deletingId != null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-semibold mb-2">Delete user?</h3><p className="text-sm text-gray-500 mb-6">This removes the user account. Use deactivate if you want to keep history.</p>
            <div className="flex justify-end gap-2"><button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm">Cancel</button><button onClick={() => deleteMut.mutate(deletingId, { onSuccess: () => { toast.success('Deleted'); setDeletingId(null) }, onError: (e: any) => toast.error(e.message) })} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Delete</button></div>
          </div>
        </div>
      )}
    </main>
  )
}
