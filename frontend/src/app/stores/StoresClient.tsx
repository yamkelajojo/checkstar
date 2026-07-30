'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { MapPin, Navigation } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StoreCard from '@/components/StoreCard'
import type { Store } from '@/types'
import { useStores } from '@/lib/query'

export default function StoresClient() {
  const { data: stores = [], isLoading: loading, error } = useStores()
  const fetchError = error ? 'Failed to load stores' : null
  const [mapReady, setMapReady] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const leafletRef = useRef<any>(null)

  const initializedRef = useRef(false)

  useEffect(() => {
    const el = mapRef.current
    if (!el || initializedRef.current) return
    initializedRef.current = true

    async function initMap() {
      const L = await import('leaflet')
      leafletRef.current = L
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(el).setView([-29.8587, 31.0218], 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      mapInstance.current = map
      setMapReady(true)
    }

    initMap()

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  useEffect(() => {
    const L = leafletRef.current
    if (!mapReady || !mapInstance.current || !L || stores.length === 0) return

    markersRef.current.forEach(m => mapInstance.current.removeLayer(m))
    markersRef.current = []

    const bounds: [number, number][] = []

    stores.forEach(store => {
      const marker = L.marker([store.latitude, store.longitude])
        .addTo(mapInstance.current)
        .bindPopup(
          `<strong>${store.name}</strong><br/>${store.address}, ${store.city}`
        )
      markersRef.current.push(marker)
      bounds.push([store.latitude, store.longitude])
    })

    if (bounds.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [stores, mapReady])

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Our Stores</h1>
          <p className="text-gray-500 mb-8">Find a Checkstar store near you in Durban.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-[400px] rounded-xl overflow-hidden border border-gray-100 mb-12"
        >
          <div ref={mapRef} className="w-full h-full" />
        </motion.div>

        {fetchError ? (
          <div className="text-center py-16 text-red-500">
            <p className="text-lg font-medium">{fetchError}</p>
            <p className="text-sm mt-1">Please try again later.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {stores.map(store => (
              <StoreCard key={store.id} store={store} />
            ))}
          </motion.div>
        )}
      </main>
      <Footer />
    </>
  )
}
