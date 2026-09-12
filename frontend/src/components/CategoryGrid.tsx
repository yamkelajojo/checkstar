'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import SafeImage from '@/components/SafeImage'
import type { Category } from '@/types'

interface Props {
  categories: Array<Category & { image?: string | null }>
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function CategoryGrid({ categories }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-6"
    >
      {categories.map(cat => (
        <motion.div key={cat.id} variants={item}>
          <Link
            href={`/products?category=${cat.slug}`}
            className="group block rounded-2xl bg-[#211B16] p-3 ring-1 ring-white/10 transition-all duration-300 hover:ring-[#EB6522]/70"
          >
            {/* Category image — 3:4 portrait with rounded corners */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-white/5">
              {cat.image ? (
                <SafeImage
                  src={cat.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover opacity-90 transition-all duration-500 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
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

            {/* Text area — category name in serif cream */}
            <div className="px-1 pb-1 pt-3">
              <p className="truncate font-serif text-[15px] font-medium leading-5 text-[#F3ECE1]">
                {cat.name}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
