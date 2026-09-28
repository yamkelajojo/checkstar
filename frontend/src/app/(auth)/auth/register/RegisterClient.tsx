'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react'
import PasswordField from '@/components/PasswordField'
import SocialSignUpButtons from '@/components/SocialSignUpButtons'
import { useAuthStore } from '@/stores/auth-store'

export default function RegisterClient() {
  const router = useRouter()
  const { isAuthenticated, register, checkAuth } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated) router.push('/')
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register({ name, email, password, password_confirmation: passwordConfirmation, phone: phone || undefined })
    } catch (err: any) {
      if (err.message && typeof err.message === 'object') {
        setErrors(err.message)
      } else {
        setError(err.message || 'Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <main className="max-w-md mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-2 text-center">Create your account</h1>
          <p className="text-gray-500 text-center mb-8">Join Checkstar and start shopping.</p>

          <div className="mb-6">
            <SocialSignUpButtons />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-name" type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="John Doe" />
              </div>
              {errors.name?.map((msg, i) => <p key={i} className="text-xs text-accent mt-1">{msg}</p>)}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="you@example.com" />
              </div>
              {errors.email?.map((msg, i) => <p key={i} className="text-xs text-accent mt-1">{msg}</p>)}
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="+27 12 345 6789" />
              </div>
            </div>

            <div>
              <PasswordField
                id="reg-password"
                label="Password"
                value={password}
                onChange={setPassword}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                showIcon
              />
              {errors.password?.map((msg, i) => <p key={i} className="text-xs text-accent mt-1">{msg}</p>)}
            </div>

            <div>
              <label htmlFor="reg-password-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input id="reg-password-confirm" type="password" required value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none" placeholder="Repeat password" />
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Account'}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </>
  )
}
