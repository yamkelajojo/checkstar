/**
 * Motion Primitives — Type-safe, composable animated building blocks.
 *
 * Every animated element in the dashboard uses these primitives.
 * They enforce the token system at the type level — you cannot
 * accidentally use wrong timing. If you need new behavior,
 * add a primitive here first.
 *
 * Design principles:
 * - Every component accepts `className` for Tailwind composition
 * - Every component respects `prefers-reduced-motion`
 * - Every component is `forwardRef` for composability
 * - Zero config — sensible defaults, override via props
 */

'use client'

import { forwardRef, type ReactNode, type ComponentPropsWithoutRef } from 'react'
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
  type MotionProps,
  type HTMLMotionProps,
  type Variants,
} from 'motion/react'
import { spring, time, ease } from './tokens'


// ════════════════════════════════════════════════════════════
// RE-EXPORTS — The only motion imports allowed in components
// ════════════════════════════════════════════════════════════

export {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
}


// ════════════════════════════════════════════════════════════
// Fade — opacity entrance, no translation
// ════════════════════════════════════════════════════════════

interface FadeProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
}

export const Fade = forwardRef<HTMLDivElement, FadeProps>(
  ({ children, className, delay = 0, duration = time.base }, ref) => {
    const prefersReduced = useReducedMotion()

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={prefersReduced ? undefined : { opacity: 0 }}
        transition={{ duration, delay, ease: ease.decelerate }}
      >
        {children}
      </motion.div>
    )
  }
)
Fade.displayName = 'Fade'


// ════════════════════════════════════════════════════════════
// Slide — directional entrance with fade
// ════════════════════════════════════════════════════════════

interface SlideProps {
  children: ReactNode
  className?: string
  from?: 'left' | 'right' | 'top' | 'bottom'
  distance?: number
  delay?: number
}

export const Slide = forwardRef<HTMLDivElement, SlideProps>(
  ({ children, className, from = 'bottom', distance = 14, delay = 0 }, ref) => {
    const prefersReduced = useReducedMotion()
    const axis = from === 'left' || from === 'right' ? 'x' : 'y'
    const sign = from === 'right' || from === 'bottom' ? 1 : -1

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? undefined : { opacity: 0, [axis]: distance * sign }}
        animate={{ opacity: 1, [axis]: 0 }}
        exit={prefersReduced ? undefined : { opacity: 0, [axis]: -(distance * 0.4) * sign }}
        transition={{
          duration: time.base,
          delay,
          ease: ease.decelerate,
        }}
      >
        {children}
      </motion.div>
    )
  }
)
Slide.displayName = 'Slide'


// ════════════════════════════════════════════════════════════
// Scale — spring-based pop for interactive elements
// ════════════════════════════════════════════════════════════

interface ScaleProps {
  children: ReactNode
  className?: string
  delay?: number
}

export const Scale = forwardRef<HTMLDivElement, ScaleProps>(
  ({ children, className, delay = 0 }, ref) => {
    const prefersReduced = useReducedMotion()

    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? undefined : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', ...spring.snap, delay }}
      >
        {children}
      </motion.div>
    )
  }
)
Scale.displayName = 'Scale'


// ════════════════════════════════════════════════════════════
// Stagger — orchestrated list entrance
// ════════════════════════════════════════════════════════════

interface StaggerProps {
  children: ReactNode
  className?: string
  /** Gap between items in seconds. 0.03 = fast run, 0.05 = walking pace */
  gap?: number
  delay?: number
}

export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(
  ({ children, className, gap = 0.03, delay = 0.02 }, ref) => {
    const prefersReduced = useReducedMotion()

    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
          hidden: {},
          visible: {
            transition: prefersReduced
              ? {}
              : { staggerChildren: gap, delayChildren: delay },
          },
          exit: {
            transition: prefersReduced
              ? {}
              : { staggerChildren: gap * 0.5, staggerDirection: -1 },
          },
        }}
      >
        {children}
      </motion.div>
    )
  }
)
Stagger.displayName = 'Stagger'


// ════════════════════════════════════════════════════════════
// StaggerItem — child of Stagger, inherits stagger timing
// ════════════════════════════════════════════════════════════

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={{
          hidden: { opacity: 0, y: 6 },
          visible: { opacity: 1, y: 0, transition: { duration: time.base, ease: ease.decelerate } },
          exit: { opacity: 0, y: -3, transition: { duration: time.fast, ease: ease.accelerate } },
        }}
      >
        {children}
      </motion.div>
    )
  }
)
StaggerItem.displayName = 'StaggerItem'


// ════════════════════════════════════════════════════════════
// Layout — spring-based layout animation wrapper
// ════════════════════════════════════════════════════════════

interface LayoutProps {
  children: ReactNode
  className?: string
  /** Assign a layoutId to coordinate motion between two positions */
  layoutId?: string
}

export const Layout = forwardRef<HTMLDivElement, LayoutProps>(
  ({ children, className, layoutId }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        layout
        layoutId={layoutId}
        transition={{ type: 'spring', ...spring.layout }}
      >
        {children}
      </motion.div>
    )
  }
)
Layout.displayName = 'Layout'
