'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  value: number
  color: string
  duration?: number
}

export function CountUp({ value, color, duration = 160 }: CountUpProps) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const from = prev.current
    const to = value
    if (from === to) return
    prev.current = to

    const start = performance.now()
    const step = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // ease-out cubic: fast start, smooth stop
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (t < 1) {
        raf.current = requestAnimationFrame(step)
      }
    }

    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])

  return (
    <span className="text-2xl font-bold tabular-nums" style={{ color }}>
      {display}
    </span>
  )
}
