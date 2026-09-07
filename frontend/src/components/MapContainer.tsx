'use client'

import React, { useEffect, useRef, useState } from 'react'
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

/**
 * Locator-badge navy from the Checkstar store-locator mark (the dark disc
 * behind the star) — shared with the mobile StorePin so both platforms
 * render the identical pin.
 */
export const PIN_BADGE_NAVY = '#262D3A'

/**
 * Checkstar-branded store pin: the brand-orange teardrop with the navy
 * locator badge and white star mark, replacing Leaflet's default blue
 * marker on every map surface.
 */
function checkstarPinIcon(L: any) {
  return L.divIcon({
    className: 'checkstar-map-pin',
    html: `
      <svg width="30" height="40" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Checkstar store location">
        <path d="M18 1C8.6 1 1 8.6 1 18c0 5.5 3.2 11.6 6.4 16.4 3.3 5 6.9 9 8.9 11 .9.9 2.5.9 3.4 0 2-2 5.6-6 8.9-11C31.8 29.6 35 23.5 35 18 35 8.6 27.4 1 18 1z"
          fill="#EB6522" stroke="#ffffff" stroke-width="2"/>
        <circle cx="18" cy="17" r="9.5" fill="${PIN_BADGE_NAVY}"/>
        <g transform="translate(12.85, 11.55) scale(0.43)">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="#ffffff"/>
        </g>
      </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -38],
    tooltipAnchor: [0, -34],
  })
}

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
  // Set when the component unmounts while the leaflet chunk is still being
  // imported — the pending init must not attach a map to a detached element.
  const disposedRef = useRef(false)
  // True when map tiles cannot be fetched (offline / blocked hosts): the map
  // would otherwise be a silent black rectangle with no explanation.
  const [tilesUnavailable, setTilesUnavailable] = useState(false)
  // Flips once the Leaflet chunk has imported and the map instance exists.
  // Marker/fitBounds effects depend on it: data that arrives BEFORE the map
  // is ready would otherwise be dropped forever (the effect bails on a null
  // map and its props never change again) — pins silently missing.
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    const el = mapRef.current
    if (!el || initializedRef.current) return
    initializedRef.current = true
    disposedRef.current = false
    const mapEl = el
    const { center: initialCenter, zoom: initialZoom, onMapReady: initialOnMapReady } = initialPropsRef.current

    let map: any = null

    async function initMap() {
      const L = await import('leaflet')
      leafletRef.current = L

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

      // Graceful degradation: if tiles keep failing (offline, blocked hosts,
      // firewall) say so on the map instead of leaving a black rectangle.
      let tileErrors = 0
      let tilesLoaded = 0
      tileLayer.on('tileerror', () => {
        tileErrors += 1
        if (tileErrors >= 3 && tilesLoaded === 0) setTilesUnavailable(true)
      })
      tileLayer.on('tileload', () => {
        tilesLoaded += 1
        setTilesUnavailable(false)
      })

      tileLayer.addTo(map)

      if (disposedRef.current) {
        // Unmounted while the chunk was loading — tear down immediately.
        try { map.remove() } catch {}
        return
      }
      mapInstance.current = map
      setMapReady(true)

      map!.whenReady(() => {
        setTimeout(() => {
          try { map!.invalidateSize() } catch {}
        }, 100)
      })

      if (initialOnMapReady) initialOnMapReady(map)
    }

    initMap()

    return () => {
      disposedRef.current = true
      if (map) {
        try { map.remove() } catch {}
      }
      if (mapInstance.current) {
        try { mapInstance.current.remove() } catch {}
        mapInstance.current = null
      }
      setMapReady(false)
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
      const marker = L.marker(position, { icon: checkstarPinIcon(L) }).addTo(map)
      if (popup) marker.bindPopup(popup)
      if (tooltip) marker.bindTooltip(tooltip)
      markersRef.current.push(marker)
    })
  }, [markers, mapReady])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !fitBounds || fitBounds.length === 0) return
    map.fitBounds(fitBounds, { padding: [50, 50] })
  }, [fitBounds, mapReady])

  return (
    <div
      ref={mapRef}
      className={`MapContainer ${className}`}
      style={style}
    >
      {tilesUnavailable && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-[#090B10]/70 px-6 text-center"
        >
          <p className="text-sm text-slate-300">
            Map unavailable right now — check your connection. Store details are
            listed below.
          </p>
        </div>
      )}
    </div>
  )
}
