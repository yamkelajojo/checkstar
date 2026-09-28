'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { Mail } from 'lucide-react'
import { Loader } from '@/components/Loader'
import { Logo } from '@/components/Logo'
import PasswordField from '@/components/PasswordField'
import { useAuthStore } from '@/stores/auth-store'

export default function LoginClient() {
  const router = useRouter()
  const { isAuthenticated, user, login, checkAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  // Only allow same-app relative redirects (no open-redirect via //evil.com or absolute URLs).
  const rawRedirect = searchParams.get('redirect')
  const redirectTo = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : null

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isAuthenticated && user) {
      if (redirectTo) {
        router.push(redirectTo)
        return
      }
      const role = user.role
      if (role === 'rider') router.push('/rider/dashboard')
      else if (role === 'store_owner' || role === 'store_manager' || role === 'logistics_officer' || role === 'developer') router.push('/admin/dashboard')
      else router.push('/')
    }
  }, [isAuthenticated, user, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Vertically centered card on the viewport (minus the sticky header) */}
      <main className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            {/* Extra room below the lockup: the "cares enough" tagline sits
                absolutely under the wordmark, so the heading needs breathing
                space to clear it. */}
            <Logo variant="lockup" size={40} tone="dark" className="mb-9" />
            <h1 className="font-display text-3xl font-bold mb-2 text-center">Welcome back</h1>
            <p className="text-gray-500 text-center">Sign in to your Checkstar account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">
                {error}
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <PasswordField
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="********"
              showIcon
            />

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="h-8 w-24" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 space-y-2">
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">Register here</Link>
            </p>
            <p>
              Want to deliver?{' '}
              <Link href="/auth/register/rider" className="text-primary font-medium hover:underline">Become a Rider</Link>
            </p>
          </div>
        </motion.div>
      </main>
    </>
  )
}
