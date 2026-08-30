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

interface MapLayerTogglesProps {
  map: any
  onToggle?: (layerId: string, active: boolean) => void
}

export default function MapLayerToggles({ map, onToggle }: MapLayerTogglesProps) {
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
        } else if (!wasActive) {
          const layer = createOverlayLayer(layerId, map)
          if (layer) {
            layer.addTo(map)
            layersRef.current.set(layerId, layer)
          }
        }
      }

      onToggle?.(layerId, !wasActive)
      return next
    })
  }, [map, onToggle])

  useEffect(() => {
    return () => {
      layersRef.current.forEach(layer => {
        try { map?.removeLayer(layer) } catch {}
      })
      layersRef.current.clear()
    }
  }, [map])

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

function createOverlayLayer(layerId: string, map: any): any {
  const L = (window as any).L
  if (!L) return null

  switch (layerId) {
    case 'traffic': {
      // Simulated traffic circles around Durban hotspots
      const hotspots = [
        [-29.8587, 31.0218, 2000],
        [-29.7284, 31.0781, 1500],
        [-29.8193, 30.8732, 1200],
      ]
      const layer = L.layerGroup()
      hotspots.forEach(([lat, lng, radius]) => {
        L.circle([lat, lng], {
          radius,
          color: '#F59E0B',
          fillColor: '#F59E0B',
          fillOpacity: 0.15,
          weight: 1,
        }).addTo(layer)
      })
      return layer
    }
    case 'routes': {
      // Simulated delivery routes
      const routes = [
        [[-29.8587, 31.0218], [-29.845, 31.015], [-29.830, 31.010]],
        [[-29.7284, 31.0781], [-29.735, 31.065], [-29.740, 31.050]],
      ]
      const layer = L.layerGroup()
      routes.forEach(coords => {
        L.polyline(coords as any, {
          color: '#3B82F6',
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 6',
        }).addTo(layer)
      })
      return layer
    }
    case 'demand': {
      // Simulated demand heatmap
      const points = [
        [-29.8587, 31.0218, 0.8],
        [-29.850, 31.015, 0.6],
        [-29.840, 31.010, 0.4],
        [-29.7284, 31.0781, 0.7],
        [-29.735, 31.065, 0.5],
      ]
      const layer = L.layerGroup()
      points.forEach(([lat, lng, intensity]) => {
        L.circleMarker([lat, lng], {
          radius: 20 + (intensity as number) * 30,
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: (intensity as number) * 0.4,
          weight: 0,
        }).addTo(layer)
      })
      return layer
    }
    default:
      return null
  }
}
