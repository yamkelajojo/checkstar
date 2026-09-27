'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import SafeImage from '@/components/SafeImage'
import type { Category } from '@/types'
import { categoryImages } from '@/lib/category-images'
import { spring, ease } from '@/lib/motion/tokens'

interface Props {
  categories: Array<Category & { image?: string | null }>
}

export default function CategoryGrid({ categories }: Props) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
      }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-6"
    >
      {categories.map((cat, idx) => {
        const image = cat.image || categoryImages[cat.slug] || null
        return (
          <motion.div
            key={cat.id}
            variants={{
              hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94, filter: 'blur(6px)' },
              visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { type: 'spring', ...spring.apple, delay: idx * 0.02 } },
            }}
            whileHover={shouldReduce ? undefined : { y: -4, scale: 1.02, transition: { type: 'spring', ...spring.snap } }}
            whileTap={{ scale: 0.97 }}
          >
            <Link
              href={`/products?category=${cat.slug}`}
              className="group block rounded-card bg-[#211B16] p-3 ring-1 ring-white/10 shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:ring-[#EB6522]/50 transition-all duration-500"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-button bg-white/[0.04] border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none z-10" />
                {image ? (
                  <SafeImage
                    src={image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {cat.icon ? (
                      <span className="text-4xl">{cat.icon}</span>
                    ) : (
                      <span className="font-serif text-lg font-medium text-[#F3ECE1]/40">{cat.name}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="px-1 pb-1 pt-3">
                <p className="truncate font-serif text-[14px] font-medium leading-5 text-[#F3ECE1] tracking-tight group-hover:text-white transition-colors">
                  {cat.name}
                </p>
                <p className="text-[11px] text-[#F3ECE1]/40 mt-0.5 font-medium">Explore →</p>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
