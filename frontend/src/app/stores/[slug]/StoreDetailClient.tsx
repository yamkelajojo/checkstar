'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { MapPin, Phone, Clock, ChevronLeft, Navigation, Mail } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import type { Store } from '@/types'

export default function StoreDetailClient({ slug }: { slug: string }) {
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.getStore(slug)
      .then(data => setStore((data as any).data ?? data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  useEffect(() => {
    if (!store || !mapRef.current || mapRef.current.dataset.initialized) return
    const s = store

    async function initMap() {
      const L = await import('leaflet')
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!).setView([s.latitude, s.longitude], 15)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      L.marker([s.latitude, s.longitude])
        .addTo(map)
        .bindPopup(`<strong>${s.name}</strong><br/>${s.address}`)
        .openPopup()

      mapRef.current!.dataset.initialized = 'true'
    }

    initMap()
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

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-50 rounded w-1/4" />
            <div className="h-10 bg-gray-50 rounded w-1/2" />
            <div className="h-[300px] bg-gray-50 rounded-xl" />
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!store) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400 text-lg">Store not found.</p>
          <Link href="/stores" className="text-primary hover:underline mt-4 inline-block">Back to stores</Link>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
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
      <Footer />
    </>
  )
}
