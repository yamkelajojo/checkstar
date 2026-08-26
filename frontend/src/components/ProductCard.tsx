'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart-store'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
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
        <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center p-3">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <div className="text-gray-300 text-sm">No image</div>
          )}
        </div>
      </Link>

      <div className="p-3">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">{product.name}</h3>
        </Link>
        <p className="text-xs text-gray-400 mb-3">{product.unit}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-gray-900">R{price.toFixed(2)}</span>
            {hasSale && (
              <span className="text-xs text-gray-400 line-through">R{Number(product.price).toFixed(2)}</span>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => addItem(product)}
            className="bg-primary text-white p-1.5 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <ShoppingCart size={15} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
