'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { MapPin, Route, BarChart3 } from 'lucide-react'

interface LayerToggle {
  id: string
  label: string
  icon: React.ElementType
  color: string
}

const LAYERS: LayerToggle[] = [
  { id: 'traffic', label: 'Traffic', icon: MapPin, color: '#F59E0B' },
  { id: 'routes', label: 'Routes', icon: Route, color: '#3B82F6' },
  { id: 'demand', label: 'Demand', icon: BarChart3, color: '#10B981' },
]

export interface MapLayerData {
  traffic: Array<{ lat: number; lng: number; count: number }>
  routes: Array<{ rider_id: number; lat: number; lng: number }>
  demand: Array<{ lat: number; lng: number; count: number }>
}

interface MapLayerTogglesProps {
  map: any
  data: MapLayerData | null
  onToggle?: (layerId: string, active: boolean) => void
}

export default function MapLayerToggles({ map, data, onToggle }: MapLayerTogglesProps) {
  const [active, setActive] = useState<Set<string>>(new Set())
  const layersRef = useRef<Map<string, any>>(new Map())

  const toggle = useCallback((layerId: string) => {
    setActive(prev => {
      const next = new Set(prev)
      const wasActive = next.has(layerId)

      if (wasActive) {
        next.delete(layerId)
      } else {
        next.add(layerId)
      }

      if (map) {
        if (wasActive && layersRef.current.has(layerId)) {
          map.removeLayer(layersRef.current.get(layerId))
          layersRef.current.delete(layerId)
        } else if (!wasActive && data) {
          const layer = buildLayer(layerId, data, map)
          if (layer) {
            layer.addTo(map)
            layersRef.current.set(layerId, layer)
          }
        }
      }

      onToggle?.(layerId, !wasActive)
      return next
    })
  }, [map, data, onToggle])

  useEffect(() => {
    const layers = layersRef.current
    return () => {
      layers.forEach(layer => {
        try { map?.removeLayer(layer) } catch {}
      })
      layers.clear()
    }
  }, [map])

  // Late-data sync: layers toggled ON before map data arrives (or map ready)
  // render nothing — once data lands, (re)build every active layer. Toggling
  // already handles the immediate add/remove path; this effect covers the
  // async case and refreshes layers when data updates underneath them.
  useEffect(() => {
    if (!map || !data) return
    active.forEach(layerId => {
      const existing = layersRef.current.get(layerId)
      if (existing) {
        try { map.removeLayer(existing) } catch {}
        layersRef.current.delete(layerId)
      }
      const layer = buildLayer(layerId, data, map)
      if (layer) {
        layer.addTo(map)
        layersRef.current.set(layerId, layer)
      }
    })
    // `active` intentionally excluded: the toggle callback owns that path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, data])

  return (
    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
      {LAYERS.map(layer => {
        const isActive = active.has(layer.id)
        const Icon = layer.icon
        return (
          <button
            key={layer.id}
            onClick={() => toggle(layer.id)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium shadow-sm transition-colors ${
              isActive
                ? 'bg-white/95 backdrop-blur border text-gray-900'
                : 'bg-white/70 backdrop-blur border border-gray-200/50 text-gray-500 hover:bg-white/90'
            }`}
            style={isActive ? { borderColor: layer.color + '40', color: layer.color } : undefined}
          >
            <Icon size={12} />
            {layer.label}
          </button>
        )
      })}
    </div>
  )
}

function buildLayer(layerId: string, data: MapLayerData, map: any): any {
  const L = (window as any).L
  if (!L) return null

  const layer = L.layerGroup()

  switch (layerId) {
    case 'traffic': {
      if (data.traffic.length === 0) return null
      const maxCount = Math.max(...data.traffic.map(p => p.count))
      data.traffic.forEach(({ lat, lng, count }) => {
        const radius = 300 + (count / maxCount) * 1700
        L.circle([lat, lng], {
          radius,
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: 0.08 + (count / maxCount) * 0.12,
          weight: 1,
        }).addTo(layer)
      })
      return layer
    }
    case 'routes': {
      if (data.routes.length === 0) return null
      data.routes.forEach(({ lat, lng }) => {
        L.circleMarker([lat, lng], {
          radius: 6,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.9,
          weight: 2,
        }).addTo(layer)
      })
      return layer
    }
    case 'demand': {
      if (data.demand.length === 0) return null
      const maxDemand = Math.max(...data.demand.map(p => p.count))
      data.demand.forEach(({ lat, lng, count }) => {
        L.circleMarker([lat, lng], {
          radius: 15 + (count / maxDemand) * 35,
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: (count / maxDemand) * 0.35,
          weight: 0,
        }).addTo(layer)
      })
      return layer
    }
    default:
      return null
  }
}
