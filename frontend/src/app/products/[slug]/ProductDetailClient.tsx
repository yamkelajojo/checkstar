'use client'

import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ShoppingCart, ChevronLeft, Tag, Package } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { useCartStore } from '@/stores/cart-store'
import { api } from '@/lib/api'
import type { Product } from '@/types'

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    api.getProduct(slug)
      .then(data => {
        // data could be Product directly or { data: Product }
        setProduct((data as any).data ?? data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-50 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-50 rounded w-3/4" />
              <div className="h-4 bg-gray-50 rounded w-1/4" />
              <div className="h-10 bg-gray-50 rounded w-1/3" />
              <div className="h-20 bg-gray-50 rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-400 text-lg">Product not found.</p>
          <Link href="/products" className="text-primary hover:underline mt-4 inline-block">
            Back to products
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  const price = product.sale_price ?? product.price
  const hasSale = product.sale_price !== null

  const handleAddToCart = () => {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary mb-8 transition-colors">
            <ChevronLeft size={16} />
            Back to Products
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center p-8"
          >
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <Package size={64} className="text-gray-200" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <p className="text-sm text-gray-400 mb-4">{product.unit}</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-bold text-3xl text-gray-900">R{price.toFixed(2)}</span>
              {hasSale && (
                <>
                  <span className="text-lg text-gray-400 line-through">R{product.price.toFixed(2)}</span>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    Sale
                  </span>
                </>
              )}
            </div>

            {product.description && (
              <p className="text-gray-500 leading-relaxed mb-6">{product.description}</p>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <Tag size={16} className="text-gray-400 mt-0.5" />
                {product.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                added ? 'bg-green-600' : 'bg-primary hover:bg-primary-dark'
              }`}
            >
              <ShoppingCart size={18} />
              {added ? 'Added!' : 'Add to Cart'}
            </motion.button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
