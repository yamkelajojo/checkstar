'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { motion } from 'motion/react'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart-store'
import { emitCartAdded } from '@/lib/cart-events'

interface Props {
  product: Product
  compact?: boolean
}

export default function ProductCard({ product, compact = false }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const price = Number(product.effective_price ?? product.sale_price ?? product.price)
  const hasSale = product.effective_price != null && Number(product.effective_price) < Number(product.price)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <Link href={`/products/${product.slug}`}>
        <div className={`relative ${compact ? 'aspect-square' : 'aspect-[4/3]'} bg-gray-50 flex items-center justify-center p-3`}>
          {product.image ? (
            <SafeImage
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain"
            />
          ) : (
            <div className="text-gray-300 text-sm">No image</div>
          )}
          {hasSale && (
            <span className="absolute top-2 left-2 rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
              Special
            </span>
          )}
        </div>
      </Link>

      <div className={compact ? 'p-2' : 'p-3'}>
        <Link href={`/products/${product.slug}`}>
          <h3 className={`font-medium ${compact ? 'text-xs' : 'text-sm'} text-gray-900 line-clamp-2 mb-1`}>{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-500 mb-3">{product.unit}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${compact ? 'text-sm' : 'text-base'} text-gray-900`}>R{price.toFixed(2)}</span>
            {hasSale && (
              <span className="text-xs text-gray-500 line-through">R{Number(product.price).toFixed(2)}</span>
            )}
          </div>

          {!compact && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                addItem(product)
                emitCartAdded(product.name)
              }}
              aria-label={`Add ${product.name} to cart`}
              className="bg-primary text-white w-10 h-10 flex items-center justify-center rounded-lg hover:bg-primary-dark transition-colors"
            >
              <ShoppingCart size={16} strokeWidth={1.5} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
