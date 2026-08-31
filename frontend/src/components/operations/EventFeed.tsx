'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from '@/lib/motion'
import { staggerContainer, item as itemVariant } from '@/lib/motion/variants'
import EventItem from './EventItem'
import type { FeedEvent, EventFeedResponse } from '@/types'
import { api } from '@/lib/api'

const POLL_INTERVAL = 5000
const MAX_EVENTS = 200

export default function EventFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cursorRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchEvents = useCallback(async () => {
    try {
      const params: Record<string, string> = { limit: '50' }
      if (cursorRef.current) {
        params.cursor = cursorRef.current
      }

      const data = await api.getOperationsEvents(params) as unknown as EventFeedResponse

      setEvents(prev => {
        const existingIds = new Set(prev.map(e => e.id))
        const newEvents = data.events.filter(e => !existingIds.has(e.id))
        const merged = [...newEvents, ...prev].slice(0, MAX_EVENTS)
        return merged
      })

      if (data.next_cursor) {
        cursorRef.current = data.next_cursor
      }

      setError(null)
    } catch {
      setError('Connection lost')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    const interval = setInterval(fetchEvents, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchEvents])

  if (loading) {
    return (
      <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Event Feed</span>
            <span className="text-[10px] text-gray-400">Loading...</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 bg-gray-100 rounded w-3/4" />
                <div className="h-2 bg-gray-50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Event Feed</span>
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-[10px] text-amber-500">{error}</span>
            )}
            <span className="text-[10px] text-gray-400">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto min-h-0"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {events.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-[11px] text-gray-300">No events yet</p>
          </div>
        ) : (
          <motion.div
            className="p-3 space-y-1"
            variants={staggerContainer(0.03)}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence initial={false}>
              {events.map(event => (
                <motion.div
                  key={event.id}
                  variants={itemVariant}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -10, transition: { duration: 0.15 } }}
                  layout
                >
                  <EventItem event={event} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
