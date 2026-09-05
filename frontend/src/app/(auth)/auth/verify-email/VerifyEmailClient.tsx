'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

/**
 * Landing page for the signed verification links in emails. The email links
 * here with the signed API query (expires + signature) intact; the API call
 * replays the exact signed URL so Laravel's signature middleware validates it.
 */
export default function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<'verifying' | 'success' | 'invalid'>('verifying')
  const [message, setMessage] = useState('')
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const id = searchParams.get('id')
    const hash = searchParams.get('hash')
    const expires = searchParams.get('expires')
    const signature = searchParams.get('signature')

    if (!id || !hash || !expires || !signature) {
      setState('invalid')
      setMessage('This verification link is incomplete.')
      return
    }

    api
      .verifyEmail(id, hash, { expires, signature })
      .then(res => {
        setState('success')
        setMessage(res.message || 'Email verified successfully.')
      })
      .catch((err: unknown) => {
        setState('invalid')
        const reason = err instanceof Error ? err.message : ''
        setMessage(reason || 'This verification link is invalid or has expired.')
      })
  }, [searchParams])

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        {state === 'verifying' && (
          <>
            <Loader2 size={56} className="mx-auto text-primary animate-spin mb-6" />
            <h1 className="font-display text-3xl font-bold mb-2">Verifying your email…</h1>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 size={56} className="mx-auto text-success mb-6" />
            <h1 className="font-display text-3xl font-bold mb-2">Email verified</h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Start shopping
            </Link>
          </>
        )}
        {state === 'invalid' && (
          <>
            <XCircle size={56} className="mx-auto text-accent mb-6" />
            <h1 className="font-display text-3xl font-bold mb-2">Link not valid</h1>
            <p className="text-gray-500 mb-8">{message}</p>
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Back to login
            </Link>
          </>
        )}
      </motion.div>
    </main>
  )
}
