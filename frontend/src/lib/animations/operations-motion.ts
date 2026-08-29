/**
 * Operations Dashboard — Motion system.
 * Braun minimalism: motion is functional, never decorative.
 * ~200ms durations, tight staggers, clean deceleration.
 */

import type { Variants } from 'motion/react'

// ── Easing ──────────────────────────────────────────────────
// Apple-style deceleration: fast start, smooth stop
export const ease = {
  out: [0.25, 0.1, 0.25, 1] as const,
  sharp: [0.4, 0, 0, 1] as const,
}

// ── Timing ──────────────────────────────────────────────────
// Braun: 200ms is the ceiling for UI motion
export const dur = {
  fast: 0.12,
  base: 0.2,
  slow: 0.3,
}

// ── Spring ──────────────────────────────────────────────────
export const spring = {
  layout: { type: 'spring' as const, stiffness: 400, damping: 32, mass: 0.7 },
  snap: { type: 'spring' as const, stiffness: 600, damping: 40 },
}

// ── Shared transition ───────────────────────────────────────
export const t = {
  layout: { ...spring.layout, duration: dur.base },
  panel: { duration: dur.base, ease: ease.out },
  fast: { duration: dur.fast, ease: ease.out },
}

// ── Panel ───────────────────────────────────────────────────
export const panel: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, y: -4, transition: { duration: dur.fast, ease: ease.sharp } },
}

// ── Stagger container ───────────────────────────────────────
// 40ms between children — perceptible as sequence, not sluggish
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
}

// ── Child item (metrics, events) ────────────────────────────
export const item: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, y: -4, transition: { duration: dur.fast, ease: ease.sharp } },
}

// ── Number count-up ─────────────────────────────────────────
export const countUp: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: dur.fast } },
}
