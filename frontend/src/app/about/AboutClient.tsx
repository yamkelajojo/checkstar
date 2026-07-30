'use client'

import { motion } from 'motion/react'
import { Store, Bike, Users, ShoppingBag, Award, Heart } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const timeline = [
  { year: '2005', title: 'First Store Opens', desc: 'Checkstar opened its doors in Durban with a single store, committed to quality groceries at fair prices.' },
  { year: '2010', title: 'Second Location', desc: 'Expanded to a second store in response to growing demand from the community.' },
  { year: '2016', title: 'Third Store', desc: 'Opened our third location, further extending our reach across Durban.' },
  { year: '2024', title: 'Going Digital', desc: 'Began rebuilding our website and launching a delivery platform with motorbike Riders.' },
  { year: '2025', title: 'Delivery Launch', desc: 'Launched grocery delivery — bringing fresh food to doorsteps across the city.' },
]

const stakeholders = [
  { icon: Store, title: 'Store Owners', desc: 'Local entrepreneurs who own and operate each Checkstar location.' },
  { icon: Users, title: 'Store Managers', desc: 'Day-to-day operations, inventory, and staff management at each store.' },
  { icon: Bike, title: 'Riders', desc: 'Motorbike couriers who deliver orders fresh and fast to customers.' },
  { icon: ShoppingBag, title: 'Suppliers', desc: 'Trusted local and national suppliers who stock our shelves daily.' },
]

export default function AboutClient() {
  return (
    <>
      <Header />
      <main>
        <section className="relative bg-gradient-to-br from-primary-light via-white to-white overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-gray-900">
                Our Story
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                From a single store in Durban to a community-driven grocery delivery service — Checkstar has been
                serving South African families for nearly two decades.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-2xl font-bold mb-6">Who We Are</h2>
            <div className="space-y-4 text-gray-500 leading-relaxed">
              <p>
                Checkstar is a Durban-based supermarket chain dedicated to providing fresh, quality groceries at
                fair prices. With three physical stores across the city and a growing online delivery service, we
                serve thousands of customers every day.
              </p>
              <p>
                Our mission is simple: make grocery shopping easy, affordable, and accessible. Whether you visit us
                in-store or order through our app, you can expect the same commitment to quality and service that
                has defined Checkstar since 2005.
              </p>
              <p>
                We are proudly South African — rooted in Durban, built by locals, and driven by a passion for
                community. Our motorbike Rider delivery service means your order arrives fast, fresh, and with a
                smile.
              </p>
            </div>
          </motion.div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-2xl font-bold text-center mb-12"
            >
              Our Stakeholders
            </motion.h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {stakeholders.map((s, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mb-4">
                    <s.icon className="text-primary" size={24} />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl font-bold text-center mb-12"
          >
            Our Timeline
          </motion.h2>
          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
              {timeline.map((t, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className={`relative flex items-start gap-6 mb-10 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  <div className="hidden md:block flex-1" />
                  <div className="absolute left-6 md:left-1/2 w-4 h-4 bg-primary rounded-full -translate-x-1/2 mt-1.5 ring-4 ring-white" />
                  <div className="flex-1 pl-10 md:pl-0">
                    <span className="text-sm font-bold text-primary">{t.year}</span>
                    <h3 className="font-display text-lg font-semibold mt-1">{t.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="bg-primary text-white py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto px-4"
          >
            <Heart size={40} className="mx-auto mb-4 opacity-80" />
            <h2 className="font-display text-2xl font-bold mb-4">Proudly Serving Durban</h2>
            <p className="opacity-90 leading-relaxed">
              Every order supports local jobs, local suppliers, and our community. Thank you for choosing Checkstar.
            </p>
          </motion.div>
        </section>
      </main>
      <Footer />
    </>
  )
}
