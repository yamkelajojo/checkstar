'use client'

import { motion } from 'motion/react'
import { Milk, CreditCard, Wifi, Zap, Bike, Store } from 'lucide-react'
import { fadeUp, stagger } from '@/lib/motion/variants'

const services = [
  {
    icon: Milk,
    title: 'Fresh Milkshakes',
    desc: 'Made to order at our in-store milkshake bars. Choose from classic flavours like strawberry, chocolate, and vanilla — or try our speciality blends. Available at all Checkstar locations.',
  },
  {
    icon: CreditCard,
    title: 'Pension Payouts',
    desc: 'Convenient pension payout services at all our stores. Safe, quick, and hassle-free. Visit the customer service desk during trading hours.',
  },
  {
    icon: Wifi,
    title: 'Airtime & Data',
    desc: 'Top up your airtime, SMS bundles, and mobile data at any Checkstar till point. We support all major South African networks — Vodacom, MTN, Cell C, and Telkom.',
  },
  {
    icon: Zap,
    title: 'Prepaid Electricity',
    desc: 'Need to top up your prepaid electricity meter? Buy prepaid electricity tokens at any Checkstar store. Quick and easy — just give us your meter number.',
  },
]

export default function ServicesClient() {
  return (
    <>
      <div>
        <section className="relative bg-gradient-to-br from-primary-light via-white to-white overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.h1 variants={fadeUp} className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900">
                Our Services
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
                More than just groceries — Checkstar offers a range of convenient services for the Durban community.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {services.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mb-5">
                  <s.icon className="text-primary" size={28} />
                </div>
                <h3 className="font-display text-base sm:text-xl font-semibold mb-3">{s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="font-display text-lg sm:text-2xl font-bold mb-6">Also Available</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Bike size={24} className="text-primary" />
                    <h3 className="font-display font-semibold">Grocery Delivery</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Order online and get your groceries delivered by motorbike Rider. Free delivery within our
                    service area. Available from all three Checkstar stores.
                  </p>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <Store size={24} className="text-primary" />
                    <h3 className="font-display font-semibold">In-Store Shopping</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Visit any Checkstar location for a full-service grocery shopping experience. Our friendly staff
                    are always ready to help you find what you need.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}
