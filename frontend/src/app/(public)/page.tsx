'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Bike, Store } from 'lucide-react'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function HomePage() {
  return (
    <>
      <main>
        <section className="relative bg-gradient-to-br from-primary-light via-white to-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 py-20 md:py-32">
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl">
              <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Fresh groceries,{' '}
                <span className="text-primary">delivered fast</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-500 leading-relaxed">
                Durban&apos;s favourite supermarket chain — now online. Shop from 3 stores across the city and get your
                groceries delivered by our motorbike Riders, straight to your door.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Shop Now <ArrowRight size={18} />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Our Story
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl font-bold text-center mb-12"
          >
            How it works
          </motion.h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: ShoppingBag, title: 'Browse & Add', desc: 'Shop our full range of groceries and add items to your cart.' },
              { icon: Store, title: 'We Prepare', desc: 'Your nearest Checkstar store picks and packs your order.' },
              { icon: Bike, title: 'Rider Delivers', desc: 'A motorbike Rider brings your order straight to your door.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center p-6">
                <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="text-primary" size={28} />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-2xl font-bold mb-4"
            >
              Ready to get started?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-gray-500 mb-8"
            >
              Browse products, check our specials, or find a store near you.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Link href="/products" className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors">
                Browse Products
              </Link>
              <Link href="/specials" className="border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                View Specials
              </Link>
              <Link href="/stores" className="border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Find a Store
              </Link>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  )
}
