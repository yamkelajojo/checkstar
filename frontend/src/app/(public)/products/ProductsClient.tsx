'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import { Search, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types'
import { useAllProducts } from '@/lib/query'

export const FILTER_GROUPS = [
  { label: 'All', slugs: null as string[] | null },
  { label: 'Fresh', slugs: ['fruits-vegetables', 'meat-poultry', 'bakery', 'dairy-eggs'] as string[] },
  { label: 'Pantry', slugs: ['pantry-staples', 'frozen-foods', 'ready-meals-deli'] as string[] },
  { label: 'Drinks', slugs: ['beverages', 'wines-spirits'] as string[] },
  { label: 'Home', slugs: ['household', 'pet-supplies'] as string[] },
  { label: 'Care', slugs: ['baby-toddler', 'health-beauty'] as string[] },
  { label: 'Other', slugs: ['snacks-treats', 'stationery-school'] as string[] },
] as const

export default function ProductsClient() {
  const [activeGroup, setActiveGroup] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const queryParams: Record<string, string> = {}
  if (debouncedSearch) queryParams.search = debouncedSearch
  const { data: products = [], isLoading: productsLoading, error: productsError } = useAllProducts(Object.keys(queryParams).length ? queryParams : undefined)

  const loading = productsLoading
  const fetchError = productsError ? 'Failed to load products' : null

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const left = el.scrollLeft > 2
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
      setCanScrollLeft(left)
      setCanScrollRight(right)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [products.length])

  const filtered = products.filter(p => {
    const activeSlugs = FILTER_GROUPS.find(g => g.label === activeGroup)?.slugs
    if (!activeSlugs) return true
    const slug = p.category?.slug
    if (slug) return (activeSlugs as string[]).includes(slug)
    // Fallback to legacy ID mapping for resilience if category not eager-loaded
    const legacyMap: Record<string, number[]> = {
      Fresh: [1,2,3,4], Pantry: [7,8,14], Drinks: [5,12], Home: [9,13], Care: [10,11], Other: [6,15]
    }
    return legacyMap[activeGroup]?.includes((p as any).category_id) ?? true
  })

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 pt-4 pb-6 sm:pt-6 sm:pb-8 lg:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-[1.75rem] leading-tight sm:text-4xl font-bold mb-1.5 sm:mb-2">Products</h1>
          <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">Browse our full range of groceries and household essentials.</p>

          <div className="relative max-w-md mb-4 sm:mb-6">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          <div className="relative mb-4 overflow-hidden">
            <div
              ref={scrollRef}
              role="tablist"
              aria-label="Filter by category"
              className="scrollbar-none flex w-full max-w-full items-center gap-2 overflow-x-auto flex-nowrap scroll-smooth snap-x snap-mandatory pb-1 pr-1"
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
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent transition-opacity duration-200 sm:hidden ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent transition-opacity duration-200 sm:hidden ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
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
