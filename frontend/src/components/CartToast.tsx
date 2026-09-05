'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { onCartAdded, type CartAddedEvent } from '@/lib/cart-events'

/**
 * Confirmation for "added to cart", shown where the user is looking (bottom
 * centre, thumb zone) — the header badge is off-screen on a phone grid.
 * Mirrors the CartDrawer undo-toast's visual language so the same kind of
 * moment looks the same everywhere. Announced politely to screen readers via
 * the aria-live region; auto-dismisses after 2.5s, re-arming on every add.
 */
export default function CartToast() {
  const [event, setEvent] = useState<CartAddedEvent | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const off = onCartAdded((e) => {
      setEvent(e)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setEvent(null), 2500)
    })
    return () => {
      off()
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div aria-live="polite" role="status">
      <AnimatePresence>
        {/* Centre via motion's x (not the Tailwind class): motion writes the
            element's inline transform, which would clobber a class-based
            translate and leave the toast off-centre. */}
        {event && (
          <motion.div
            key={event.at}
            initial={{ y: 40, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 40, opacity: 0, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 z-[60] flex items-center gap-3 bg-gray-900 text-white pl-3 pr-2 py-2 rounded-lg shadow-lg text-sm whitespace-nowrap max-w-[calc(100vw-2rem)]"
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-success text-white shrink-0" aria-hidden="true">
              <Check size={14} strokeWidth={2.5} />
            </span>
            <span className="truncate">
              Added <span className="font-semibold">{event.name}</span>
              {event.quantity > 1 && <span> ×{event.quantity}</span>}
            </span>
            <Link
              href="/cart"
              className="font-semibold underline underline-offset-2 hover:opacity-80 shrink-0 px-1 py-1"
              style={{ color: '#EB6522' }}
            >
              View
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
