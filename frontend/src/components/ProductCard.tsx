'use client'

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { motion, useReducedMotion } from 'motion/react'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart-store'
import { emitCartAdded } from '@/lib/cart-events'
import FavoriteHeart from '@/components/FavoriteHeart'
import { spring, ease } from '@/lib/motion/tokens'

interface Props {
  product: Product
  compact?: boolean
  index?: number
}

/**
 * Product card — Apple-polished with dedicated animation.
 * Each card arrives with blur + y + scale, not just opacity.
 * Image has its own parallax scale, button has press spring.
 * Hover lifts with shadow, not just translate.
 */
export default function ProductCard({ product, compact = false, index = 0 }: Props) {
  const addItem = useCartStore(s => s.addItem)
  const shouldReduce = useReducedMotion()
  const price = Number(product.effective_price ?? product.sale_price ?? product.price)
  const hasSale = product.effective_price != null && Number(product.effective_price) < Number(product.price)
  const saveAmount = hasSale ? Number(product.price) - Number(product.effective_price) : 0

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{
        type: 'spring',
        ...spring.apple,
        delay: index * 0.03,
      }}
      whileHover={shouldReduce ? undefined : { y: -6, scale: 1.01, transition: { type: 'spring', ...spring.snap } }}
      className="group bg-white rounded-[16px] border border-gray-100/80 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] transition-shadow duration-300"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className={`relative ${compact ? 'aspect-square' : 'aspect-[4/3]'} bg-gradient-to-br from-gray-50 to-gray-50/50 flex items-center justify-center p-3 overflow-hidden`}>
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
          {product.image ? (
            <motion.div
              initial={shouldReduce ? undefined : { scale: 0.92, filter: 'blur(4px)' }}
              whileInView={{ scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true }}
              transition={{ type: 'spring', ...spring.appleGentle, delay: index * 0.03 + 0.1 }}
              className="relative w-full h-full"
            >
              <SafeImage
                src={product.image}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
              />
            </motion.div>
          ) : (
            <div className="text-gray-300 text-sm">No image</div>
          )}
          {hasSale && (
            <motion.span
              initial={shouldReduce ? undefined : { opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', ...spring.appleBounce, delay: 0.2 }}
              className="absolute top-2.5 left-2.5 rounded-full bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] backdrop-blur-md"
            >
              Special
            </motion.span>
          )}
          <FavoriteHeart productId={product.id} />
        </div>
      </Link>

      <div className={compact ? 'p-2.5' : 'p-3 sm:p-3.5'}>
        <Link href={`/products/${product.slug}`}>
          {!compact && product.unit && (
            <p className="text-[10px] sm:text-[11px] uppercase tracking-wider text-gray-500/80 mb-1.5 truncate font-medium">{product.unit}</p>
          )}
          <h3 className={`font-semibold ${compact ? 'text-xs' : 'text-[13px] sm:text-sm'} text-gray-900 line-clamp-2 leading-snug ${compact ? '' : 'min-h-[2.4em]'} group-hover:text-primary transition-colors duration-200`}>{product.name}</h3>
        </Link>

        <div className="flex items-end justify-between gap-2 mt-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <span className={`font-bold ${compact ? 'text-sm' : 'text-sm sm:text-[15px]'} text-gray-900 tabular-nums tracking-tight`}>R{price.toFixed(2)}</span>
              {hasSale && (
                <span className="text-[11px] sm:text-xs text-gray-400 line-through tabular-nums">R{Number(product.price).toFixed(2)}</span>
              )}
            </div>
            {hasSale && !compact && (
              <motion.span
                initial={shouldReduce ? undefined : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', ...spring.snap }}
                className="inline-flex bg-primary/10 text-primary text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums w-fit"
              >
                Save R{saveAmount.toFixed(2)}
              </motion.span>
            )}
          </div>

          {!compact && (
            <motion.button
              whileHover={shouldReduce ? undefined : { scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', ...spring.press }}
              onClick={() => {
                addItem(product)
                emitCartAdded(product.name)
              }}
              aria-label={`Add ${product.name} to cart`}
              className="bg-primary text-white w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-[12px] hover:bg-primary-dark shadow-[0_2px_8px_rgba(235,101,34,0.25)] hover:shadow-[0_4px_12px_rgba(235,101,34,0.35)] transition-all duration-200 shrink-0"
            >
              <ShoppingCart size={16} strokeWidth={1.75} />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
