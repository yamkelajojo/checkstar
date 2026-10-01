'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'motion/react'
import { Navigation, MapPin, Clock, WifiOff, Hourglass } from 'lucide-react'
import { useOrderRiderLocation, useRouteGeometry } from '@/lib/query'
import { decodePolyline, type LatLng } from '@/lib/polyline'
import { spring, ease } from '@/lib/motion/tokens'
import { formatTime } from '@/lib/dates'

const MapContainer = dynamic(() => import('@/components/MapContainer'), {
  ssr: false,
  loading: () => <div className="h-[320px] bg-gray-100 shimmer rounded-card" />,
})

interface Props {
  orderId: number | string
  orderStatus?: string
  storeName: string
  storeLat?: number
  storeLng?: number
  deliveryLat?: number
  deliveryLng?: number
  deliveryAddress?: string | null
  riderName?: string | null
  height?: number
}

const STALE_THRESHOLD_MS = 90_000

function isPollingStatus(status?: string) {
  return status != null && ['confirmed', 'preparing', 'out_for_delivery'].includes(status)
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Generates a smooth, slightly curved road-like path when OSRM is unavailable
 * so the prototype map renders an appealing route line without local .osrm files.
 */
function buildFallbackPath(from: [number, number], to: [number, number], via?: [number, number]): [number, number][] {
  if (via) {
    return [...buildFallbackPath(from, via), ...buildFallbackPath(via, to).slice(1)]
  }
  const [lat1, lng1] = from
  const [lat2, lng2] = to
  const dLat = lat2 - lat1
  const dLng = lng2 - lng1
  const steps = 16
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const offset = Math.sin(t * Math.PI) * 0.12
    pts.push([lat1 + dLat * t - dLng * offset, lng1 + dLng * t + dLat * offset])
  }
  return pts
}

export default function OrderTrackingMap({
  orderId,
  orderStatus,
  storeName,
  storeLat,
  storeLng,
  deliveryLat,
  deliveryLng,
  deliveryAddress,
  riderName,
  height = 360,
}: Props) {
  const { data: riderLocation } = useOrderRiderLocation(orderId, isPollingStatus(orderStatus))
  const [mapInstance, setMapInstance] = useState<any>(null)
  const hasRider = riderLocation != null

  const isStale = useMemo(() => {
    if (!riderLocation?.recorded_at) return false
    return Date.now() - new Date(riderLocation.recorded_at).getTime() > STALE_THRESHOLD_MS
  }, [riderLocation])

  // Fetch route geometry store -> delivery
  const { data: geometry } = useRouteGeometry(
    storeLat,
    storeLng,
    deliveryLat,
    deliveryLng,
    !!(storeLat && storeLng && deliveryLat && deliveryLng),
  )

  const routeMetrics = useMemo(() => {
    if (storeLat != null && storeLng != null && deliveryLat != null && deliveryLng != null) {
      const dist = haversineKm(storeLat, storeLng, deliveryLat, deliveryLng) * 1.32
      return {
        distanceKm: Math.round(dist * 100) / 100,
        durationMinutes: Math.max(5, Math.ceil((dist / 32) * 60 + 3)),
      }
    }
    return null
  }, [storeLat, storeLng, deliveryLat, deliveryLng])

  const routePoints = useMemo<LatLng[]>(() => {
    if (!geometry) return []
    try {
      return decodePolyline(geometry)
    } catch {
      return []
    }
  }, [geometry])

  const allPoints = useMemo<LatLng[]>(() => {
    const pts: LatLng[] = []
    if (storeLat != null && storeLng != null) pts.push({ lat: storeLat, lng: storeLng })
    if (deliveryLat != null && deliveryLng != null) pts.push({ lat: deliveryLat, lng: deliveryLng })
    if (riderLocation) pts.push({ lat: riderLocation.latitude, lng: riderLocation.longitude })
    pts.push(...routePoints)
    return pts
  }, [storeLat, storeLng, deliveryLat, deliveryLng, riderLocation, routePoints])

  const markers = useMemo(() => {
    const m: Array<{ position: [number, number]; popup?: string; tooltip?: string }> = []
    if (storeLat != null && storeLng != null) {
      m.push({ position: [storeLat, storeLng], popup: storeName, tooltip: storeName })
    }
    if (deliveryLat != null && deliveryLng != null) {
      m.push({ position: [deliveryLat, deliveryLng], popup: deliveryAddress || 'Delivery address', tooltip: 'Delivery' })
    }
    if (riderLocation) {
      m.push({
        position: [riderLocation.latitude, riderLocation.longitude],
        popup: riderName ? `${riderName} — ${isStale ? 'stale' : 'live'}` : isStale ? 'Rider (stale)' : 'Rider (live)',
        tooltip: riderName || 'Rider',
      })
    }
    return m
  }, [storeLat, storeLng, deliveryLat, deliveryLng, storeName, deliveryAddress, riderLocation, riderName, isStale])

  const fitBounds = useMemo(() => {
    if (allPoints.length < 2) return undefined
    return allPoints.map(p => [p.lat, p.lng] as [number, number])
  }, [allPoints])

  // Draw polyline when map and geometry ready
  const polylineRef = useRef<any>(null)
  useEffect(() => {
    if (!mapInstance) return
    let cancelled = false
    const draw = async () => {
      const L = await import('leaflet')
      if (cancelled) return
      // Remove previous
      if (polylineRef.current) {
        try { mapInstance.removeLayer(polylineRef.current) } catch {}
        polylineRef.current = null
      }
      if (routePoints.length > 1) {
        const latlngs = routePoints.map(p => [p.lat, p.lng] as [number, number])
        polylineRef.current = L.polyline(latlngs, { color: '#EB6522', weight: 4, opacity: 0.85 }).addTo(mapInstance)
      } else if (storeLat != null && storeLng != null && deliveryLat != null && deliveryLng != null) {
        polylineRef.current = L.polyline(
          [[storeLat, storeLng], [deliveryLat, deliveryLng]],
          { color: '#EB6522', weight: 3, opacity: 0.65, dashArray: '8 6' },
        ).addTo(mapInstance)
      }
    }
    draw()
    return () => {
      cancelled = true
      if (polylineRef.current) {
        try { mapInstance.removeLayer(polylineRef.current) } catch {}
        polylineRef.current = null
      }
    }
  }, [mapInstance, routePoints, storeLat, storeLng, deliveryLat, deliveryLng, riderLocation])

  const hasCoords = storeLat != null && storeLng != null && deliveryLat != null && deliveryLng != null
  const isWaiting = (orderStatus === 'confirmed' || orderStatus === 'preparing') && !hasRider

  const shouldReduce = useReducedMotion()

  if (!hasCoords) {
    return (
      <motion.div
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: 'spring', ...spring.apple }}
        className="rounded-card border border-gray-100 bg-white p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
          <MapPin className="text-gray-300" size={20} strokeWidth={1.5} />
        </div>
        <p className="text-[14px] font-medium text-gray-900">Map unavailable</p>
        <p className="text-[12px] text-gray-500 mt-1">Delivery coordinates not set</p>
        {deliveryAddress && <p className="text-[11px] text-gray-400 mt-2 max-w-[280px] mx-auto">{deliveryAddress}</p>}
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true }}
      transition={{ type: 'spring', ...spring.apple }}
      className="rounded-card border border-gray-100/80 bg-white overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]"
    >
      {/* Header — dedicated animation */}
      <motion.div
        initial={shouldReduce ? undefined : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ease: ease.apple }}
        className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50/80 bg-gradient-to-r from-white to-gray-50/50"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center">
            <Navigation size={14} className="text-primary" strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-semibold text-gray-900 tracking-tight">{isWaiting ? 'Preparing Order' : 'Live Tracking'}</span>
        </div>
        {isWaiting ? (
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', ...spring.snap }}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 shadow-sm"
          >
            <Hourglass size={12} strokeWidth={2.5} /> Waiting for rider
          </motion.span>
        ) : hasRider ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', ...spring.appleBounce }}
            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow-[0_2px_6px_rgba(0,0,0,0.15)] ${isStale ? 'bg-amber-500' : 'bg-green-600'}`}
          >
            {isStale ? <WifiOff size={11} strokeWidth={2.5} /> : <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_6px_white]" />}
            {isStale ? 'STALE' : 'LIVE'}
          </motion.span>
        ) : null}
      </motion.div>

      {/* Map — scale+blur entrance */}
      <motion.div
        initial={shouldReduce ? undefined : { opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ delay: 0.15, duration: 0.5, ease: ease.apple }}
        style={{ height }}
        className="relative overflow-hidden"
      >
        <MapContainer
          center={storeLat && storeLng ? [storeLat, storeLng] : [-29.8587, 31.0218]}
          zoom={13}
          markers={markers}
          fitBounds={fitBounds}
          onMapReady={setMapInstance}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        />
        {/* Metrics overlay — dedicated badge animation */}
        <div className="absolute top-3 right-3 z-[400] flex gap-1.5">
          {routeMetrics && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', ...spring.appleBounce, delay: 0.25 }}
              className="bg-black/75 backdrop-blur-md text-white text-[11px] px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            >
              <Navigation size={11} className="text-primary" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">
                {routeMetrics.distanceKm.toFixed(1)} km · ~{routeMetrics.durationMinutes} min
              </span>
            </motion.div>
          )}
          {riderLocation && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', ...spring.appleBounce, delay: 0.3 }}
              className="bg-black/75 backdrop-blur-md text-white text-[11px] px-2.5 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
            >
              <Clock size={12} className="text-primary" strokeWidth={2.5} />
              <span className="tabular-nums font-medium">{formatTime(riderLocation.recorded_at)}</span>
            </motion.div>
          )}
        </div>
        {isWaiting && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ease: ease.apple }}
            className="absolute bottom-0 left-0 right-0 bg-amber-50/90 backdrop-blur-md border-t border-amber-100 px-4 py-2.5 flex items-center gap-2.5 text-xs text-amber-800"
          >
            <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
              <Hourglass size={11} strokeWidth={2.5} />
            </div>
            <span className="font-medium">Preparing your order — a rider will be assigned shortly</span>
          </motion.div>
        )}
      </motion.div>

      {/* Info row — staggered */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
        }}
        className="grid grid-cols-3 gap-4 px-4 py-3.5 text-xs border-t border-gray-50/80 bg-gray-50/30"
      >
        {[
          { label: 'From', value: storeName, align: 'left' },
          { label: 'Rider', value: riderName || (hasRider ? 'Rider assigned' : '—'), align: 'center', primary: true },
          { label: 'To', value: deliveryAddress || 'Delivery', align: 'right' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            variants={{
              hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 6, filter: 'blur(3px)' },
              visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.3, ease: ease.apple } },
            }}
            className={item.align === 'center' ? 'text-center' : item.align === 'right' ? 'text-right' : ''}
          >
            <p className="text-gray-400 uppercase tracking-wider text-[10px] font-semibold">{item.label}</p>
            <p className={`font-medium truncate mt-0.5 text-[12px] tracking-tight ${item.primary ? 'text-primary' : 'text-gray-900'}`}>{item.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
