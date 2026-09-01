'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Bike, Store, Clock, Shield, Star, Search } from 'lucide-react'
import { fadeUp, stagger } from '@/lib/motion/variants'
import { ProductCarousel } from '@/components/ProductCarousel'
import { AirtimeTicker } from '@/components/AirtimeTicker'
import { DownloadTheApp } from '@/components/DownloadTheApp'
import { CommunityBanner } from '@/components/CommunityBanner'
import { BannerCarousel } from '@/components/BannerCarousel'
import { ErrorFallback } from '@/components/ErrorFallback'
import CategoryGrid from '@/components/CategoryGrid'
import { useTrendingProducts, usePopularProducts, useNewArrivals, useBanners, useCategories } from '@/lib/query'

const PRODUCT_TABS = [
  { key: 'trending', label: 'Trending Now' },
  { key: 'popular', label: 'Most Bought' },
  { key: 'new', label: 'New Arrivals' },
] as const

type TabKey = (typeof PRODUCT_TABS)[number]['key']

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('trending')

  const trendingQuery = useTrendingProducts()
  const popularQuery = usePopularProducts()
  const newArrivalsQuery = useNewArrivals()
  const { data: banners = [], isLoading: bannersLoading, isError: bannersError, refetch: refetchBanners } = useBanners()
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()

  const queryMap = {
    trending: trendingQuery,
    popular: popularQuery,
    new: newArrivalsQuery,
  }

  const productsMap = {
    trending: trendingQuery.data ?? [],
    popular: popularQuery.data ?? [],
    new: newArrivalsQuery.data ?? [],
  }

  const activeQuery = queryMap[activeTab]
  const activeProducts = productsMap[activeTab]

  return (
    <>
      <main>
        {/* Hero — warm, inviting, Durban-rooted */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF5ED] via-white to-[#FFF0E5]">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 lg:py-32">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-xl">
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
                  <Clock size={14} />
                  Delivered in 45 minutes
                </motion.div>
                <motion.h1 variants={fadeUp} className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
                  Fresh groceries,{' '}
                  <span className="text-primary">straight to your door</span>
                </motion.h1>
                <motion.p variants={fadeUp} className="mt-5 text-lg text-gray-500 leading-relaxed max-w-md">
                  Shop from 3 Checkstar stores across Durban. Our Riders bring your order to your doorstep &mdash; fast, friendly, and fresh.
                </motion.p>
                <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                  >
                    Shop Now <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/stores"
                    className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Find a Store
                  </Link>
                </motion.div>
                <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Shield size={16} className="text-success" />
                    Satisfaction guaranteed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star size={16} className="text-warning" />
                    Trusted by Durban since 2012
                  </span>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="hidden md:block"
              >
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary-light to-[#FFE8D6] border border-primary/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <ShoppingBag className="mx-auto text-primary/30" size={80} />
                      <p className="mt-4 text-primary/50 text-sm font-medium">Your groceries, delivered fresh</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Banners */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {bannersLoading ? (
            <div className="w-full h-48 md:h-64 rounded-2xl bg-gray-100 animate-pulse" />
          ) : bannersError ? (
            <ErrorFallback message="Failed to load banners" onRetry={() => refetchBanners()} />
          ) : (
            <BannerCarousel banners={banners} />
          )}
        </div>

        {/* Search + Categories */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <Link
            href="/products"
            className="flex items-center gap-3 w-full max-w-xl mx-auto px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Search size={18} />
            <span className="text-sm">Search for groceries...</span>
          </Link>

          <div className="mt-8">
            {categoriesLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : (
              <CategoryGrid categories={categories} />
            )}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-7xl mx-auto px-4 py-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-lg sm:text-2xl font-bold text-center mb-10"
          >
            How it works
          </motion.h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: ShoppingBag, title: 'Browse & Add', desc: 'Shop our full range and add items to your cart.' },
              { icon: Store, title: 'We Pick & Pack', desc: 'Your nearest Checkstar store prepares your order with care.' },
              { icon: Bike, title: 'Rider Delivers', desc: 'A motorbike Rider brings it straight to your door.' },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center p-5 rounded-2xl bg-surface border border-border/50">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon className="text-primary" size={24} />
                </div>
                <h3 className="font-display text-base font-semibold mb-1.5">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Products — single carousel with tabs */}
        <section className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 mb-2 border-b border-gray-100">
            {PRODUCT_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ProductCarousel
            title=""
            products={activeProducts}
            queryResult={activeQuery}
          />
        </section>

        {/* In-store services */}
        <AirtimeTicker />

        {/* Download the app */}
        <DownloadTheApp />

        {/* Community */}
        <CommunityBanner />
      </main>
    </>
  )
}
