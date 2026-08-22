'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Search, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types'
import { useAllProducts } from '@/lib/query'

export const FILTER_GROUPS = [
  { label: 'All', ids: null as number[] | null },
  { label: 'Fresh', ids: [1, 2, 3, 4] as number[] },
  { label: 'Pantry', ids: [7, 8, 14] as number[] },
  { label: 'Drinks', ids: [5, 12] as number[] },
  { label: 'Home', ids: [9, 13] as number[] },
  { label: 'Care', ids: [10, 11] as number[] },
  { label: 'Other', ids: [6, 15] as number[] },
] as const

export default function ProductsClient() {
  const [activeGroup, setActiveGroup] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: products = [], isLoading: productsLoading, error: productsError } = useAllProducts()

  const loading = productsLoading
  const fetchError = productsError ? 'Failed to load products' : null

  const filtered = products.filter(p => {
    const activeIds = FILTER_GROUPS.find(g => g.label === activeGroup)?.ids
    const matchesCategory = activeIds ? (activeIds as number[]).includes(p.category_id) : true
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Products</h1>
          <p className="text-gray-500 mb-6">Browse our full range of groceries and household essentials.</p>

          <div className="relative max-w-md mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="relative mb-4">
            <div
              role="tablist"
              aria-label="Filter by category"
              className="scrollbar-none flex items-center gap-2 overflow-x-auto flex-nowrap scroll-smooth snap-x snap-mandatory pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              <SlidersHorizontal size={16} className="text-gray-400 shrink-0" aria-hidden="true" />
              {FILTER_GROUPS.map(group => {
                const isActive = activeGroup === group.label
                return (
                  <button
                    key={group.label}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveGroup(isActive && group.label !== 'All' ? 'All' : group.label)}
                    className={`shrink-0 snap-start whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {group.label}
                  </button>
                )
              })}
            </div>
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent sm:hidden"
              aria-hidden="true"
            />
          </div>

          {fetchError ? (
            <div className="text-center py-16 text-red-500">
              <p className="text-lg font-medium">{fetchError}</p>
              <p className="text-sm mt-1">Please try again later.</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </>
  )
}
