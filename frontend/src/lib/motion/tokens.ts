/**
 * Motion Tokens — The physics and timing foundation.
 *
 * Built from:
 * - Hooke's law spring simulation (physicist)
 * - Penner's easing curves, refined (animator)
 * - Braun/Apple material feel (industrial designer)
 * - Spatial communication rules (UX designer)
 *
 * Every number here has a reason. Nothing is arbitrary.
 */

// ════════════════════════════════════════════════════════════
// SPRING PHYSICS
// ════════════════════════════════════════════════════════════
// Real springs: F = -kx - cv
// Damping ratio ζ = c / 2√(mk)
//   ζ < 1  → underdamped (overshoots, oscillates)
//   ζ = 1  → critically damped (fastest settle, no overshoot)
//   ζ > 1  → overdamped (sluggish)
//
// We use ζ ≈ 0.7–0.85 for UI — slight overshoot feels alive
// but settles fast. Physics, not decoration.

export interface SpringConfig {
  stiffness: number   // k — restoring force (higher = faster)
  damping: number     // c — friction (higher = less oscillation)
  mass: number        // m — inertia (higher = slower response)
}

function criticalDamping(k: number, m: number): number {
  return 2 * Math.sqrt(m * k)
}

/** Compute damping ratio from spring params */
export function dampingRatio(s: SpringConfig): number {
  return s.damping / criticalDamping(s.stiffness, s.mass)
}

/** Estimate settling time (95% of final value) */
export function settleTime(s: SpringConfig): number {
  const z = dampingRatio(s)
  if (z >= 1) return 4 / (z * Math.sqrt(s.stiffness / s.mass))
  const omega = Math.sqrt(s.stiffness / s.mass)
  const dampedOmega = omega * Math.sqrt(1 - z * z)
  return -Math.log(0.05) / (z * omega)
}

// ── Named springs ──────────────────────────────────────────
// Each tuned for a specific physical behavior

export const spring = {
  /**
   * Layout reflow — map expansion, panel collapse.
   * ζ = 0.78: slight overshoot, fast settle (~220ms).
   * Feels like a well-damped hinge.
   */
  layout: {
    stiffness: 380,
    damping: 27,
    mass: 0.8,
  } satisfies SpringConfig,

  /**
   * Snap feedback — button press, toggle, checkbox.
   * ζ = 0.65: snappy with visible overshoot (~140ms).
   * Feels like a physical click.
   */
  snap: {
    stiffness: 500,
    damping: 21,
    mass: 0.5,
  } satisfies SpringConfig,

  /**
   * Gentle settle — content appearing, cards entering.
   * ζ = 0.90: nearly critically damped, soft landing (~300ms).
   * Feels like placing an object on a table.
   */
  gentle: {
    stiffness: 260,
    damping: 29,
    mass: 1.0,
  } satisfies SpringConfig,

  /**
   * Stiff — modals, overlays that must feel instant.
   * ζ = 0.95: almost no overshoot (~120ms).
   * Feels like a door latch.
   */
  stiff: {
    stiffness: 600,
    damping: 36,
    mass: 0.6,
  } satisfies SpringConfig,
} as const


// ════════════════════════════════════════════════════════════
// EASING CURVES
// ════════════════════════════════════════════════════════════
// These are cubic bezier control points [x1, y1, x2, y2].
// Each curve is a "phrase" — not just acceleration, but character.

export type CubicBezier = [number, number, number, number]

export const ease = {
  /**
   * Decelerate — the workhorse.
   * Fast entry, gradual stop. For elements arriving into view.
   * Like a ball rolling to rest on a flat surface.
   */
  decelerate: [0.0, 0.0, 0.2, 1.0] as CubicBezier,

  /**
   * Accelerate — elements departing.
   * Slow start, fast exit. Don't linger.
   * Like pushing something off a table.
   */
  accelerate: [0.4, 0.0, 1.0, 1.0] as CubicBezier,

  /**
   * Standard — neutral, bidirectional.
   * For transitions where direction is ambiguous.
   */
  standard: [0.4, 0.0, 0.2, 1.0] as CubicBezier,

  /**
   * Sharp — urgent feedback.
   * Very fast, minimal curve. Error states, critical actions.
   */
  sharp: [0.4, 0, 0, 1] as CubicBezier,

  /**
   * Exponential — dramatic reveals.
   * Slow build, explosive finish. Used sparingly.
   */
  explosive: [0.16, 1, 0.3, 1] as CubicBezier,
} as const


// ════════════════════════════════════════════════════════════
// DURATION
// ════════════════════════════════════════════════════════════
// Kept under 300ms for interactive elements.
// Apple HIG: 200ms is the sweet spot for UI feedback.

export const time = {
  /** Icon spin, color fade, opacity micro-change */
  instant: 0.1,
  /** Button press, tooltip, count tick */
  fast: 0.15,
  /** Panel enter/exit, card appear — the default */
  base: 0.2,
  /** Layout shifts, map expansion — the ceiling for interactive */
  slow: 0.32,
  /** Page transitions, modals — acceptable for non-interactive */
  page: 0.4,
} as const

// Upper bound for interactive motion — Apple HIG ceiling
const INTERACTIVE_CEILING = 0.35


// ════════════════════════════════════════════════════════════
// SPATIAL CONSTANTS
// ════════════════════════════════════════════════════════════
// Consistent distances. Every element moves the same amount
// for the same class of action. Spatial coherence.

export const shift = {
  /** Count changes, small adjustments — barely perceptible */
  tiny: 3,
  /** Cards, list items — standard displacement */
  base: 6,
  /** Panels, major sections — significant movement */
  large: 14,
  /** Full-page transitions */
  page: 24,
} as const

export const opacity = {
  hidden: 0,
  visible: 1,
  /** Background elements, disabled states */
  muted: 0.5,
  /** Subtle presence — not hidden but not focal */
  subtle: 0.7,
} as const


// ════════════════════════════════════════════════════════════
// STAGGER
// ════════════════════════════════════════════════════════════
// The rhythm of lists. Like musical notes:
// - 30ms = fast run (perceptible as sequence)
// - 50ms = walking pace (deliberate)
// - 80ms = slow march (editorial, each item gets attention)

export const stagger = {
  fast: 0.03,
  base: 0.05,
  slow: 0.08,
  /** For very long lists (10+) — keeps total time reasonable */
  compressed: 0.02,
} as const
