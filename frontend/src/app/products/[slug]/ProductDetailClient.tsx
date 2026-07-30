'use client'

import { motion } from 'motion/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ProductDetailClient({ slug }: { slug: string }) {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold capitalize mb-6">{slug.replace(/-/g, ' ')}</h1>
          <p className="text-gray-500">Product details coming soon.</p>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
