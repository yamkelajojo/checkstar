'use client'

import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { useDialogFocus } from '@/hooks/useDialogFocus'

/**
 * Admin modal — the one way admin dialogs are built.
 *
 * - Portals to <body>: hand-rolled admin modals were previously rendered
 *   inside animated (transformed) ancestors, where `position: fixed` is
 *   scoped to the transform and the overlay can land in the wrong place.
 * - Accessible: role=dialog, aria-modal, labelled by its title, and the shared
 *   `useDialogFocus` behaviour — Esc closes, focus moves in on open and returns
 *   to the trigger on close, Tab is trapped inside.
 * - Respects prefers-reduced-motion (no scale/fade choreography).
 */

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Optional sticky action bar (Cancel / Save). */
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const shouldReduce = useReducedMotion()
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus in, Tab trap, Escape, focus restore, scroll lock — shared with the
  // storefront's CartDrawer and AuthRequiredModal so the two halves of the app
  // cannot drift apart on dialog behaviour.
  useDialogFocus({ open, onClose, panelRef })

  const width = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-3xl' : 'max-w-md'

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-black/40"
            initial={shouldReduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className={`relative bg-white rounded-2xl shadow-xl w-full ${width} max-h-[90vh] overflow-y-auto outline-none`}
            initial={shouldReduce ? false : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduce ? undefined : { opacity: 0, scale: 0.98, y: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          >
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1.5 -m-1.5 text-gray-400 hover:text-gray-600 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
            {footer && (
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
