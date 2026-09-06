/**
 * Motion Variants — Composed from tokens.
 *
 * These are the ONLY variants used in the dashboard.
 * Components import variants, never define their own.
 * This is the contract: if it moves, it uses these.
 */

import type { Variants, Transition } from 'motion/react'
import { ease, time, shift, opacity, spring, stagger as staggerToken } from './tokens'


// ════════════════════════════════════════════════════════════
// COMPOSED TRANSITIONS
// ════════════════════════════════════════════════════════════

export const trans = {
  /** Layout reflow — the primary spatial transition */
  layout: { type: 'spring', ...spring.layout } as Transition,
  /** Content entering view */
  enter: { duration: time.base, ease: ease.decelerate } as Transition,
  /** Content leaving view — don't linger */
  exit: { duration: time.fast, ease: ease.accelerate } as Transition,
  /** Immediate feedback — too fast to perceive as animation */
  micro: { duration: time.instant, ease: ease.standard } as Transition,
  /** Urgent — error, critical state change */
  urgent: { duration: time.fast, ease: ease.sharp } as Transition,
}


// ════════════════════════════════════════════════════════════
// PANEL VARIANTS
// ════════════════════════════════════════════════════════════
// For: metrics sidebar, event feed, dispatch panel, any card group

export const panel: Variants = {
  hidden: {
    opacity: opacity.hidden,
    y: shift.base,
  },
  visible: {
    opacity: opacity.visible,
    y: 0,
    transition: trans.enter,
  },
  exit: {
    opacity: opacity.hidden,
    y: -shift.tiny,
    transition: trans.exit,
  },
}


// ════════════════════════════════════════════════════════════
// ITEM VARIANTS
// ════════════════════════════════════════════════════════════
// For: metric cards, event rows, list items
// Parent MUST set staggerChildren via staggerContainer()

export const item: Variants = {
  hidden: {
    opacity: opacity.hidden,
    y: shift.base,
  },
  visible: {
    opacity: opacity.visible,
    y: 0,
    transition: trans.enter,
  },
  exit: {
    opacity: opacity.hidden,
    y: -shift.tiny,
    transition: trans.exit,
  },
}


// ════════════════════════════════════════════════════════════
// STAGGER CONTAINER
// ════════════════════════════════════════════════════════════
// Apply to parent. Children use `item` variants.

export const staggerContainer = (gap: number = staggerToken.base): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: gap,
      delayChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: gap * 0.5,
      staggerDirection: -1,
    },
  },
})


// ════════════════════════════════════════════════════════════
// FADE
// ════════════════════════════════════════════════════════════
// Pure opacity — no translation. For overlays, backdrop.

export const fadeIn: Variants = {
  hidden: { opacity: opacity.hidden },
  visible: {
    opacity: opacity.visible,
    transition: { duration: time.base, ease: ease.decelerate },
  },
  exit: {
    opacity: opacity.hidden,
    transition: { duration: time.fast, ease: ease.accelerate },
  },
}


// ════════════════════════════════════════════════════════════
// SLIDE + FADE
// ════════════════════════════════════════════════════════════
// Directional entrance for panels from any edge.

export const slideIn = (
  direction: 'left' | 'right' | 'up' | 'down' = 'up',
  distance: number = shift.large
): Variants => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y'
  const sign = direction === 'right' || direction === 'down' ? 1 : -1

  return {
    hidden: {
      opacity: opacity.hidden,
      [axis]: distance * sign,
    } as any,
    visible: {
      opacity: opacity.visible,
      [axis]: 0,
      transition: { duration: time.slow, ease: ease.decelerate },
    } as any,
    exit: {
      opacity: opacity.hidden,
      [axis]: -(distance * 0.5) * sign,
      transition: { duration: time.fast, ease: ease.accelerate },
    } as any,
  }
}


// ════════════════════════════════════════════════════════════
// SCALE POP
// ════════════════════════════════════════════════════════════
// For badges, notifications, buttons on press.
// Uses spring for physical "pop" feel.

export const scalePop: Variants = {
  hidden: {
    opacity: opacity.hidden,
    scale: 0.9,
  },
  visible: {
    opacity: opacity.visible,
    scale: 1,
    transition: { type: 'spring', ...spring.snap },
  },
  exit: {
    opacity: opacity.hidden,
    scale: 0.95,
    transition: { duration: time.fast, ease: ease.accelerate },
  },
}


// ════════════════════════════════════════════════════════════
// LAYOUT ORCHESTRATION
// ════════════════════════════════════════════════════════════
// For coordinating map expansion with panel collapse.
// The map and panels share a spring — they move as one system.

export const orchestratedLayout = {
  /** Spring shared between map and panels */
  spring: { type: 'spring' as const, ...spring.layout },

  /** Panels coordinate their exit with map entry */
  panelExit: {
    opacity: 0,
    scale: 0.97,
  },

  /** Panel enter coordinates with map settling */
  panelEnter: {
    opacity: 1,
    scale: 1,
  },
}


// ════════════════════════════════════════════════════════════
// PAGE-LEVEL FADE UP (PUBLIC PAGES)
// ════════════════════════════════════════════════════════════
// Larger y-shift and slower transition for public marketing pages.

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}


// ════════════════════════════════════════════════════════════
// DASHBOARD FADE UP (ADMIN / RIDER DASHBOARDS)
// ════════════════════════════════════════════════════════════
// Tighter y-shift and faster transition for dense dashboard UIs.

export const fadeUpTight: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export const staggerTight: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}


// ════════════════════════════════════════════════════════════
// ORDER STATUS CONFIG
// ════════════════════════════════════════════════════════════
// Shared across order list and order detail views.

import {
  Clock as ClockIcon,
  AlertCircle,
  Package,
  Bike,
  CheckCircle,
  XCircle,
  ShoppingBag,
} from 'lucide-react'

export const statusConfig: Record<string, { color: string; bg: string; icon: typeof ClockIcon; label: string }> = {
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: ClockIcon, label: 'Pending' },
  confirmed: { color: 'text-blue-600', bg: 'bg-blue-100', icon: AlertCircle, label: 'Confirmed' },
  retrying: { color: 'text-amber-600', bg: 'bg-amber-100', icon: ClockIcon, label: 'Finding Rider' },
  preparing: { color: 'text-indigo-600', bg: 'bg-indigo-100', icon: Package, label: 'Preparing' },
  // Pickup fulfilment only: order packed, waiting at the store for collection.
  ready: { color: 'text-orange-600', bg: 'bg-orange-100', icon: ShoppingBag, label: 'Ready for Pickup' },
  out_for_delivery: { color: 'text-purple-600', bg: 'bg-purple-100', icon: Bike, label: 'Out for Delivery' },
  delivered: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle, label: 'Cancelled' },
}

export const paymentStatusConfig: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Pending' },
  paid: { color: 'text-green-600', bg: 'bg-green-100', label: 'Paid' },
  refunded: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Refunded' },
}
