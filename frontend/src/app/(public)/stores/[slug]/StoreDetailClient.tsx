'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import { MapPin, Phone, Clock, ChevronLeft, Navigation, Mail } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/query'
import MapContainer from '@/components/MapContainer'
import type { MapMarker } from '@/components/MapContainer'

export default function StoreDetailClient({ slug }: { slug: string }) {
  const { data: store, isLoading: loading, error } = useStore(slug)
  const fetchError = error ? 'Failed to load store' : null

  const markers: MapMarker[] = useMemo(
    () =>
      store
        ? [
            {
              position: [store.latitude, store.longitude] as [number, number],
              popup: `<strong>${store.name}</strong><br/>${store.address}`,
            },
          ]
        : [],
    [store]
  )

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
            className="lg:col-span-3 h-[400px] rounded-xl overflow-hidden border border-white/5"
          >
            <MapContainer
              center={[store.latitude, store.longitude]}
              zoom={15}
              markers={markers}
            />
          </motion.div>
        </div>
      </main>
    </>
  )
}
