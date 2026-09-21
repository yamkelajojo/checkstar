'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Navigation, MapPin, Clock, WifiOff, Hourglass } from 'lucide-react'
import { useOrderRiderLocation, useRouteGeometry } from '@/lib/query'
import { decodePolyline, type LatLng } from '@/lib/polyline'

const MapContainer = dynamic(() => import('@/components/MapContainer'), {
  ssr: false,
  loading: () => <div className="h-[320px] bg-gray-100 animate-pulse rounded-xl" />,
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
  const { data: geometry } = useRouteGeometry(storeLat, storeLng, deliveryLat, deliveryLng, !!(storeLat && storeLng && deliveryLat && deliveryLng))

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
        // fallback straight dashed line
        const latlngs: [number, number][] = [
          [storeLat, storeLng],
          ...(riderLocation ? [[riderLocation.latitude, riderLocation.longitude] as [number, number]] : []),
          [deliveryLat, deliveryLng],
        ]
        polylineRef.current = L.polyline(latlngs, { color: '#EB6522', weight: 2, opacity: 0.6, dashArray: '8 8' }).addTo(mapInstance)
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

  if (!hasCoords) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-8 text-center">
        <MapPin className="mx-auto text-gray-300 mb-2" size={32} />
        <p className="text-sm text-gray-500">Map unavailable — delivery coordinates not set</p>
        {deliveryAddress && <p className="text-xs text-gray-400 mt-1">{deliveryAddress}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Navigation size={18} className="text-primary" />
          <span className="text-sm font-semibold text-gray-900">{isWaiting ? 'Preparing Order' : 'Live Tracking'}</span>
        </div>
        {isWaiting ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
            <Hourglass size={12} /> Waiting for rider
          </span>
        ) : hasRider ? (
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full text-white ${isStale ? 'bg-amber-500' : 'bg-green-600'}`}>
            {isStale ? <WifiOff size={10} /> : <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            {isStale ? 'STALE' : 'LIVE'}
          </span>
        ) : null}
      </div>

      {/* Map */}
      <div style={{ height }} className="relative">
        <MapContainer
          center={storeLat && storeLng ? [storeLat, storeLng] : [-29.8587, 31.0218]}
          zoom={13}
          markers={markers}
          fitBounds={fitBounds}
          onMapReady={setMapInstance}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        />
        {/* Metrics overlay */}
        <div className="absolute top-3 right-3 z-[400] flex gap-1.5">
          {riderLocation && (
            <div className="bg-black/75 text-white text-[11px] px-2 py-1 rounded-full flex items-center gap-1">
              <Clock size={12} className="text-primary" />
              {new Date(riderLocation.recorded_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
        {isWaiting && (
          <div className="absolute bottom-0 left-0 right-0 bg-amber-50 border-t border-amber-100 px-4 py-2 flex items-center gap-2 text-xs text-amber-800">
            <Hourglass size={14} /> Preparing your order — a rider will be assigned shortly
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="grid grid-cols-3 gap-4 px-4 py-3 text-xs border-t border-gray-50">
        <div>
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">From</p>
          <p className="font-medium text-gray-900 truncate">{storeName}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">Rider</p>
          <p className="font-medium text-primary truncate">{riderName || (hasRider ? 'Rider assigned' : '—')}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 uppercase tracking-wider text-[10px]">To</p>
          <p className="font-medium text-gray-900 truncate">{deliveryAddress || 'Delivery'}</p>
        </div>
      </div>
    </div>
  )
}
