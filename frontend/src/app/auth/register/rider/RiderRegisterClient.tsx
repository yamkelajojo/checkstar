'use client'

import { motion } from 'motion/react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RiderRegisterClient() {
  return (
    <>
      <Header />
      <main className="max-w-lg mx-auto px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-6 text-center">Become a Rider</h1>
          <p className="text-gray-500 text-center">Register to deliver with Checkstar.</p>
        </motion.div>
      </main>
      <Footer />
    </>
  )
}
