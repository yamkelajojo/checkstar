'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useAuthStore } from '@/stores/auth-store'
import { useAllProducts, useCategories, useOrders, useStores, useSpecials, useRecipes } from '@/lib/query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Order } from '@/types'
import {
  ShoppingBag, Package, Store, Tags, Sparkles,
  BookOpen, Users, Briefcase, MessageSquare,
  HeartPulse, ChevronRight, Loader2, AlertCircle,
  RefreshCw, LayoutDashboard, ArrowUpRight,
  ShoppingCart, Bike,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

const managementLinks = [
  { href: '/admin/products', label: 'Products', icon: ShoppingBag, desc: 'Manage product catalog, pricing, and inventory' },
  { href: '/admin/categories', label: 'Categories', icon: Tags, desc: 'Organise products by category' },
  { href: '/admin/specials', label: 'Specials', icon: Sparkles, desc: 'Time-bound offers and Specials' },
  { href: '/admin/recipes', label: 'Recipes', icon: BookOpen, desc: 'Create and edit recipes' },
  { href: '/admin/community', label: 'Community', icon: Users, desc: 'Gallery and CSR posts' },
  { href: '/admin/careers', label: 'Careers', icon: Briefcase, desc: 'Manage job listings' },
  { href: '/admin/stores', label: 'Stores', icon: Store, desc: 'Store locations and settings' },
  { href: '/admin/riders', label: 'Riders', icon: Bike, desc: 'Manage delivery riders' },
]

export default function AdminDashboardClient() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: products = [], isLoading: productsLoading, error: productsError } = useAllProducts()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useOrders()
  const { data: stores = [], isLoading: storesLoading, error: storesError } = useStores()
  const { data: specials = [], isLoading: specialsLoading, error: specialsError } = useSpecials()
  const { data: recipes = [], isLoading: recipesLoading, error: recipesError } = useRecipes()

  const { data: contactData, isLoading: contactLoading, error: contactError } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: async () => {
      const getCookie = (name: string) => {
        const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return m ? decodeURIComponent(m[2]) : null
      }
      const xsrf = getCookie('XSRF-TOKEN')
      const res = await fetch('/api/admin/messages', {
        credentials: 'include',
        headers: { 'Accept': 'application/json', ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}) },
      })
      if (!res.ok) throw new Error(`Messages: ${res.status}`)
      return res.json()
    },
  })

  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const getCookie = (name: string) => {
        const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
        return m ? decodeURIComponent(m[2]) : null
      }
      const xsrf = getCookie('XSRF-TOKEN')
      const res = await fetch('/api/admin/health', {
        credentials: 'include',
        headers: { 'Accept': 'application/json', ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}) },
      })
      if (!res.ok) throw new Error(`Health: ${res.status}`)
      return res.json()
    },
  })

  const productsCount = products.length || 0
  const categoriesCount = categories.length || 0
  const ordersCount = orders.length || 0
  const storesCount = stores.length || 0
  const specialsCount = specials.length || 0
  const recipesCount = recipes.length || 0
  const contactCount = contactData?.data?.length ?? contactData?.length ?? null

  const loading = productsLoading || categoriesLoading || ordersLoading || storesLoading || specialsLoading || recipesLoading || contactLoading || healthLoading
  const error = productsError?.message || categoriesError?.message || ordersError?.message || storesError?.message || specialsError?.message || recipesError?.message || contactError?.message || healthError?.message || null
  const stats = { products: productsCount, categories: categoriesCount, orders: ordersCount, stores: storesCount, specials: specialsCount, recipes: recipesCount }
  const recentOrders = [...(orders as Order[])].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  const fetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['stores'] })
    queryClient.invalidateQueries({ queryKey: ['specials'] })
    queryClient.invalidateQueries({ queryKey: ['recipes'] })
    queryClient.invalidateQueries({ queryKey: ['contact-messages'] })
    queryClient.invalidateQueries({ queryKey: ['admin-health'] })
  }

  const roleBadge = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    return (
      <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={20} className="text-white" />
          </div>
          <span className="text-sm text-gray-500">{label}</span>
        </div>
        <p className="font-display text-2xl font-bold text-gray-900">{value}</p>
      </motion.div>
    )
  }

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          {/* Header */}
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <LayoutDashboard size={12} />
                {roleBadge || 'Admin'}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Welcome back, {user?.name?.split(' ')[0] || 'Admin'}. Manage your Checkstar platform from here.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4">Overview</h2>
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                    <div className="animate-pulse space-y-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-lg" />
                      <div className="h-3 w-16 bg-gray-100 rounded" />
                      <div className="h-6 w-10 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle size={18} className="text-accent shrink-0" />
                <p className="text-sm text-gray-600">{error}</p>
                <button onClick={fetchData} className="ml-auto text-primary text-sm font-medium hover:underline">
                  Retry
                </button>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={ShoppingBag} label="Products" value={stats.products} color="bg-primary" />
                <StatCard icon={Tags} label="Categories" value={stats.categories} color="bg-blue-500" />
                <StatCard icon={ShoppingCart} label="Orders" value={stats.orders} color="bg-success" />
                <StatCard icon={Store} label="Stores" value={stats.stores} color="bg-purple-500" />
                <StatCard icon={Sparkles} label="Specials" value={stats.specials} color="bg-amber-500" />
                <StatCard icon={BookOpen} label="Recipes" value={stats.recipes} color="bg-pink-500" />
              </div>
            ) : null}
          </motion.div>

          {/* Management links */}
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4">Management</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {managementLinks.map(link => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon size={20} className="text-primary" />
                      </div>
                      <ArrowUpRight size={16} className="text-gray-300 ml-auto group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-0.5">{link.label}</h3>
                    <p className="text-xs text-gray-400">{link.desc}</p>
                  </Link>
                )
              })}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Orders */}
            <motion.div variants={fadeUp}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
                <Link href="/admin/orders" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                      <div className="animate-pulse space-y-2">
                        <div className="h-4 w-32 bg-gray-100 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
                  <ShoppingCart size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <Link
                      key={order.id}
                      href={`/account/orders/${order.id}`}
                      className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-900">{order.order_number}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          order.status === 'delivered' ? 'bg-success/10 text-success' :
                          order.status === 'cancelled' ? 'bg-accent/10 text-accent' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="font-semibold text-gray-700">R{Number(order.total).toFixed(2)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Contact & Health */}
            <motion.div variants={fadeUp} className="space-y-6">
              {/* Contact Messages */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-semibold">Contact Messages</h2>
                  <Link href="/admin/contact-messages" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                    View All <ChevronRight size={14} />
                  </Link>
                </div>
                <Link
                  href="/admin/contact-messages"
                  className="block bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MessageSquare size={24} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {contactCount !== null ? `${contactCount} messages` : 'Customer Messages'}
                      </p>
                      <p className="text-sm text-gray-400">{contactCount !== null ? 'View and respond to enquiries' : 'Loading message count...'}</p>
                    </div>
                    <ArrowUpRight size={18} className="text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              </div>

              {/* System Health */}
              <div>
                <h2 className="font-display text-lg font-semibold mb-4">System Health</h2>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <HeartPulse size={20} className="text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">All Systems Normal</p>
                      <p className="text-xs text-gray-400">Last checked: just now</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-gray-500">API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-gray-500">Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-warning" />
                      <span className="text-gray-500">Queue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-gray-500">Storage</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </main>
    </>
  )
}
