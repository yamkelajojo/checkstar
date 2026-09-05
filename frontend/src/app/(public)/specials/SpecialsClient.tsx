'use client'

import { motion } from 'motion/react'
import Image from 'next/image'
import { mediaUrl } from '@/lib/media'
import { Calendar, Clock, Tag } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useSpecials } from '@/lib/query'
import { fadeUp, stagger } from '@/lib/motion/variants'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SpecialsClient() {
  const { data: specials = [], isLoading: loading, error } = useSpecials()
  const fetchError = error ? 'Failed to load specials' : null

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl sm:text-4xl font-bold mb-2">Specials</h1>
          <p className="text-gray-500 mb-8">Limited-time offers on your favourite products.</p>
        </motion.div>

        {fetchError ? (
          <div className="text-center py-16 text-red-500">
            <p className="text-lg font-medium">{fetchError}</p>
            <p className="text-sm mt-1">Please try again later.</p>
          </div>
        ) : loading ? (
          <div className="space-y-12">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="aspect-square bg-gray-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : specials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="text-center py-16 text-gray-400"
          >
            <Tag size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">No specials right now</p>
            <p className="text-sm mt-1">Check back soon for new deals.</p>
          </motion.div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-16">
            {specials.map(special => {
              const active = new Date(special.start_date) <= new Date() && new Date(special.end_date) >= new Date()
              return (
                <motion.div key={special.id} variants={fadeUp}>
                  {special.banner_image && (
                    <div className="relative aspect-[3/1] rounded-xl overflow-hidden mb-6">
                      <Image
                        src={special.banner_image}
                        alt={special.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center p-8">
                        <div>
                          <h2 className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-white mb-2">
                            {special.title}
                          </h2>
                          {special.description && (
                            <p className="text-white/80 text-sm max-w-lg">{special.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!special.banner_image && (
                    <div className="mb-4">
                      <h2 className="font-display text-lg sm:text-2xl font-bold">{special.title}</h2>
                      {special.description && (
                        <p className="text-gray-500 text-sm mt-1">{special.description}</p>
                      )}
                    </div>
                  )}

                  <div className={`flex items-center gap-4 text-xs ${special.banner_image ? 'mb-6' : 'mb-4'}`}>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Calendar size={14} />
                      <span>{formatDate(special.start_date)} — {formatDate(special.end_date)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-green-700'
                    }`}>
                      {active ? 'Active' : 'Ended'}
                    </span>
                  </div>

                  {special.products && special.products.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {special.products.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </main>
    </>
  )
}
