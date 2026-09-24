'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { Calendar, MapPin, Clock, Sparkles, ChevronLeft } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useSaleDetail } from '@/lib/query'
import { fadeUp, stagger } from '@/lib/motion/variants'

function fmtDate(d: string | null | undefined) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Sale landing: the canonical destination for a sale's banner CTA.
 * Renders the sale's products at their sale prices; add-to-cart uses each
 * product's in-stock stores (the API emits the same shape as the catalogue).
 */
export default function SaleDetailClient({ slug }: { slug: string }) {
  const { data: sale, isLoading, error, refetch, isError } = useSaleDetail(slug)

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse mb-4" />
        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (isError || !sale) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Sparkles size={32} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-semibold text-gray-700">This sale isn&rsquo;t available</h1>
        <p className="text-sm text-gray-500 mt-2">
          It may have ended, or the link is out of date.
        </p>
        <Link
          href="/specials"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-6"
        >
          <ChevronLeft size={14} /> All specials
        </Link>
      </div>
    )
  }

  const inWindow = sale.in_window ?? false
  const started = new Date(sale.start_date) <= new Date()
  const ended = new Date(sale.end_date) < new Date()
  const products = sale.products ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp}>
          <Link
            href="/specials"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4"
          >
            <ChevronLeft size={14} /> All specials
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">{sale.title}</h1>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                inWindow
                  ? 'bg-green-100 text-green-700'
                  : ended
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {inWindow ? 'Live now' : ended ? 'Ended' : 'Upcoming'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              {fmtDate(sale.start_date)} — {fmtDate(sale.end_date)}
            </span>
            {sale.store && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                {sale.store.name}
              </span>
            )}
          </div>

          {sale.description && (
            <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">{sale.description}</p>
          )}

          {ended && (
            <div className="mt-5 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm max-w-2xl">
              <Clock size={16} className="shrink-0" />
              <span>
                This sale ended on {fmtDate(sale.end_date)}. Products are shown at their current prices.
              </span>
            </div>
          )}
          {!started && !ended && (
            <div className="mt-5 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm max-w-2xl">
              <Clock size={16} className="shrink-0" />
              <span>This sale starts on {fmtDate(sale.start_date)} — prices update when it goes live.</span>
            </div>
          )}
        </motion.div>

        {products.length === 0 ? (
          <div className="mt-10 text-center py-16 text-gray-500">
            <Sparkles size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium">No products in this sale yet</p>
            <p className="text-sm mt-1">Check back soon.</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map((product, i) => (
              <motion.div key={product.id} variants={fadeUp}>
                <ProductCard product={product} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
