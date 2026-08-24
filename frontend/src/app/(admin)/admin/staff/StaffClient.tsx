'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Users, UserPlus, UserMinus, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

export default function StaffClient() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, user, checkAuth } = useAuthStore()
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('store_manager')
  const [storeId, setStoreId] = useState('')
  const [staffId, setStaffId] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [submitting, setSubmitting] = useState<'hire' | 'fire' | null>(null)

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login')
  }, [authLoading, isAuthenticated, router])

  if (authLoading) {
    return <main className="max-w-4xl mx-auto px-4 py-20 text-center"><Loader2 size={32} className="animate-spin mx-auto text-primary" /></main>
  }

  if (user && !['store_owner', 'developer'].includes(user.role)) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={32} className="mx-auto text-accent mb-4" />
        <h1 className="text-xl font-semibold">Store Owner only</h1>
        <p className="text-sm text-gray-500 mt-2">Hire/fire requires Store Owner or Developer (StoreContext resolves store).</p>
      </main>
    )
  }

  const handleHire = async () => {
    if (!userId) { setFeedback({ type: 'error', text: 'user_id required' }); return }
    setSubmitting('hire')
    setFeedback(null)
    try {
      const res = await api.hireStaff(Number(userId), role, storeId ? Number(storeId) : undefined)
      setFeedback({ type: 'success', text: `Hired — assignment ${JSON.stringify((res as { data: { id: number } }).data?.id ?? res)}` })
    } catch (e: unknown) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Hire failed' })
    } finally { setSubmitting(null) }
  }

  const handleFire = async () => {
    if (!staffId) { setFeedback({ type: 'error', text: 'staff assignment ID required' }); return }
    setSubmitting('fire')
    setFeedback(null)
    try {
      await api.fireStaff(Number(staffId), storeId ? Number(storeId) : undefined)
      setFeedback({ type: 'success', text: `Fired assignment #${staffId} — access revoked immediately` })
    } catch (e: unknown) {
      setFeedback({ type: 'error', text: e instanceof Error ? e.message : 'Fire failed' })
    } finally { setSubmitting(null) }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-2"><Users size={24} /> Store Staff</h1>
        <p className="text-sm text-gray-500 mb-6">StoreContext resolves which Store you act on — Owner’s owned Store, Staff assignment, or Developer explicit <code className="bg-gray-100 px-1 rounded">store_id</code>. Fired staff lose access immediately.</p>

        {feedback && <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${feedback.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-accent/10 border border-accent/20 text-accent'}`}>{feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {feedback.text}</div>}

        {(user?.role === 'developer') && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className="block text-xs font-medium text-amber-800 mb-1">Developer store_id (explicit)</label>
            <input value={storeId} onChange={e => setStoreId(e.target.value)} placeholder="Store ID" className="w-32 px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3"><UserPlus size={18} /> Hire</h2>
            <div className="space-y-3">
              <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="User ID to hire" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none">
                <option value="store_manager">store_manager</option>
                <option value="logistics_officer">logistics_officer</option>
              </select>
              <button onClick={handleHire} disabled={submitting === 'hire'} className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting === 'hire' ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />} Hire
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">Creates StoreStaff assignment through StoreContext.</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-3"><UserMinus size={18} /> Fire</h2>
            <div className="space-y-3">
              <input value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="Assignment ID to remove" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none" />
              <button onClick={handleFire} disabled={submitting === 'fire'} className="w-full px-4 py-2 border border-accent/30 text-accent rounded-lg text-sm font-medium hover:bg-accent/5 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting === 'fire' ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />} Fire
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">Deletes assignment; auth checks respect removal immediately.</p>
          </div>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500">
          Uses <code className="bg-white px-1 py-0.5 rounded border">StoreContext::resolve</code> — no inline role-to-store logic in controllers.
        </div>
      </motion.div>
    </main>
  )
}
