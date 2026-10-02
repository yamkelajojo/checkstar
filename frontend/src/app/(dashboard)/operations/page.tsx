'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, LayoutGroup } from '@/lib/motion'
import { orchestratedLayout } from '@/lib/motion/variants'
import { spring } from '@/lib/motion/tokens'
import { Maximize2, Minimize2, Store as StoreIcon, ArrowLeft, ChevronRight, BarChart3, FileClock } from 'lucide-react'
import dynamic from 'next/dynamic'
import MetricsHud from '@/components/operations/MetricsHud'

const MapContainer = dynamic(() => import('@/components/MapContainer'), { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" /> })
import EventFeed from '@/components/operations/EventFeed'
import AlertBanner from '@/components/operations/AlertBanner'
import DispatchPanel from '@/components/operations/DispatchPanel'
import MapLayerToggles, { MapLayerData } from '@/components/operations/MapLayerToggles'
import { getDispatchChime } from '@/lib/audio/dispatch-chime'
import { useHotkeys } from '@/lib/hooks/useHotkeys'
import { api } from '@/lib/api'
import { orderStatusLabel } from '@/lib/labels'
import { useOperationsMetrics, useStores, useStoreOrders } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import Select from '@/components/ui/select'
import Tooltip from '@/components/ui/tooltip'

export default function OperationsPage() {
  const { user } = useAuthStore()
  const { data: stores = [] } = useStores()
  const [storeIdInput, setStoreIdInput] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  useEffect(() => {
    if (user?.role === 'developer' && !storeIdInput && stores.length > 0) {
      const firstId = (stores[0] as { id?: number })?.id
      if (firstId != null) setStoreIdInput(String(firstId))
    }
  }, [user?.role, storeIdInput, stores])

  const activeStoreId = user?.role === 'developer' ? (storeIdInput ? Number(storeIdInput) : undefined) : undefined
  const canQueryStore = user?.role !== 'developer' || activeStoreId != null

  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useOperationsMetrics(activeStoreId)
  const { data: storeOrders = [], refetch: refetchOrders } = useStoreOrders(
    activeStoreId,
    { per_page: '30' },
    { enabled: canQueryStore },
  )
  const [expanded, setExpanded] = useState(false)
  const [mapInstance, setMapInstance] = useState<import('leaflet').Map | null>(null)
  const [mapLayerData, setMapLayerData] = useState<MapLayerData | null>(null)
  const chimeRef = useRef(getDispatchChime())
  const prevPendingRef = useRef(0)

  const refreshLayers = useCallback(() => {
    if (!canQueryStore) return
    api.getOperationsMapLayers(activeStoreId).then(setMapLayerData).catch(() => {})
  }, [activeStoreId, canQueryStore])

  useEffect(() => {
    refreshLayers()
    const timer = setInterval(refreshLayers, 15_000)
    return () => clearInterval(timer)
  }, [refreshLayers])

  const mapMarkers = useMemo(() => {
    const markers: Array<{ position: [number, number]; popup?: string; tooltip?: string }> = []
    for (const s of stores as Array<{ id: number; name: string; address?: string; latitude?: number; longitude?: number }>) {
      if (activeStoreId && Number(s.id) !== Number(activeStoreId)) continue
      const lat = Number(s.latitude)
      const lng = Number(s.longitude)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        markers.push({
          position: [lat, lng],
          popup: `${s.name}${s.address ? ` — ${s.address}` : ''}`,
          tooltip: s.name,
        })
      }
    }
    for (const o of storeOrders) {
      if (!['confirmed', 'preparing', 'out_for_delivery', 'retrying'].includes(o.status)) continue
      const lat = Number(o.delivery_latitude)
      const lng = Number(o.delivery_longitude)
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        markers.push({
          position: [lat, lng],
          popup: `Order #${o.order_number} (${orderStatusLabel(o.status)})`,
          tooltip: `Order #${o.order_number}`,
        })
      }
    }
    return markers
  }, [stores, activeStoreId, storeOrders])

  useEffect(() => {
    if (metrics) {
      if (prevPendingRef.current > 0 && metrics.pending_orders > prevPendingRef.current) {
        chimeRef.current.play()
      }
      prevPendingRef.current = metrics.pending_orders
    }
  }, [metrics])

  // Unlock chime on first interaction
  useEffect(() => {
    const unlock = () => {
      chimeRef.current.unlock()
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
    window.addEventListener('click', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  useHotkeys({
    'escape': () => setExpanded(false),
    'f': () => setExpanded(prev => !prev),
  })

  const sharedSpring = { type: 'spring' as const, ...spring.layout }

  return (
    <LayoutGroup>
      <div className="min-h-screen">
        {/* Header */}
        <motion.header
          layout
          transition={sharedSpring}
          className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-6 py-2.5 min-h-[56px] border-b border-gray-100 bg-white/90 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              aria-label="Back to dashboard"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>
            <ChevronRight size={13} className="text-gray-300 hidden sm:inline" />
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#F58220] flex items-center justify-center text-white font-bold text-xs">C</div>
              <motion.span layout transition={sharedSpring} className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
                CHECKSTAR OPS
              </motion.span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/operations/analytics"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <BarChart3 size={13} />
              Analytics
            </Link>
            <Link
              href="/operations/audit-logs"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <FileClock size={13} />
              Audit Logs
            </Link>
            <motion.span layout transition={sharedSpring} className="text-xs text-gray-400 hidden md:inline">
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[10px] font-mono">F</kbd> fullscreen
            </motion.span>
            <Tooltip content="Live operations feed active" side="bottom">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </Tooltip>
          </div>
        </motion.header>

        {/* Developer store selector */}
        {user?.role === 'developer' && (
          <div className="px-4 md:px-6 pb-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <StoreIcon size={14} className="text-amber-700" />
              <label className="text-xs font-medium text-amber-800">Store ID:</label>
              <input value={storeIdInput} onChange={e => setStoreIdInput(e.target.value)} placeholder="e.g. 1" className="w-24 px-2 py-1 border border-amber-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500 outline-none" />
              {stores.length > 0 && (
                <Select
                  ariaLabel="Pick a store"
                  value={storeIdInput}
                  onChange={setStoreIdInput}
                  options={[
                    { value: '', label: 'Select…' },
                    ...stores.map(s => ({
                      value: String((s as { id: number }).id),
                      label: (s as { name: string }).name,
                    })),
                  ]}
                  placeholder="Select…"
                  size="xs"
                  className="w-40"
                />
              )}
              {!activeStoreId && <span className="text-[11px] text-amber-700">Required for developer view</span>}
            </div>
          </div>
        )}

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
                  <MetricsHud metrics={metrics ?? null} loading={metricsLoading} />
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
                <MapContainer center={[-29.825, 31.00]} zoom={12.5} markers={mapMarkers} onMapReady={setMapInstance} />
              </div>

              {mapInstance && <MapLayerToggles map={mapInstance} data={mapLayerData} />}

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
                  <EventFeed storeId={activeStoreId} onSelectOrder={setSelectedOrderId} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <DispatchPanel
          orderId={selectedOrderId}
          storeId={activeStoreId}
          onClose={() => setSelectedOrderId(null)}
          onAssigned={() => {
            refetchMetrics()
            refetchOrders()
            refreshLayers()
          }}
        />

        {/* Alerts */}
        <AlertBanner storeId={activeStoreId} />
      </div>
    </LayoutGroup>
  )
}
