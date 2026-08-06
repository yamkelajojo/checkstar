'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Search, SlidersHorizontal } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import CategoryGrid from '@/components/CategoryGrid'
import type { Product, Category } from '@/types'
import { useAllProducts, useCategories } from '@/lib/query'

export default function ProductsClient() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: products = [], isLoading: productsLoading, error: productsError } = useAllProducts()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()

  const loading = productsLoading || categoriesLoading
  const fetchError = productsError || categoriesError ? 'Failed to load products' : null

  const filtered = products.filter(p => {
    const matchesCategory = activeCategory ? p.category_id === activeCategory : true
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    return matchesCategory && matchesSearch
  })

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-2">Products</h1>
          <p className="text-gray-500 mb-8">Browse our full range of groceries and household essentials.</p>

          <div className="relative max-w-md mb-8">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>

          {categories.length > 0 && (
            <div className="mb-8">
              <CategoryGrid categories={categories} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {fetchError ? (
            <div className="text-center py-16 text-red-500">
              <p className="text-lg font-medium">{fetchError}</p>
              <p className="text-sm mt-1">Please try again later.</p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-1">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
