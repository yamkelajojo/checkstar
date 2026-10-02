'use client'

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  isValidElement,
  cloneElement,
} from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { spring, time } from '@/lib/motion/tokens'

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right'
export type TooltipVariant = 'dark' | 'light' | 'brand'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: TooltipSide
  variant?: TooltipVariant
  shortcut?: string
  delayMs?: number
  disabled?: boolean
  className?: string
}

interface Coords {
  top: number
  left: number
  resolvedSide: TooltipSide
}

const GAP = 8

/**
 * Shared styled tooltip configuration for Chart.js charts so canvas tooltips
 * match the Watermelon UI Tooltip surface rather than the Chart.js default.
 */
export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0F172A',
  titleColor: '#F8FAFC',
  bodyColor: '#E2E8F0',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  borderWidth: 1,
  cornerRadius: 10,
  padding: 10,
  boxPadding: 5,
  usePointStyle: true,
  titleFont: { size: 11, weight: 'bold' as const },
  bodyFont: { size: 11 },
}

export default function Tooltip({
  content,
  children,
  side = 'top',
  variant = 'dark',
  shortcut,
  delayMs = 60,
  disabled = false,
  className = '',
}: TooltipProps) {
  const tooltipId = useId()
  const triggerRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<Coords | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const measure = useCallback((): Coords | null => {
    const el = triggerRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()

    let resolvedSide: TooltipSide = side
    if (side === 'top' && rect.top < 48) resolvedSide = 'bottom'
    else if (side === 'bottom' && window.innerHeight - rect.bottom < 48) resolvedSide = 'top'
    else if (side === 'left' && rect.left < 120) resolvedSide = 'right'
    else if (side === 'right' && window.innerWidth - rect.right < 120) resolvedSide = 'left'

    if (resolvedSide === 'top') {
      return {
        top: rect.top - GAP,
        left: rect.left + rect.width / 2,
        resolvedSide,
      }
    }
    if (resolvedSide === 'bottom') {
      return {
        top: rect.bottom + GAP,
        left: rect.left + rect.width / 2,
        resolvedSide,
      }
    }
    if (resolvedSide === 'left') {
      return {
        top: rect.top + rect.height / 2,
        left: rect.left - GAP,
        resolvedSide,
      }
    }
    return {
      top: rect.top + rect.height / 2,
      left: rect.right + GAP,
      resolvedSide,
    }
  }, [side])

  const showTooltip = useCallback(() => {
    if (disabled || content === null || content === undefined || content === '') return
    clearTimer()
    if (delayMs <= 0) {
      setCoords(measure())
      setOpen(true)
    } else {
      timerRef.current = setTimeout(() => {
        setCoords(measure())
        setOpen(true)
      }, delayMs)
    }
  }, [disabled, content, delayMs, clearTimer, measure])

  const hideTooltip = useCallback(() => {
    clearTimer()
    setOpen(false)
  }, [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  useEffect(() => {
    if (!open) return
    setCoords(measure())
    const onRelayout = () => setCoords(measure())
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideTooltip()
    }
    window.addEventListener('scroll', onRelayout, true)
    window.addEventListener('resize', onRelayout)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('scroll', onRelayout, true)
      window.removeEventListener('resize', onRelayout)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, measure, hideTooltip])

  const surfaceClasses =
    variant === 'light'
      ? 'bg-white text-gray-900 border border-gray-200 shadow-lg'
      : variant === 'brand'
        ? 'bg-primary text-white border border-primary/80 shadow-lg'
        : 'bg-slate-900 text-white border border-white/10 shadow-xl'

  const arrowClasses =
    variant === 'light'
      ? 'bg-white border-gray-200'
      : variant === 'brand'
        ? 'bg-primary border-primary/80'
        : 'bg-slate-900 border-white/10'

  const childProps = isValidElement(children)
    ? (children.props as Record<string, unknown>)
    : {}

  const triggerElement = isValidElement(children) ? (
    cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node
        const existingRef = (children as unknown as { ref?: React.Ref<HTMLElement> }).ref
        if (typeof existingRef === 'function') existingRef(node)
        else if (existingRef && typeof existingRef === 'object') {
          ;(existingRef as React.MutableRefObject<HTMLElement | null>).current = node
        }
      },
      onMouseEnter: (e: React.MouseEvent) => {
        if (typeof childProps.onMouseEnter === 'function') childProps.onMouseEnter(e)
        showTooltip()
      },
      onMouseLeave: (e: React.MouseEvent) => {
        if (typeof childProps.onMouseLeave === 'function') childProps.onMouseLeave(e)
        hideTooltip()
      },
      onFocus: (e: React.FocusEvent) => {
        if (typeof childProps.onFocus === 'function') childProps.onFocus(e)
        showTooltip()
      },
      onBlur: (e: React.FocusEvent) => {
        if (typeof childProps.onBlur === 'function') childProps.onBlur(e)
        hideTooltip()
      },
      'aria-describedby': open ? tooltipId : (childProps['aria-describedby'] as string | undefined),
    })
  ) : (
    <span
      ref={(node) => {
        triggerRef.current = node
      }}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={open ? tooltipId : undefined}
    >
      {children}
    </span>
  )

  const resolved = coords?.resolvedSide ?? side
  const initialDelta =
    resolved === 'top'
      ? { y: 5, x: '-50%' }
      : resolved === 'bottom'
        ? { y: -5, x: '-50%' }
        : resolved === 'left'
          ? { x: 'calc(-100% + 5px)', y: '-50%' }
          : { x: -5, y: '-50%' }

  const animateDelta =
    resolved === 'top' || resolved === 'bottom'
      ? { y: 0, x: '-50%' }
      : resolved === 'left'
        ? { x: '-100%', y: '-50%' }
        : { x: 0, y: '-50%' }

  return (
    <>
      {triggerElement}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && coords && (
              <motion.div
                id={tooltipId}
                role="tooltip"
                initial={{ opacity: 0, scale: 0.94, ...initialDelta }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  ...animateDelta,
                  transition: spring.snap,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: time.fast },
                }}
                style={{
                  position: 'fixed',
                  top:
                    resolved === 'top'
                      ? undefined
                      : coords.top,
                  bottom:
                    resolved === 'top'
                      ? window.innerHeight - coords.top
                      : undefined,
                  left: coords.left,
                  zIndex: 160,
                }}
                className={`pointer-events-none select-none px-2.5 py-1.5 rounded-lg text-[11px] font-medium leading-tight tracking-tight whitespace-nowrap flex items-center gap-1.5 ${surfaceClasses} ${className}`}
              >
                <span>{content}</span>
                {shortcut && (
                  <kbd className="px-1 py-0.5 rounded bg-white/15 text-[10px] font-mono leading-none">
                    {shortcut}
                  </kbd>
                )}
                <span
                  aria-hidden="true"
                  className={`absolute w-2 h-2 rotate-45 ${arrowClasses} ${
                    resolved === 'top'
                      ? 'left-1/2 -translate-x-1/2 -bottom-1 border-r border-b'
                      : resolved === 'bottom'
                        ? 'left-1/2 -translate-x-1/2 -top-1 border-l border-t'
                        : resolved === 'left'
                          ? 'top-1/2 -translate-y-1/2 -right-1 border-t border-r'
                          : 'top-1/2 -translate-y-1/2 -left-1 border-b border-l'
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
