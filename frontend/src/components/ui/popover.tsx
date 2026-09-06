'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * Popover — vendored from cult-ui's headless motion popover (MIT), adapted
 * to this project's palette and dependencies. Composable sub-components:
 *
 *   <PopoverRoot>
 *     <PopoverTrigger>Open</PopoverTrigger>
 *     <PopoverContent>
 *       <PopoverHeader>Title</PopoverHeader>
 *       <PopoverBody>…</PopoverBody>
 *       <PopoverFooter><PopoverCloseButton /></PopoverFooter>
 *     </PopoverContent>
 *   </PopoverRoot>
 *
 * Root can be controlled (`open` + `onOpenChange`) or uncontrolled.
 * Closes on Escape and outside click. Content anchors below the trigger.
 */

interface PopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  contentId: string
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

function usePopoverContext(): PopoverContextValue {
  const ctx = useContext(PopoverContext)
  if (!ctx) throw new Error('Popover sub-components must be used inside <PopoverRoot>')
  return ctx
}

interface PopoverRootProps {
  children: React.ReactNode
  className?: string
  /** Controlled open state. */
  open?: boolean
  /** Called on every open/close request (both controlled and uncontrolled). */
  onOpenChange?: (open: boolean) => void
}

function PopoverRoot({ children, className, open: controlledOpen, onOpenChange }: PopoverRootProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const contentId = React.useId()

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [controlledOpen, onOpenChange],
  )

  return (
    <PopoverContext.Provider value={{ open, setOpen, contentId }}>
      <span className={cn('relative inline-flex', className)}>{children}</span>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

function PopoverTrigger({ children, className, onClick, ...rest }: PopoverTriggerProps) {
  const { open, setOpen, contentId } = usePopoverContext()
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={contentId}
      onClick={(e) => {
        onClick?.(e)
        setOpen(!open)
      }}
      className={cn('cursor-pointer', className)}
      {...rest}
    >
      {children}
    </button>
  )
}

const POPOVER_TRANSITION = {
  type: 'spring' as const,
  stiffness: 340,
  damping: 26,
  mass: 0.9,
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
  /** Side of the trigger the popover opens on. */
  align?: 'left' | 'right'
}

function PopoverContent({ children, className, align: alignProp = 'left' }: PopoverContentProps) {
  const { open, setOpen, contentId } = usePopoverContext()
  const rootRef = useRef<HTMLDivElement>(null)
  const [alignResolved, setAlignResolved] = useState<'left' | 'right'>(alignProp)

  // Collision check on open: the popover is anchored inside the page flow
  // (no portal), so if the anchor sits within one content-width of the
  // viewport's right edge we flip the panel to the trigger's right side.
  // `align` still acts as an explicit override when passed.
  useEffect(() => {
    if (!open) return
    const anchor = rootRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const estimatedWidth = 300
    const overflowsRight = rect.right + estimatedWidth > window.innerWidth - 12
    const fitsLeft = rect.left - estimatedWidth > 12
    setAlignResolved(overflowsRight && fitsLeft ? 'right' : alignProp)
  }, [open, alignProp])

  // Escape closes; outside pointerdown closes.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={rootRef}
          id={contentId}
          role="dialog"
          aria-modal="false"
          initial={{ opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={POPOVER_TRANSITION}
          className={cn(
            'absolute top-[calc(100%+8px)] z-50 block w-64 rounded-xl bg-white p-3 text-left shadow-xl ring-1 ring-gray-100 max-w-[calc(100vw-2.5rem)]',
            alignResolved === 'left' ? 'left-0' : 'right-0',
            className,
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PopoverHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-2 font-semibold text-gray-900', className)}>{children}</div>
}

function PopoverBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-sm text-gray-600', className)}>{children}</div>
}

function PopoverFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-3 flex items-center justify-between gap-2', className)}>{children}</div>
}

function PopoverCloseButton({ className }: { className?: string }) {
  const { setOpen } = usePopoverContext()
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={() => setOpen(false)}
      className={cn(
        'ml-auto flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors',
        className,
      )}
    >
      <X size={13} />
    </button>
  )
}

interface PopoverButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

function PopoverButton({ children, className, onClick, ...rest }: PopoverButtonProps) {
  const { setOpen } = usePopoverContext()
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e)
        setOpen(false)
      }}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverCloseButton,
  PopoverButton,
}
