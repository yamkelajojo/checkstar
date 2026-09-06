'use client'

import { useMemo } from 'react'
import type { FeedEvent } from '@/types'

const SEVERITY_COLORS: Record<string, string> = {
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-rose-400',
}

const TYPE_ICONS: Record<string, string> = {
  order_state_change: '📦',
  rider_availability: '🏍️',
  dispatch_attempt: '🎯',
  dispatch_failed: '❌',
}

function relativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.floor((Date.now() - then) / 1000)
  if (diffSec < -60) return 'just now' // clock skew: treat future events as fresh
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  return `${diffDay}d ago`
}

export default function EventItem({ event }: { event: FeedEvent }) {
  const dotColor = SEVERITY_COLORS[event.severity] || 'bg-gray-300'
  const icon = TYPE_ICONS[event.type] || '•'
  const timeAgo = useMemo(() => relativeTime(event.created_at), [event.created_at])

  return (
    <div className="flex items-start gap-2.5 py-2 px-1 group hover:bg-gray-50/50 rounded-lg transition-colors">
      <div className="mt-1 relative shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-gray-700 leading-snug truncate">
          <span className="mr-1">{icon}</span>
          {event.message}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo}</p>
      </div>
    </div>
  )
}
