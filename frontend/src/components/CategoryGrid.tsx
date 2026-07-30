'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
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
    <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map(cat => (
        <motion.div key={cat.id} variants={item}>
          <Link
            href={`/products?category=${cat.slug}`}
            className="block bg-white rounded-xl border border-gray-100 p-6 text-center hover:border-primary/30 hover:shadow-sm transition-all"
          >
            {cat.icon && <div className="text-3xl mb-2">{cat.icon}</div>}
            <h3 className="font-medium text-sm">{cat.name}</h3>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
