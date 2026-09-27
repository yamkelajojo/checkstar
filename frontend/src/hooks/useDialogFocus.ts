'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Keyboard and focus behaviour for anything that acts like a dialog.
 *
 * `admin/Modal.tsx` was the only place this existed, and it was right: focus
 * moves in on open, Tab is trapped, Escape closes, focus returns to the trigger,
 * body scroll is locked. `CartDrawer.tsx` is a modal in everything but name and
 * only had Escape — opening the cart left focus on the page behind the overlay
 * and Tab walked out of the drawer entirely. Both now share this hook, so the
 * storefront and the admin console cannot drift apart on accessibility.
 *
 * Deliberately does not render anything or own the markup: the component keeps
 * `role="dialog"`, `aria-modal` and its own label. This is the behaviour only.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface DialogFocusOptions {
  /** Whether the dialog is on screen. Nothing happens while this is false. */
  open: boolean
  /** Called on Escape. The latest value is always used (see below). */
  onClose: () => void
  /** The dialog element; focus is trapped inside it. Give it `tabIndex={-1}`
   *  so it can receive focus when it holds no controls. */
  panelRef: RefObject<HTMLElement | null>
  /** Where to put focus on open. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Lock body scroll while open (default true). A drawer that shares the
   *  page's scrollbar can opt out. */
  lockScroll?: boolean
}

export function useDialogFocus({
  open,
  onClose,
  panelRef,
  initialFocusRef,
  lockScroll = true,
}: DialogFocusOptions): void {
  // Callers pass an inline arrow (`onClose={() => setOpen(false)}`). Depending on
  // that identity would re-run the effect on every parent render, re-stealing
  // focus mid-typing and firing a spurious restore. Keep the callback in a ref
  // so the effect only re-runs when the dialog actually opens or closes.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusables = (): HTMLElement[] =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : []

    const target = initialFocusRef?.current ?? focusables()[0] ?? panel
    target?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // stopPropagation keeps a nested dialog's handler from also firing.
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return

      const items = focusables()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
      // Anywhere in between: let the browser keep its native order.
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    if (lockScroll) document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (lockScroll) document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open, panelRef, initialFocusRef, lockScroll])
}
