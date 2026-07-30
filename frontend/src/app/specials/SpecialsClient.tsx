'use client'

import { motion } from 'motion/react'
import { Calendar, Clock, Tag } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ProductCard from '@/components/ProductCard'
import { useSpecials } from '@/lib/query'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SpecialsClient() {
  const { data: specials = [], isLoading: loading, error } = useSpecials()
  const fetchError = error ? 'Failed to load specials' : null

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Specials</h1>
          <p className="text-gray-500 mb-12">Limited-time offers on your favourite products.</p>
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
          <div className="text-center py-16 text-gray-400">
            <Tag size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg">No specials right now</p>
            <p className="text-sm mt-1">Check back soon for new deals.</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-16">
            {specials.map(special => {
              const active = new Date(special.start_date) <= new Date() && new Date(special.end_date) >= new Date()
              return (
                <motion.div key={special.id} variants={fadeUp}>
                  {special.banner_image && (
                    <div className="relative aspect-[3/1] rounded-xl overflow-hidden mb-6">
                      <img
                        src={special.banner_image}
                        alt={special.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center p-8">
                        <div>
                          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
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
                      <h2 className="font-display text-2xl font-bold">{special.title}</h2>
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
                      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {active ? 'Active' : 'Ended'}
                    </span>
                  </div>

                  {special.products && special.products.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
      <Footer />
    </>
  )
}
