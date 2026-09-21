/**
 * Motion Primitives — Type-safe, composable animated building blocks.
 *
 * Every animated element uses these primitives.
 * They enforce the token system at the type level — you cannot
 * accidentally use wrong timing. If you need new behavior,
 * add a primitive here first.
 *
 * Apple iOS Polish Principles:
 * - Every entrance has blur + scale + y, not just opacity
 * - Easing is Apple signature: [0.16,1,0.3,1] or [0.4,0.01,0.165,0.99]
 * - Springs feel like real materials, not UI decoration
 * - Exit faster than entrance
 * - Each component type has its own dedicated animation
 * - Nothing just appears — everything arrives
 *
 * Design principles:
 * - Every component accepts `className` for Tailwind composition
 * - Every component respects `prefers-reduced-motion`
 * - Every component is `forwardRef` for composability
 * - Zero config — sensible defaults, override via props
 */

'use client'

import { forwardRef, type ReactNode } from 'react'
import {
  motion,
  AnimatePresence,
  LayoutGroup,
  useReducedMotion,
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
// Fade — opacity entrance, no translation (legacy, kept for compat)
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
// Slide — directional entrance with fade (legacy)
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
// Scale — spring-based pop for interactive elements (legacy)
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
// Stagger — orchestrated list entrance (legacy)
// ════════════════════════════════════════════════════════════

interface StaggerProps {
  children: ReactNode
  className?: string
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
// StaggerItem — child of Stagger, inherits stagger timing (legacy)
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


// ════════════════════════════════════════════════════════════
// APPLE POLISH — Dedicated animations per component type
// Every component has its own dedicated animation, nothing just appears
// ════════════════════════════════════════════════════════════

// ── BlurFade — The workhorse for text, paragraphs, labels
// Apple uses blur+opacity+y, not just opacity. This is the foundation.

interface BlurFadeProps {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  blur?: number
}

export const BlurFade = forwardRef<HTMLDivElement, BlurFadeProps>(
  ({ children, className, delay = 0, y = 8, blur = 4 }, ref) => {
    const prefersReduced = useReducedMotion()
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y, filter: `blur(${blur}px)` }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -y * 0.5, filter: `blur(${blur * 0.5}px)` }}
        transition={{ duration: time.base, delay, ease: ease.apple }}
      >
        {children}
      </motion.div>
    )
  }
)
BlurFade.displayName = 'BlurFade'

// ── ScaleBlur — For cards, images, modals that need to feel like they arrive from depth

interface ScaleBlurProps {
  children: ReactNode
  className?: string
  delay?: number
  scaleFrom?: number
}

export const ScaleBlur = forwardRef<HTMLDivElement, ScaleBlurProps>(
  ({ children, className, delay = 0, scaleFrom = 0.96 }, ref) => {
    const prefersReduced = useReducedMotion()
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: scaleFrom, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
        transition={{ type: 'spring', ...spring.apple, delay }}
      >
        {children}
      </motion.div>
    )
  }
)
ScaleBlur.displayName = 'ScaleBlur'

// ── AppleCard — Dedicated for ProductCard, RecipeCard, StoreCard
// Each card has its own arrival: blur + y + scale + shadow

interface AppleCardProps {
  children: ReactNode
  className?: string
  delay?: number
  index?: number
}

export const AppleCard = forwardRef<HTMLDivElement, AppleCardProps>(
  ({ children, className, delay = 0, index = 0 }, ref) => {
    const prefersReduced = useReducedMotion()
    const staggerDelay = index * 0.04
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98, filter: 'blur(3px)' }}
        transition={{
          type: 'spring',
          ...spring.apple,
          delay: delay + staggerDelay,
        }}
        whileHover={prefersReduced ? undefined : { y: -4, scale: 1.01, transition: { type: 'spring', ...spring.snap } }}
        whileTap={prefersReduced ? undefined : { scale: 0.98, transition: { type: 'spring', ...spring.press } }}
      >
        {children}
      </motion.div>
    )
  }
)
AppleCard.displayName = 'AppleCard'

// ── AppleHero — Focal moment, one per page. Hero deserves authorship.

interface AppleHeroProps {
  children: ReactNode
  className?: string
}

export const AppleHero = forwardRef<HTMLDivElement, AppleHeroProps>(
  ({ children, className }, ref) => {
    const prefersReduced = useReducedMotion()
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{
          duration: 0.7,
          ease: ease.appleSpring,
          delay: 0.05,
        }}
      >
        {children}
      </motion.div>
    )
  }
)
AppleHero.displayName = 'AppleHero'

// ── AppleStagger — Cohesive list entrance, capped total delay

interface AppleStaggerProps {
  children: ReactNode
  className?: string
  gap?: number
  delay?: number
}

export const AppleStagger = forwardRef<HTMLDivElement, AppleStaggerProps>(
  ({ children, className, gap = 0.04, delay = 0.08 }, ref) => {
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
            transition: prefersReduced ? {} : { staggerChildren: gap, delayChildren: delay },
          },
          exit: {
            transition: prefersReduced ? {} : { staggerChildren: gap * 0.4, staggerDirection: -1 },
          },
        }}
      >
        {children}
      </motion.div>
    )
  }
)
AppleStagger.displayName = 'AppleStagger'

// ── AppleStaggerItem — Child with blur+y+scale

interface AppleStaggerItemProps {
  children: ReactNode
  className?: string
}

export const AppleStaggerItem = forwardRef<HTMLDivElement, AppleStaggerItemProps>(
  ({ children, className }, ref) => {
    const prefersReduced = useReducedMotion()
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={{
          hidden: prefersReduced ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)', scale: 0.98 },
          visible: {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            scale: 1,
            transition: { type: 'spring', ...spring.apple },
          },
          exit: {
            opacity: 0,
            y: -6,
            filter: 'blur(2px)',
            transition: { duration: time.fast, ease: ease.accelerate },
          },
        }}
      >
        {children}
      </motion.div>
    )
  }
)
AppleStaggerItem.displayName = 'AppleStaggerItem'

// ── AppleModal — Drawer, modal, popover with backdrop blur

interface AppleModalProps {
  children: ReactNode
  className?: string
}

export const AppleModal = forwardRef<HTMLDivElement, AppleModalProps>(
  ({ children, className }, ref) => {
    const prefersReduced = useReducedMotion()
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? { opacity: 0, scale: 0.96 } : { opacity: 0, scale: 0.94, y: 20, filter: 'blur(12px)' }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10, filter: 'blur(6px)' }}
        transition={{ type: 'spring', ...spring.apple }}
      >
        {children}
      </motion.div>
    )
  }
)
AppleModal.displayName = 'AppleModal'

// ── AppleButton — Every button has press feedback with spring

interface AppleButtonProps {
  children: ReactNode
  className?: string
  disabled?: boolean
}

export const AppleButton = forwardRef<HTMLDivElement, AppleButtonProps>(
  ({ children, className, disabled }, ref) => {
    const prefersReduced = useReducedMotion()
    return (
      <motion.div
        ref={ref}
        className={className}
        whileHover={disabled || prefersReduced ? undefined : { scale: 1.02 }}
        whileTap={disabled || prefersReduced ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', ...spring.press }}
      >
        {children}
      </motion.div>
    )
  }
)
AppleButton.displayName = 'AppleButton'

// ── AppleBadge — Small elements like pills, tags, counts

interface AppleBadgeProps {
  children: ReactNode
  className?: string
  delay?: number
}

export const AppleBadge = forwardRef<HTMLDivElement, AppleBadgeProps>(
  ({ children, className, delay = 0 }, ref) => {
    const prefersReduced = useReducedMotion()
    return (
      <motion.div
        ref={ref}
        className={className}
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', ...spring.appleBounce, delay }}
      >
        {children}
      </motion.div>
    )
  }
)
AppleBadge.displayName = 'AppleBadge'
