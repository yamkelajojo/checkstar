'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from '@/lib/motion'
import { orchestratedLayout } from '@/lib/motion/variants'
import { spring } from '@/lib/motion/tokens'
import { Maximize2, Minimize2 } from 'lucide-react'
import MapContainer from '@/components/MapContainer'
import MetricsHud from '@/components/operations/MetricsHud'
import EventFeedPlaceholder from '@/components/operations/EventFeedPlaceholder'

interface Metrics {
  active_riders: number
  total_riders: number
  orders_this_hour: number
  pending_orders: number
  active_deliveries: number
  delivered_today: number
}

export default function OperationsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/operations/metrics', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setMetrics(data)
        }
      } catch {
        // Silent fail
      } finally {
        setMetricsLoading(false)
      }
    }
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'Escape' && expanded) setExpanded(false)
      if (e.key === 'f' && !e.ctrlKey && !e.metaKey) setExpanded(prev => !prev)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const sharedSpring = { type: 'spring' as const, ...spring.layout }

  return (
    <LayoutGroup>
      <div className="min-h-screen">
        {/* Header */}
        <motion.header
          layout
          transition={sharedSpring}
          className="flex items-center justify-between px-4 md:px-6 h-14"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F58220] flex items-center justify-center text-white font-bold text-sm">C</div>
            <motion.span layout transition={sharedSpring} className="font-display text-lg font-bold tracking-tight text-[#1B1816]">
              CHECKSTAR OPS
            </motion.span>
          </div>
          <div className="flex items-center gap-4">
            <motion.span layout transition={sharedSpring} className="text-xs text-gray-400">
              Live Dashboard
            </motion.span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </motion.header>

        {/* Main grid */}
        <motion.div layout transition={sharedSpring} className="px-4 md:px-6 pb-6">
          <div className={`grid gap-4 ${expanded ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[260px_1fr_320px]'}`}>

            {/* Metrics — fade out when expanded */}
            <AnimatePresence mode="popLayout">
              {!expanded && (
                <motion.div
                  key="metrics"
                  layout
                  initial={orchestratedLayout.panelExit}
                  animate={orchestratedLayout.panelEnter}
                  exit={orchestratedLayout.panelExit}
                  transition={sharedSpring}
                >
                  <MetricsHud metrics={metrics} loading={metricsLoading} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Map — expands from card to fullscreen */}
            <motion.div
              layout
              transition={sharedSpring}
              className={`relative rounded-xl overflow-hidden bg-white shadow-sm border ${
                expanded
                  ? 'fixed inset-0 z-50 rounded-none border-none'
                  : 'border-gray-100'
              }`}
              style={expanded ? { height: '100vh' } : { minHeight: 'calc(100vh - 140px)' }}
            >
              <div className="absolute inset-0 z-10">
                <MapContainer center={[-29.825, 31.00]} zoom={12.5} />
              </div>

              <motion.button
                layout
                transition={sharedSpring}
                onClick={() => setExpanded(prev => !prev)}
                className={`absolute z-20 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs shadow-sm cursor-pointer ${
                  expanded
                    ? 'top-4 right-4 bg-[rgba(13,17,26,0.82)] backdrop-blur-xl border border-white/10 text-[#E2E8F0] hover:bg-[rgba(13,17,26,0.95)]'
                    : 'bottom-4 right-4 bg-white/90 backdrop-blur border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {expanded ? <Minimize2 size={14} /> : <Maximize2 size={13} />}
                {expanded ? 'Exit Fullscreen' : 'Fullscreen'}
              </motion.button>
            </motion.div>

            {/* Event feed — fade out when expanded */}
            <AnimatePresence mode="popLayout">
              {!expanded && (
                <motion.div
                  key="events"
                  layout
                  initial={orchestratedLayout.panelExit}
                  animate={orchestratedLayout.panelEnter}
                  exit={orchestratedLayout.panelExit}
                  transition={sharedSpring}
                >
                  <EventFeedPlaceholder />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </LayoutGroup>
  )
}
