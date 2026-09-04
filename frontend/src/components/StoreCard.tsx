'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { MapPin, Phone, Clock } from 'lucide-react'
import type { Store } from '@/types'

interface Props {
  store: Store
}

export default function StoreCard({ store }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {store.image && (
        <div className="relative aspect-[2/1] bg-gray-50">
          <Image src={store.image} alt={store.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover" />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display text-base sm:text-lg font-semibold mb-2">{store.name}</h3>
        <div className="flex flex-col gap-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span>{store.address}, {store.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={14} />
            <span>{store.phone}</span>
          </div>
          {store.delivery_radius_km && (
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>{store.delivery_radius_km}km delivery radius</span>
            </div>
          )}
        </div>
        <Link
          href={`/stores/${store.slug}`}
          className="inline-block text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          View details &rarr;
        </Link>
      </div>
    </motion.div>
  )
}
