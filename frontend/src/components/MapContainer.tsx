'use client'

import { useEffect, useRef } from 'react'
import './MapContainer.css'

export interface MapMarker {
  position: [number, number]
  popup?: string
  tooltip?: string
}

export interface MapContainerProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  className?: string
  style?: React.CSSProperties
  onMapReady?: (map: any) => void
  fitBounds?: [number, number][]
}

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors'

const DURBAN_CENTER: [number, number] = [-29.825, 31.00]
const DEFAULT_ZOOM = 12.5

export default function MapContainer({
  center = DURBAN_CENTER,
  zoom = DEFAULT_ZOOM,
  markers = [],
  className = '',
  style,
  onMapReady,
  fitBounds,
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const leafletRef = useRef<any>(null)
  const initializedRef = useRef(false)
  // The map is initialised once on mount with the mount-time center/zoom;
  // later prop changes are handled by the separate view-sync effects below.
  const initialPropsRef = useRef({ center, zoom, onMapReady })
  initialPropsRef.current = { center, zoom, onMapReady }

  useEffect(() => {
    const el = mapRef.current
    if (!el || initializedRef.current) return
    initializedRef.current = true
    const mapEl = el
    const { center: initialCenter, zoom: initialZoom, onMapReady: initialOnMapReady } = initialPropsRef.current

    let map: any = null

    async function initMap() {
      const L = await import('leaflet')
      leafletRef.current = L

      if (!(L.Icon.Default.prototype as any)._checkstarPatched) {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
        ;(L.Icon.Default.prototype as any)._checkstarPatched = true
      }

      map = L.map(mapEl, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
        attributionControl: true,
      })

      const tileUrl = TILE_URL
      const tileAttr = TILE_ATTRIBUTION

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: tileAttr,
        maxZoom: 18,
      })

      tileLayer.addTo(map)
      mapInstance.current = map

      map!.whenReady(() => {
        setTimeout(() => {
          try { map!.invalidateSize() } catch {}
        }, 100)
      })

      if (initialOnMapReady) initialOnMapReady(map)
    }

    initMap()

    return () => {
      if (map) {
        try { map.remove() } catch {}
      }
      if (mapInstance.current) {
        try { mapInstance.current.remove() } catch {}
        mapInstance.current = null
      }
      initializedRef.current = false
    }
  }, [])

  useEffect(() => {
    const L = leafletRef.current
    const map = mapInstance.current
    if (!L || !map) return

    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []

    markers.forEach(({ position, popup, tooltip }) => {
      const marker = L.marker(position).addTo(map)
      if (popup) marker.bindPopup(popup)
      if (tooltip) marker.bindTooltip(tooltip)
      markersRef.current.push(marker)
    })
  }, [markers])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !fitBounds || fitBounds.length === 0) return
    map.fitBounds(fitBounds, { padding: [50, 50] })
  }, [fitBounds])

  return (
    <div
      ref={mapRef}
      className={`MapContainer ${className}`}
      style={style}
    />
  )
}
