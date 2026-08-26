'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { MapPin, Phone, Clock, ChevronLeft, Navigation, Mail } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/query'
import 'leaflet/dist/leaflet.css'

export default function StoreDetailClient({ slug }: { slug: string }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  const { data: store, isLoading: loading, error } = useStore(slug)
  const fetchError = error ? 'Failed to load store' : null

  useEffect(() => {
    if (!store || !mapRef.current) return
    const s = store
    const el = mapRef.current
    let cancelled = false
    let map: any = null

    async function initMap() {
      const L = await import('leaflet')
      if (cancelled) return
      // Avoid mutating global prototype on every mount
      if (!(L.Icon.Default.prototype as any)._checkstarPatched) {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })
        ;(L.Icon.Default.prototype as any)._checkstarPatched = true
      }

      // Clean previous map if re-initializing (slug change)
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch {}
        mapInstanceRef.current = null
      }
      if (el.dataset.initialized) delete el.dataset.initialized

      map = L.map(el).setView([s.latitude, s.longitude], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      L.marker([s.latitude, s.longitude])
        .addTo(map)
        .bindPopup(`<strong>${s.name}</strong><br/>${s.address}`)
        .openPopup()

      el.dataset.initialized = 'true'
      mapInstanceRef.current = map
      // Fix tiles not rendering until resize
      setTimeout(() => { try { map.invalidateSize() } catch {} }, 100)
    }

    initMap()

    return () => {
      cancelled = true
      if (map) {
        try { map.remove() } catch {}
      }
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove() } catch {}
        mapInstanceRef.current = null
      }
      if (el) delete el.dataset.initialized
    }
  }, [store])

  const renderTradingHours = () => {
    if (!store?.trading_hours) return null
    if (typeof store.trading_hours === 'object') {
      return (
        <table className="w-full text-sm">
          <tbody>
            {Object.entries(store.trading_hours).map(([day, hours]) => (
              <tr key={day} className="border-b border-gray-50">
                <td className="py-1.5 font-medium capitalize text-gray-700">{day}</td>
                <td className="py-1.5 text-gray-500">{String(hours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    return <p className="text-gray-500">{String(store.trading_hours)}</p>
  }

  if (fetchError) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-red-500 text-lg font-medium">{fetchError}</p>
          <p className="text-sm text-gray-400 mt-1">Please try again later.</p>
          <Link href="/stores" className="text-primary hover:underline mt-4 inline-block">Back to stores</Link>
        </main>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-50 rounded w-1/4" />
            <div className="h-10 bg-gray-50 rounded w-1/2" />
            <div className="h-[300px] bg-gray-50 rounded-xl" />
          </div>
        </main>
      </>
    )
  }

  if (!store) {
    return (
      <>
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-400 text-lg">Store not found.</p>
          <Link href="/stores" className="text-primary hover:underline mt-4 inline-block">Back to stores</Link>
        </main>
      </>
    )
  }

  return (
    <>
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/stores" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-8 transition-colors">
            <ChevronLeft size={16} />
            All Stores
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div>
              <h1 className="font-display text-3xl font-bold mb-1">{store.name}</h1>
              <div className="flex items-center gap-1.5 text-sm text-gray-400">
                <MapPin size={14} />
                <span>{store.address}, {store.city}</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-primary" />
                <span className="text-gray-600">{store.phone}</span>
              </div>
              {store.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-primary" />
                  <span className="text-gray-600">{store.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Navigation size={16} className="text-primary" />
                <span className="text-gray-600">{store.delivery_radius_km}km delivery radius</span>
              </div>
            </div>

            <div>
              <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Trading Hours
              </h3>
              {renderTradingHours()}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 h-[400px] rounded-xl overflow-hidden border border-gray-100"
          >
            <div ref={mapRef} className="w-full h-full" />
          </motion.div>
        </div>
      </main>
    </>
  )
}
