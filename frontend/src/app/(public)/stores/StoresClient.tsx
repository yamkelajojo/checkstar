'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import StoreCard from '@/components/StoreCard'
import MapContainer from '@/components/MapContainer'
import type { MapMarker } from '@/components/MapContainer'
import { useStores } from '@/lib/query'

export default function StoresClient() {
  const { data: stores = [], isLoading: loading, error } = useStores()
  const fetchError = error ? 'Failed to load stores' : null

  const markers: MapMarker[] = useMemo(
    () =>
      stores.map(s => ({
        position: [s.latitude, s.longitude] as [number, number],
        popup: `<strong>${s.name}</strong><br/>${s.address}, ${s.city}`,
      })),
    [stores]
  )

  const bounds = useMemo(
    () => stores.map(s => [s.latitude, s.longitude] as [number, number]),
    [stores]
  )

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Our Stores</h1>
          <p className="text-gray-500 mb-8">Find a Checkstar store near you in Durban.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-[400px] rounded-xl overflow-hidden border border-white/5 mb-12"
        >
          <MapContainer
            center={[-29.825, 31.00]}
            zoom={11}
            markers={markers}
            fitBounds={bounds.length > 0 ? bounds : undefined}
          />
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
    </>
  )
}
