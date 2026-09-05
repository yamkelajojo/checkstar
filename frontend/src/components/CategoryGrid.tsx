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
    <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {categories.map(cat => (
        <motion.div key={cat.id} variants={item}>
          <Link
            href={`/products?category=${cat.slug}`}
            className="block bg-white rounded-lg border border-gray-100 overflow-hidden text-center hover:border-primary/30 hover:shadow-sm transition-all"
          >
            {/* Category photo slot: shows automatically once the backend
                serves a category image; text tile until then. */}
            {cat.image ? (
              <div className="relative aspect-[4/3] bg-gray-50">
                <SafeImage src={cat.image} alt="" fill sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 16vw" className="object-cover" />
              </div>
            ) : (
              cat.icon && <div className="text-xl mt-3 mb-1.5">{cat.icon}</div>
            )}
            <h3 className={`font-medium text-xs leading-tight ${cat.image ? 'px-2 py-2' : 'px-3 pb-3'}`}>{cat.name}</h3>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
