'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

/**
 * CyclingCarousel — vendored from cult-ui's LogoCarousel (MIT) and adapted:
 * the mechanics are identical (shuffle, even column distribution, a shared
 * clock, staggered columns, blur+spring swap), but cells render arbitrary
 * content instead of brand SVGs. Two additions for product use:
 * hovering the carousel pauses the clock so shoppers can read/click, and
 * reduced-motion users get a calm static grid instead.
 */

export interface CycleItem {
  id: number
  content: React.ReactNode
}

interface CyclingCarouselProps {
  items: CycleItem[]
  columnCount?: number
  /** Cell height class — cells fill their column width. */
  cellClassName?: string
  /** Columns past `visibleBelow` are hidden on small screens (CSS only). */
  visibleBelow?: number
}

interface ColumnProps {
  items: CycleItem[]
  index: number
  clock: number
  cycleMs: number
  hidden?: boolean
  cellClassName?: string
}

const CycleColumn = React.memo(function CycleColumn({ items, index, clock, cycleMs, hidden, cellClassName }: ColumnProps) {
  const columnDelay = index * 200
  const adjustedTime = (clock + columnDelay) % (cycleMs * items.length)
  const currentIndex = Math.floor(adjustedTime / cycleMs)
  const current = items[currentIndex]

  return (
    <div
      className={cn('relative min-w-0 flex-1', hidden && 'hidden md:flex')}
    >
      <motion.div
        className={cn('relative w-full', cellClassName)}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            className="absolute inset-0"
            initial={{ y: '10%', opacity: 0, filter: 'blur(8px)' }}
            animate={{
              y: '0%',
              opacity: 1,
              filter: 'blur(0px)',
              transition: { type: 'spring', stiffness: 300, damping: 20, mass: 1, bounce: 0.2, duration: 0.5 },
            }}
            exit={{
              y: '-20%',
              opacity: 0,
              filter: 'blur(6px)',
              transition: { type: 'tween', ease: 'easeIn', duration: 0.3 },
            }}
          >
            {current.content}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
})

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function distribute(items: CycleItem[], columnCount: number): CycleItem[][] {
  const shuffled = shuffle(items)
  const columns: CycleItem[][] = Array.from({ length: columnCount }, () => [])
  shuffled.forEach((item, index) => {
    columns[index % columnCount].push(item)
  })
  // Unlike the cult-ui original we do NOT backfill short columns with
  // duplicates — repeating a product side-by-side reads as a bug. Empty
  // columns simply render nothing; a column with one item doesn't cycle.
  return columns.filter((col) => col.length > 0)
}

export default function CyclingCarousel({
  items,
  columnCount = 4,
  cellClassName = 'h-48 sm:h-52',
  visibleBelow = 2,
}: CyclingCarouselProps) {
  const shouldReduceMotion = useReducedMotion()
  const [columns, setColumns] = useState<CycleItem[][]>([])
  const [clock, setClock] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setColumns(distribute(items, columnCount))
  }, [items, columnCount])

  const tick = useCallback(() => {
    setClock((t) => t + 100)
  }, [])

  useEffect(() => {
    if (shouldReduceMotion || paused || columns.length === 0) return
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [tick, paused, shouldReduceMotion, columns.length])

  if (shouldReduceMotion) {
    // Calm static grid — everything visible, nothing moving.
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className={cellClassName}>
            {item.content}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="flex gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {columns.map((col, index) => (
        <CycleColumn
          key={index}
          items={col}
          index={index}
          clock={clock}
          cycleMs={2200}
          cellClassName={cellClassName}
          hidden={index >= visibleBelow}
        />
      ))}
    </div>
  )
}
