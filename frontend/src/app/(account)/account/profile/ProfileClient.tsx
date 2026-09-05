'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { User, Mail, Phone, Loader2, Save, CheckCircle, MailCheck } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { api } from '@/lib/api'

export default function ProfileClient() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, checkAuth, user, setUser } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [emailChanged, setEmailChanged] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }
    if (!authLoading && isAuthenticated && user && !loaded) {
      setName(user.name)
      setEmail(user.email)
      setPhone(user.phone || '')
      setLoaded(true)
    }
  }, [authLoading, isAuthenticated, user, router, loaded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      const previousEmail: string | undefined = user?.email
      const updated = await api.updateProfile({ name, email, phone: phone || undefined })
      setUser(updated as any)
      // The backend resets verification and mails a fresh link when the
      // address changes — say so, or the user thinks nothing happened.
      setEmailChanged(previousEmail !== undefined && email.toLowerCase() !== previousEmail.toLowerCase())
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-20 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-primary" />
        </main>
      </>
    )
  }

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-8">My Profile</h1>

          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
              <div className="w-14 h-14 bg-primary-light rounded-full flex items-center justify-center">
                <User size={24} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.name}</p>
                <p className="text-sm text-gray-400 capitalize">{user?.role?.replace(/_/g, ' ')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">{error}</div>
              )}

              {success && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                  <CheckCircle size={16} /> Profile updated successfully.
                </motion.div>
              )}

              {success && emailChanged && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="verify-notice" className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                  <MailCheck size={16} /> We&apos;ve sent a verification link to your new email address.
                </motion.div>
              )}

              <div>
                <label htmlFor="profile-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="profile-name" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>

              <div>
                <label htmlFor="profile-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="profile-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>

              <div>
                <label htmlFor="profile-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input id="profile-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="+27 12 345 6789" />
                </div>
              </div>

              <motion.button
                type="submit" disabled={saving}
                whileTap={{ scale: 0.98 }}
                className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  )
}
