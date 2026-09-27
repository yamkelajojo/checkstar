'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { roleLabel } from '@/lib/labels'
import { useStores } from '@/lib/query'
import { toast } from 'sonner'
import { Users, UserPlus, ShieldCheck, ShieldX, Loader2, Trash2, AlertCircle, RefreshCw, Store as StoreIcon, Lock } from 'lucide-react'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'

interface StaffMember {
  id: number
  role: string
  store_id: number
  created_at: string
  user: { id: number; name: string; email: string }
}

const STAFF_ROLES = ['store_manager', 'logistics_officer'] as const

/** Role wording comes from the shared vocabulary — sentence case, one place. */
const prettyRole = (role: string) => roleLabel(role)

export default function StaffClient() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>(STAFF_ROLES[0])
  const [storeId, setStoreId] = useState<string>('')
  const [hireError, setHireError] = useState<string | null>(null)

  // Gate mirrors the backend route group exactly (role:store_owner,developer).
  // Managers must NOT see a staff UI the API would 403.
  const canManage = user?.role === 'store_owner' || user?.role === 'developer'

  const { data: stores = [] } = useStores()
  const activeStoreId = storeId || (stores.length ? String((stores[0] as { id: number }).id) : '')

  const { data: staff, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['staff', activeStoreId],
    queryFn: () => api.listStaff(activeStoreId ? Number(activeStoreId) : undefined),
    enabled: canManage,
  })

  const hireMutation = useMutation({
    meta: { silent: true }, // inline error surface in the hire form
    mutationFn: (payload: { email: string; role: string; store_id?: number }) =>
      api.hireStaff(payload.email, payload.role, payload.store_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      setName('')
      setEmail('')
      setHireError(null)
      toast.success('Team member added')
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not add team member'
      setHireError(message)
      toast.error(message)
    },
  })

  const removeMutation = useMutation({
    meta: { silent: true }, // roster has no global surface; toast fired locally
    mutationFn: (id: number) => api.fireStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      toast.success('Access revoked')
    },
    onError: () => toast.error('Could not revoke access'),
  })

  const handleHire = async (e: React.FormEvent) => {
    e.preventDefault()
    setHireError(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName || !trimmedEmail) {
      setHireError('Name and email are both required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setHireError('Enter a valid email address')
      return
    }

    // The backend resolves the account by email; the mock API derives a
    // deterministic user_id from the address for the same contract.
    hireMutation.mutate({
      email: trimmedEmail,
      role: selectedRole,
      store_id: activeStoreId ? Number(activeStoreId) : undefined,
    })
  }

  if (!canManage) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-rose-500" />
        </div>
        <h1 className="text-xl font-semibold">Staff access only</h1>
        <p className="text-sm text-gray-500 mt-2">
          Only store owners and platform developers can manage team access. Ask an owner to grant you access.
        </p>
        <Link href="/account" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-4">
          Go to My Account
        </Link>
      </main>
    )
  }

  // listStaff resolves to the { data: [...] } envelope — unwrap defensively.
  const members: StaffMember[] = Array.isArray(staff)
    ? (staff as StaffMember[])
    : ((staff as { data?: StaffMember[] } | undefined)?.data ?? [])

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Store Staff</h1>
          <p className="text-gray-500 text-sm">Hire team members and manage their store access.</p>
        </motion.div>

        {/* Hire form */}
        <motion.form
          variants={fadeUp}
          onSubmit={handleHire}
          className="bg-white border border-gray-100 rounded-xl p-5 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
              <UserPlus size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">Add a team member</h2>
              <p className="text-xs text-gray-400">They get store-scoped access — never platform-admin rights.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="name@company.co.za"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{prettyRole(r)}</option>
              ))}
            </select>
          </div>

          {stores.length > 1 && (
            <select
              value={activeStoreId}
              onChange={(e) => setStoreId(e.target.value)}
              className="mt-3 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {stores.map((s) => (
                <option key={(s as { id: number }).id} value={(s as { id: number }).id}>
                  {(s as { name: string }).name}
                </option>
              ))}
            </select>
          )}

          {hireError && (
            <p className="mt-3 text-sm text-accent flex items-center gap-1.5">
              <AlertCircle size={14} /> {hireError}
            </p>
          )}

          <button
            type="submit"
            disabled={hireMutation.isPending}
            className="mt-4 inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
          >
            {hireMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
            Add member
          </button>
        </motion.form>

        {/* Roster */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold">Team roster</h2>
            {isFetching && !isLoading && <Loader2 size={14} className="animate-spin text-gray-300" />}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="animate-pulse flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100" />
                    <div className="space-y-2 flex-1">
                      <div className="h-3.5 w-36 bg-gray-100 rounded" />
                      <div className="h-3 w-48 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-accent shrink-0" />
              <p className="text-sm text-gray-600">{(error as Error).message}</p>
              <button onClick={() => refetch()} className="ml-auto text-primary text-sm font-medium hover:underline flex items-center gap-1">
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          ) : members.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-10 text-center">
              <StoreIcon size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="font-medium text-gray-500 text-sm">No team members yet</p>
              <p className="text-xs text-gray-400 mt-1">Add your first manager or logistics officer above.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {member.user.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900 truncate">{member.user.name}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${member.role === 'store_manager' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {prettyRole(member.role)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{member.user.email}</p>
                  </div>
                  {member.role === 'store_owner' ? (
                    <span className="flex items-center gap-1 text-[11px] text-gray-300 shrink-0" title="Owners cannot be removed here">
                      <ShieldCheck size={13} /> Owner
                    </span>
                  ) : (
                    <button
                      onClick={() => removeMutation.mutate(member.id)}
                      disabled={removeMutation.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-60 shrink-0"
                    >
                      {removeMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-[11px] text-gray-300 flex items-center gap-1.5">
            <ShieldX size={12} />
            Revoking removes store access immediately. The teammate keeps their customer account.
          </p>
        </motion.div>
      </motion.div>
    </main>
  )
}
