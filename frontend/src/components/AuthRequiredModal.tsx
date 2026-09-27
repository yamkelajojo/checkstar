'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { X, Lock, Smartphone } from 'lucide-react'
import { useDialogFocus } from '@/hooks/useDialogFocus'

interface AuthRequiredModalProps {
  open: boolean
  onClose: () => void
  /** Where to return after signing in (defaults to the cart). */
  redirectTo?: string
}

const ease: [number, number, number, number] = [0.4, 0.01, 0.165, 0.99]

/**
 * Gentle, animated gate for guests reaching checkout. Replaces the old
 * amber "session has expired" banner: checkout requires an account, so say
 * so kindly, offer sign-in / registration, and mention the app.
 */
export default function AuthRequiredModal({ open, onClose, redirectTo = '/cart' }: AuthRequiredModalProps) {
  const shouldReduceMotion = useReducedMotion()

  // This is the gate every guest hits at checkout, so it gets the same dialog
  // behaviour as the admin Modal and the cart drawer: focus in, Tab trap,
  // Escape, focus restore, scroll lock.
  const panelRef = useRef<HTMLDivElement>(null)
  // Land on the way forward, not on the dismiss button: the first focusable
  // element in the card is the close control, which is the wrong place to drop
  // a guest who was trying to check out.
  const signInRef = useRef<HTMLAnchorElement>(null)
  useDialogFocus({ open, onClose, panelRef, initialFocusRef: signInRef })

  const loginHref = `/auth/login?redirect=${encodeURIComponent(redirectTo)}`

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="auth-required-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.2, ease }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-4 outline-none"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-required-title"
          tabIndex={-1}
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.96 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.97 }}
            transition={shouldReduceMotion ? { duration: 0.12 } : { type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={shouldReduceMotion ? undefined : { scale: 0.6, opacity: 0 }}
                animate={shouldReduceMotion ? undefined : { scale: 1, opacity: 1 }}
                transition={shouldReduceMotion ? undefined : { type: 'spring', stiffness: 320, damping: 18, delay: 0.08 }}
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
              >
                <Lock size={22} className="text-primary" />
              </motion.div>

              <h2 id="auth-required-title" className="font-display text-xl font-bold text-gray-900">
                Sign in to check out
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                You&apos;re browsing as a guest. Create a free Checkstar account or sign in to place your
                order — it only takes a few seconds.
              </p>

              <div className="mt-6 flex w-full flex-col gap-2.5">
                <Link
                  ref={signInRef}
                  href={loginHref}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Create an account
                </Link>
              </div>

              <div className="mt-5 w-full border-t border-gray-100 pt-4">
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                  <Smartphone size={14} className="text-gray-400" />
                  Prefer your phone? Get the Checkstar app.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <a
                    href="https://apps.apple.com/app/checkstar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    App Store
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.checkstar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-gray-900 px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Google Play
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
