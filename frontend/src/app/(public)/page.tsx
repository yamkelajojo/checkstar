'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ShoppingBag, Bike, Store, Shield, Star, Search, MapPin } from 'lucide-react'
import { ProductCarousel } from '@/components/ProductCarousel'
import { AirtimeTicker } from '@/components/AirtimeTicker'
import { DownloadTheApp } from '@/components/DownloadTheApp'
import { CommunityBanner } from '@/components/CommunityBanner'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ErrorFallback } from '@/components/ErrorFallback'
import CategoryGrid from '@/components/CategoryGrid'
import { useTrendingProducts, usePopularProducts, useNewArrivals, useBanners, useCategories } from '@/lib/query'
import { spring, ease } from '@/lib/motion/tokens'

export default function HomePage() {
  const router = useRouter()
  const [searchValue, setSearchValue] = useState('')
  const shouldReduce = useReducedMotion()

  const trendingQuery = useTrendingProducts()
  const popularQuery = usePopularProducts()
  const newArrivalsQuery = useNewArrivals()
  const { data: banners = [], isLoading: bannersLoading, isError: bannersError, refetch: refetchBanners } = useBanners()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()

  return (
    <>
      <div>
        <section className="relative overflow-hidden">
          <HeroBackground />
          <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28 lg:py-36">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
              }}
              className="max-w-[600px]"
            >
              <motion.div
                variants={{
                  hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: 'blur(8px)' },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: ease.apple } },
                }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-sm mb-6"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                <span className="text-[11px] font-semibold tracking-wide text-gray-700">3 stores live in Durban</span>
              </motion.div>

              <motion.h1
                variants={{
                  hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 24, filter: 'blur(12px)', scale: 0.98 },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { duration: 0.7, ease: ease.appleSpring } },
                }}
                className="font-display text-[32px] sm:text-[44px] md:text-[52px] lg:text-[60px] font-bold text-gray-900 leading-[0.95] tracking-[-0.03em]"
              >
                Fresh groceries,
                <br />
                <span className="text-primary">straight to your door</span>
              </motion.h1>

              <motion.p
                variants={{
                  hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: ease.apple, delay: 0.1 } },
                }}
                className="mt-5 text-[16px] sm:text-[18px] text-gray-600 leading-relaxed max-w-[48ch]"
              >
                Shop from 3 Checkstar stores across Durban. Our Riders bring your order to your doorstep — fast, friendly, and fresh.
              </motion.p>

              <motion.div
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
                }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <motion.div
                  variants={{
                    hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', ...spring.apple } },
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-gray-900 text-white px-7 py-3.5 rounded-button font-semibold hover:bg-black transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] duration-200"
                  >
                    Shop Now <ArrowRight size={18} strokeWidth={2.5} />
                  </Link>
                </motion.div>
                <motion.div
                  variants={{
                    hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', ...spring.apple, delay: 0.05 } },
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href="/stores"
                    className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 px-6 py-3.5 rounded-button font-semibold hover:bg-white hover:border-gray-300 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  >
                    <MapPin size={16} strokeWidth={2} />
                    Find a Store
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                variants={{
                  hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(3px)' },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: ease.apple, delay: 0.3 } },
                }}
                className="mt-8 flex items-center gap-5 text-[13px] text-gray-500"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                    <Shield size={12} className="text-green-600" strokeWidth={2.5} />
                  </span>
                  <span className="font-medium">Satisfaction guaranteed</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Star size={12} className="text-amber-600" strokeWidth={2.5} fill="currentColor" />
                  </span>
                  <span className="font-medium">Trusted across Durban</span>
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: ease.apple }}
          className="max-w-7xl mx-auto px-4 py-8"
        >
          {bannersLoading ? (
            <div className="w-full h-48 md:h-64 rounded-xl shimmer border border-gray-100" />
          ) : bannersError ? (
            <ErrorFallback message="Couldn't load banners" onRetry={() => refetchBanners()} />
          ) : (
            <BannerCarousel banners={banners} />
          )}
        </motion.div>

        <motion.section
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: ease.apple }}
          className="max-w-7xl mx-auto px-4 py-8"
        >
          <motion.form
            initial={shouldReduce ? undefined : { scale: 0.98, filter: 'blur(2px)' }}
            whileInView={{ scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ type: 'spring', ...spring.appleGentle }}
            onSubmit={e => {
              e.preventDefault()
              const q = searchValue.trim()
              router.push(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
            }}
            className="flex items-center gap-3 w-full max-w-xl mx-auto px-5 py-3.5 rounded-button border border-gray-200/80 bg-white/90 backdrop-blur-sm hover:border-gray-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all shadow-[0_1px_4px_rgba(0,0,0,0.04)] group"
          >
            <Search size={18} className="text-gray-400 group-focus-within:text-primary transition-colors shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="Search for groceries, recipes, Vetkoek, Malva..."
              className="w-full text-[14px] bg-transparent outline-none placeholder:text-gray-400 text-gray-900"
            />
          </motion.form>

          <div className="mt-8">
            {categoriesLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-card shimmer border border-gray-100" />
                ))}
              </div>
            ) : (
              <CategoryGrid categories={categories} />
            )}
          </div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} className="max-w-7xl mx-auto px-4">
          <motion.div variants={{ hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ease: ease.apple } } }}>
            <ProductCarousel title="Trending Now" products={trendingQuery.data ?? []} queryResult={trendingQuery} />
          </motion.div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} className="max-w-7xl mx-auto px-4">
          <motion.div variants={{ hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ease: ease.apple } } }}>
            <ProductCarousel title="Most Bought" products={popularQuery.data ?? []} queryResult={popularQuery} />
          </motion.div>
        </motion.section>

        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }} variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }} className="max-w-7xl mx-auto px-4">
          <motion.div variants={{ hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ease: ease.apple } } }}>
            <ProductCarousel title="New Arrivals" products={newArrivalsQuery.data ?? []} queryResult={newArrivalsQuery} />
          </motion.div>
        </motion.section>

        <section className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <motion.div initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true }} transition={{ ease: ease.apple }} className="text-center max-w-[60ch] mx-auto mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 text-white text-[11px] font-bold tracking-widest uppercase mb-4">Simple flow</span>
            <h2 className="font-display text-[26px] sm:text-[32px] font-bold tracking-tight leading-[1.1] mb-3">How it works</h2>
            <p className="text-[14px] text-gray-500 leading-relaxed">Three steps, zero hassle. From shelf to doorstep.</p>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            <div className="hidden md:block absolute top-[48px] left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative"
            >
              {[
                { icon: ShoppingBag, title: 'Browse & Add', desc: 'Explore our full range — fresh produce, pantry staples, SA favourites like Vetkoek and Malva — and add to cart.', accent: 'bg-gray-900', light: 'bg-gray-50' },
                { icon: Store, title: 'We Pick & Pack', desc: 'Your nearest Checkstar store hand-picks your order with care, checking freshness and packing with love.', accent: 'bg-primary', light: 'bg-primary-light' },
                { icon: Bike, title: 'Rider Delivers', desc: 'A dedicated motorbike Rider brings it straight to your door. Track live, get notified, enjoy.', accent: 'bg-success', light: 'bg-green-50' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 20, filter: 'blur(6px)', scale: 0.96 },
                    visible: { opacity: 1, y: 0, filter: 'blur(0px)', scale: 1, transition: { type: 'spring', ...spring.apple } },
                  }}
                  className="relative text-center md:text-left group"
                >
                  <div className="relative">
                    <motion.div
                      initial={shouldReduce ? undefined : { scale: 0.8, rotate: -4 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', ...spring.appleBounce, delay: i * 0.08 + 0.2 }}
                      className={`w-12 h-12 rounded-button ${item.light} border border-gray-100 flex items-center justify-center mx-auto md:mx-0 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow`}
                    >
                      <item.icon className={i === 1 ? 'text-primary' : i === 2 ? 'text-success' : 'text-gray-900'} size={20} strokeWidth={2} />
                    </motion.div>
                    <div className={`hidden md:flex absolute -top-1 -left-1 w-6 h-6 rounded-full ${item.accent} text-white text-[11px] font-bold items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.15)] border-2 border-white`}>{i + 1}</div>
                  </div>
                  <h3 className="font-display text-[16px] font-semibold tracking-tight mb-2">{item.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed max-w-[32ch] mx-auto md:mx-0">{item.desc}</p>
                  {i < 2 && <div className="md:hidden w-px h-8 bg-gray-200 mx-auto my-4" />}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <motion.div initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16, filter: 'blur(6px)' }} whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} viewport={{ once: true }} transition={{ ease: ease.apple }}>
          <DownloadTheApp />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <AirtimeTicker />
        </motion.div>

        <motion.div initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ease: ease.apple }}>
          <CommunityBanner />
        </motion.div>
      </div>
    </>
  )
}

function HeroBackground() {
  const [imageFailed, setImageFailed] = useState(false)
  const shouldReduce = useReducedMotion()

  return (
    <div className="absolute inset-0" aria-hidden="true">
      {!imageFailed && (
        <motion.div
          initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 1.06, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: ease.apple }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/home-page-hero-bg-wallpaper.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImageFailed(true)}
          />
        </motion.div>
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-[#FFF3E8]/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-[#FFF5ED]/60" />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }} className="absolute -top-32 right-0 w-[34rem] h-[34rem] rounded-full bg-primary/10 blur-3xl" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="absolute bottom-0 left-1/4 w-96 h-64 rounded-full bg-[#FFB27A]/10 blur-3xl" />

      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-[#2A1608]/15" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04]" />
    </div>
  )
}
