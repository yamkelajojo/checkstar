'use client'

import { useState } from 'react'
import { motion } from '@/lib/motion'
import { staggerContainer, item as itemVariant } from '@/lib/motion/variants'
import { ArrowLeft, TrendingUp, ShoppingBag, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import ChartCard from '@/components/operations/charts/ChartCard'
import { useAnalyticsSales, useAnalyticsProducts, useAnalyticsRiders } from '@/lib/query'

const RevenueChart = dynamic(() => import('@/components/operations/charts/RevenueChart'), { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" /> })
const OrdersByHourChart = dynamic(() => import('@/components/operations/charts/OrdersByHourChart'), { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" /> })
const TopProductsChart = dynamic(() => import('@/components/operations/charts/TopProductsChart'), { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" /> })
const RiderUtilizationChart = dynamic(() => import('@/components/operations/charts/RiderUtilizationChart'), { ssr: false, loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" /> })

type Period = '7d' | '30d' | '90d'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const { data: sales, isLoading: salesLoading } = useAnalyticsSales(period)
  const { data: products, isLoading: productsLoading } = useAnalyticsProducts(10)
  const { data: riders, isLoading: ridersLoading } = useAnalyticsRiders(period)
  const loading = salesLoading || productsLoading || ridersLoading

  const kpis = [
    { label: 'Total Revenue', value: sales ? `R${sales.total_revenue.toLocaleString()}` : '—', icon: DollarSign },
    { label: 'Total Orders', value: sales?.total_orders?.toLocaleString() ?? '—', icon: ShoppingBag },
    { label: 'Avg Order Value', value: sales ? `R${sales.avg_order_value.toLocaleString()}` : '—', icon: TrendingUp },
    { label: 'Active Riders', value: riders?.fleet_summary?.active_riders?.toString() ?? '—', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/operations" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Analytics</h1>
              <p className="text-xs text-gray-400">Performance insights</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['7d', '30d', '90d'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* KPI Cards */}
        <motion.div
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpis.map(kpi => (
            <motion.div
              key={kpi.label}
              variants={itemVariant}
              className="bg-white rounded-xl border border-gray-100 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#F58220]/10 flex items-center justify-center">
                  <kpi.icon size={13} className="text-[#F58220]" />
                </div>
                <span className="text-[10px] font-medium text-gray-400 uppercase">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {loading ? <span className="animate-pulse bg-gray-100 rounded w-16 h-5 inline-block" /> : kpi.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div variants={itemVariant} initial="hidden" animate="visible">
            <ChartCard title="Revenue Over Time" loading={loading} hasData={(sales?.revenue_over_time?.length ?? 0) > 0} emptyMessage="No revenue data">
              <RevenueChart data={sales?.revenue_over_time ?? []} />
            </ChartCard>
          </motion.div>

          <motion.div variants={itemVariant} initial="hidden" animate="visible">
            <ChartCard title="Orders by Hour" loading={loading} hasData={(sales?.orders_by_hour?.some(d => d.count > 0)) ?? false} emptyMessage="No order data">
              <OrdersByHourChart data={sales?.orders_by_hour ?? []} />
            </ChartCard>
          </motion.div>

          <motion.div variants={itemVariant} initial="hidden" animate="visible">
            <ChartCard title="Top Products" loading={loading} hasData={(products?.top_products?.length ?? 0) > 0} emptyMessage="No product data">
              <TopProductsChart data={products?.top_products ?? []} />
            </ChartCard>
          </motion.div>

          <motion.div variants={itemVariant} initial="hidden" animate="visible">
            <ChartCard title="Rider Utilization" loading={loading} hasData={(riders?.rider_utilization?.length ?? 0) > 0} emptyMessage="No rider data">
              <RiderUtilizationChart data={riders?.rider_utilization ?? []} />
            </ChartCard>
          </motion.div>
        </div>

        {/* Search Queries */}
        {products?.search_queries && products.search_queries.length > 0 && (
          <motion.div variants={itemVariant} initial="hidden" animate="visible" className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-xs font-semibold text-gray-500 mb-3">Top Search Queries</h3>
            <div className="flex flex-wrap gap-2">
              {products.search_queries.map(sq => (
                <div key={sq.query} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-gray-700">{sq.query}</span>
                  <span className="text-[10px] text-gray-400 bg-white rounded px-1.5">{sq.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
