'use client'

import { motion } from 'motion/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function ServicesClient() {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-6">Services</h1>
          <p className="text-gray-500">Learn about our delivery service and in-store offerings.</p>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
