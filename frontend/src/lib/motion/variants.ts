/**
 * Motion Variants — Composed from tokens.
 *
 * These are the ONLY variants used in the dashboard.
 * Components import variants, never define their own.
 * This is the contract: if it moves, it uses these.
 */

import type { Variants, Transition } from 'motion/react'
import { ease, time, shift, opacity, spring, stagger } from './tokens'


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

export const staggerContainer = (gap: number = stagger.base): Variants => ({
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
