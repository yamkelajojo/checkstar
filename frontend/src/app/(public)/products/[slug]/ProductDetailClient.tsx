'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ShoppingCart, ChevronLeft, Tag, Package } from 'lucide-react'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { useCartStore } from '@/stores/cart-store'
import { emitCartAdded } from '@/lib/cart-events'
import { useProduct, useRelatedProducts } from '@/lib/query'

function ProductPrice({ product }: { product: { effective_price?: number | null; sale_price: number | null; price: number } }) {
  const price = Number(product.effective_price ?? product.sale_price ?? product.price)
  const hasSale = product.effective_price !== null && product.effective_price !== undefined && product.effective_price < product.price
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-bold text-lg text-gray-900">R{price.toFixed(2)}</span>
      {hasSale && <span className="text-sm text-gray-500 line-through">R{Number(product.price).toFixed(2)}</span>}
    </div>
  )
}

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { data: product, isLoading: loading, error } = useProduct(slug)
  const { data: related, isLoading: relatedLoading } = useRelatedProducts(slug)
  const fetchError = error ? "Couldn't load product details" : null
  const [added, setAdded] = useState(false)
  const addItem = useCartStore(s => s.addItem)

  // Scroll-triggered CTA morph: the inline "Add to Cart" morphs into a fixed
  // button pinned to the bottom-right once the inline button scrolls out of
  // view (so it stays reachable while browsing further down), and morphs back
  // when the inline button re-enters the viewport.
  const ctaButtonRef = useRef<HTMLButtonElement | null>(null)
  const [ctaButtonInView, setCtaButtonInView] = useState(true)
  // Portalled to <body>: the page transition leaves a blur filter on the
  // layout's main element, and any filtered ancestor becomes the containing
  // block for position:fixed — which would pin the button to the page
  // instead of the viewport.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    const el = ctaButtonRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => setCtaButtonInView(entry.isIntersecting),
      { threshold: 0 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [product])

  if (fetchError) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-red-500 text-lg font-medium">{fetchError}</p>
          <p className="text-sm text-gray-500 mt-1">Give it another try in a moment.</p>
          <Link href="/products" className="text-primary hover:underline mt-4 inline-block">Back to products</Link>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-50 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-gray-50 rounded w-3/4" />
              <div className="h-4 bg-gray-50 rounded w-1/4" />
              <div className="h-10 bg-gray-50 rounded w-1/3" />
              <div className="h-20 bg-gray-50 rounded" />
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="text-gray-500 text-lg">Product not found.</p>
          <Link href="/products" className="text-primary hover:underline mt-4 inline-block">
            Back to products
          </Link>
        </div>
      </>
    )
  }

  const price = Number(product.effective_price ?? product.sale_price ?? product.price)
  const hasSale = product.effective_price !== null && product.effective_price !== undefined && product.effective_price < product.price

  const handleAddToCart = () => {
    addItem(product)
    emitCartAdded(product.name)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const ctaLabel = added ? 'Added!' : 'Add to Cart'

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-8 transition-colors">
            <ChevronLeft size={16} />
            Back to Products
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-square bg-gray-50 rounded-2xl flex items-center justify-center p-8"
          >
            {product.image ? (
              <SafeImage src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-8" />
            ) : (
              <Package size={64} className="text-gray-200" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>
            <p className="text-sm text-gray-500 mb-4">{product.unit}</p>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-bold text-3xl text-gray-900">R{price.toFixed(2)}</span>
              {hasSale && (
                <>
                  <span className="text-lg text-gray-500 line-through">R{Number(product.price).toFixed(2)}</span>
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

            {/* The inline CTA morphs away while the related shelf is on screen
                (its fixed twin is visible bottom-right), and morphs back when
                the shelf scrolls out of view. */}
            <AnimatePresence mode="wait" initial={false}>
              {ctaButtonInView && (
                <motion.button
                  key="inline-cta"
                  ref={ctaButtonRef}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddToCart}
                  className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                    added ? 'bg-green-600' : 'bg-primary hover:bg-primary-dark'
                  }`}
                >
                  <ShoppingCart size={18} />
                  {ctaLabel}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Related / recommended items */}
        <section
          aria-label="Related products"
          className="mt-16"
          data-testid="related-products"
        >
          <h2 className="font-display text-lg sm:text-xl font-bold mb-6">You might also like</h2>

          {relatedLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse" aria-hidden="true">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="bg-gray-50 rounded-xl aspect-[3/4]" />
              ))}
            </div>
          ) : related && related.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map(item => {
                const itemPrice = Number(item.effective_price ?? item.sale_price ?? item.price)
                const itemOnSale = item.effective_price !== null && item.effective_price !== undefined && item.effective_price < item.price
                return (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
                      {item.image ? (
                        <SafeImage src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain p-4 group-hover:scale-105 transition-transform" />
                      ) : (
                        <Package size={28} className="text-gray-200" />
                      )}
                      {itemOnSale && (
                        <span className="absolute top-2 left-2 bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          Sale
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-2 mb-1">{item.name}</p>
                      <p className="text-xs text-gray-400 mb-2">{item.unit}</p>
                      <ProductPrice product={item} />
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </section>
      </div>

      {/* Fixed CTA — visible when the inline button scrolls out of view.
          Adds the product you are viewing. Portalled to <body> so it is
          truly viewport-fixed. */}
      {mounted ? createPortal(
      <AnimatePresence>
        {!ctaButtonInView && (
          <motion.button
            key="floating-cta"
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            whileTap={{ scale: 0.93 }}
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full shadow-lg px-5 py-3.5 font-medium text-white transition-colors ${
              added ? 'bg-green-600' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            <ShoppingCart size={18} />
            <span className="text-sm">{added ? 'Added!' : 'Add to Cart'}</span>
            <span className="text-sm font-semibold border-l border-white/30 pl-2.5">R{price.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>,
      document.body,
      ) : null}
    </>
  )
}
