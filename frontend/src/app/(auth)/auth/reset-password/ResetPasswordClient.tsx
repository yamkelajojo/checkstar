'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Loader } from '@/components/Loader'
import PasswordField from '@/components/PasswordField'
import { api, ApiError } from '@/lib/api'

export default function ResetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const missingToken = !token || !email

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await api.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      setDone(true)
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 422) {
        setError(err.message || 'Please choose a stronger password.')
      } else {
        setError(err.message || 'Invalid or expired reset link. Please request a new one.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (missingToken) {
    return (
      <main className="max-w-md mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl font-bold mb-2">Reset password</h1>
          <p className="text-gray-500 mb-8">This reset link is invalid or incomplete.</p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Request a new link <ArrowRight size={16} />
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2 text-center">Reset password</h1>
        <p className="text-gray-500 text-center mb-8">Choose a new password for {email}.</p>

        {done ? (
          <div className="text-center">
            <div className="bg-success/10 border border-success/30 text-success text-sm rounded-lg px-4 py-3 mb-6">
              Your password has been reset. All existing sessions have been logged out.
            </div>
            <button
              onClick={() => router.push('/auth/login')}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Go to login <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-accent/10 border border-accent/30 text-accent text-sm rounded-lg px-4 py-3">
                {error}
              </motion.div>
            )}

            <PasswordField
              id="password"
              label="New password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              showIcon
            />

            <PasswordField
              id="password-confirmation"
              label="Confirm new password"
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              minLength={8}
              showIcon
            />

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <Loader tone="light" /> : <>Reset password <ArrowRight size={16} /></>}
            </button>
          </form>
        )}
      </motion.div>
    </main>
  )
}
