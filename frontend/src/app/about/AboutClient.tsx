'use client'

import { motion } from 'motion/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function AboutClient() {
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-6">About Checkstar</h1>
          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-500 leading-relaxed">
              Checkstar is a Durban-based supermarket chain with three physical stores serving the community. We are
              rebuilding our online presence to bring fresh groceries and convenient delivery to more customers across
              the city.
            </p>
            <p className="text-gray-500 leading-relaxed mt-4">
              Our motorbike Rider delivery service ensures that your order arrives fast and fresh. We are committed to
              quality, community, and convenience.
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
