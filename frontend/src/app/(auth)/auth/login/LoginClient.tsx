'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { Mail } from 'lucide-react'
import { ease, time } from '@/lib/motion/tokens'
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
    // `!loading` keeps the redirect parked until the submit handler's
    // minimum loader window has played out — otherwise the page would
    // navigate instantly and the transition would never be visible.
    if (isAuthenticated && user && !loading) {
      if (redirectTo) {
        router.push(redirectTo)
        return
      }
      const role = user.role
      if (role === 'rider') router.push('/rider/dashboard')
      else if (role === 'store_owner' || role === 'store_manager' || role === 'logistics_officer' || role === 'developer') router.push('/admin/dashboard')
      else router.push('/')
    }
  }, [isAuthenticated, user, loading, router, redirectTo])

  // The Sign In → loader swap must be SEEN, not just computed: when the API
  // answers faster than the eye can register the transition (e.g. the mock
  // API answers in a few ms), hold the loading state for a minimum window so
  // the label exit and loader entry always play in full — no hovering or
  // timing luck required. Real, slow APIs simply eat into the window.
  const MIN_LOADER_MS = 1200

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const startedAt = Date.now()
    try {
      await login(email, password)
      const remaining = MIN_LOADER_MS - (Date.now() - startedAt)
      if (remaining > 0) await new Promise((r) => setTimeout(r, remaining))
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
            {/* The lockup is a way home. Extra room below it: the "cares
                enough" tagline sits absolutely under the wordmark, so the
                heading needs breathing space to clear it. */}
            <Link href="/" aria-label="Checkstar — back to the homepage" className="block mb-9 transition-opacity hover:opacity-80">
              <Logo variant="lockup" size={40} tone="dark" />
            </Link>
            <h1 className="font-display text-3xl font-bold mb-2 text-center">Welcome back</h1>
            <p className="text-gray-500 text-center">Sign in to your Checkstar account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Failed attempts slide open and closed with the rest of the
                page's motion language — no layout jump, no hard pop. */}
            <AnimatePresence initial={false}>
              {error && (
                <motion.div
                  key="login-error"
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  transition={{ duration: time.base, ease: ease.apple }}
                  className="overflow-hidden"
                >
                  <div role="alert" className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* Fixed-size button with two stacked layers driven directly by
                `animate` (no AnimatePresence exit timing to miss): the
                "Sign In" label fades/slides away the instant loading starts,
                and the loading layer shows ONLY the Checkstar loader — no
                loading label text, per design. The button never resizes. */}
            <motion.button
              type="submit" disabled={loading}
              whileTap={{ scale: 0.98 }}
              aria-busy={loading}
              aria-label={loading ? 'Signing in' : undefined}
              className="relative w-full h-12 overflow-hidden bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:cursor-default flex items-center justify-center"
            >
              <motion.span
                aria-hidden={loading || undefined}
                animate={loading ? { opacity: 0, y: -12 } : { opacity: 1, y: 0 }}
                transition={{ duration: time.fast, ease: ease.apple }}
                className="absolute inset-0 flex items-center justify-center"
              >
                Sign In
              </motion.span>
              <motion.span
                aria-hidden={!loading || undefined}
                animate={loading ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{ duration: time.fast, ease: ease.apple }}
                className="flex items-center justify-center"
              >
                <Loader className="h-6 w-20" />
              </motion.span>
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
