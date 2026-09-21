'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useAuthStore } from '@/stores/auth-store'
import { useAllProducts, useCategories, useOrders, useStores, useSpecials, useRecipes } from '@/lib/query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Order } from '@/types'
import {
  ShoppingBag, Store, Tags, Sparkles,
  BookOpen, Users, MessageSquare,
  HeartPulse, Loader2, AlertCircle,
  RefreshCw, LayoutDashboard, ArrowUpRight,
  ShoppingCart, Bike, Image, ShieldAlert, Activity,
} from 'lucide-react'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import { api } from '@/lib/api'

// Only pages that actually exist — every link must resolve.
// Roles aligned with backend route middleware:
// - banners: developer, store_owner, store_manager
// - staff: store_owner, developer
// - inventory/orders: store_manager, logistics_officer, store_owner, developer
// - operations/analytics/audit-logs: store_owner, store_manager, logistics_officer, developer
// - dispatch: store_manager, logistics_officer, store_owner, developer
// - products/categories/specials/stores/users/riders: developer only
const storeManagementLinks = [
  { href: '/admin/banners', label: 'Banners', icon: Image, desc: 'Create and manage promotional banners', roles: ['store_owner', 'store_manager', 'developer'] },
  { href: '/admin/staff', label: 'Store Staff', icon: Users, desc: 'Hire and remove store staff access', roles: ['store_owner', 'developer'] },
  { href: '/admin/inventory', label: 'Inventory', icon: ShoppingBag, desc: 'Manage stock levels and availability', roles: ['store_manager', 'logistics_officer', 'store_owner', 'developer'] },
  { href: '/admin/orders', label: 'Store Orders', icon: ShoppingCart, desc: 'View and update store orders', roles: ['store_manager', 'logistics_officer', 'store_owner', 'developer'] },
]

const catalogManagementLinks = [
  { href: '/admin/products', label: 'Products', icon: ShoppingBag, desc: 'Create and manage product catalogue', roles: ['developer'] },
  { href: '/admin/categories', label: 'Categories', icon: Tags, desc: 'Manage product categories', roles: ['developer'] },
  { href: '/admin/specials', label: 'Specials', icon: Sparkles, desc: 'Manage promotional specials', roles: ['developer'] },
  { href: '/admin/stores', label: 'Stores', icon: Store, desc: 'Manage store locations and settings', roles: ['developer'] },
  { href: '/admin/users', label: 'Users', icon: Users, desc: 'Manage user accounts and roles', roles: ['developer'] },
  { href: '/admin/riders', label: 'Riders', icon: Bike, desc: 'Manage rider fleet', roles: ['developer'] },
  { href: '/admin/recipes', label: 'Recipes', icon: BookOpen, desc: 'Create and manage recipes', roles: ['developer'] },
  { href: '/admin/community', label: 'Community', icon: Users, desc: 'Manage community posts', roles: ['developer'] },
  { href: '/admin/careers', label: 'Careers', icon: Tags, desc: 'Manage career listings', roles: ['developer'] },
]

const operationsLinks = [
  { href: '/operations', label: 'Live Operations', icon: Activity, desc: 'Realtime map, metrics and event feed', roles: ['logistics_officer', 'store_owner', 'store_manager', 'developer'] },
  { href: '/operations/analytics', label: 'Analytics', icon: ShoppingCart, desc: 'Revenue, orders and fleet insights', roles: ['logistics_officer', 'store_owner', 'store_manager', 'developer'] },
  { href: '/operations/audit-logs', label: 'Audit Logs', icon: ShieldAlert, desc: 'Searchable audit trail', roles: ['logistics_officer', 'store_owner', 'store_manager', 'developer'] },
  { href: '/account/dispatch', label: 'Dispatch Console', icon: Bike, desc: 'Assign and reassign delivery riders', roles: ['logistics_officer', 'store_manager', 'store_owner', 'developer'] },
  { href: '/admin/health', label: 'System Health', icon: HeartPulse, desc: 'Service status and uptime', roles: ['developer'] },
]

const SERVICE_ORDER: Array<{ key: string; label: string }> = [
  { key: 'api', label: 'API' },
  { key: 'database', label: 'Database' },
  { key: 'queue', label: 'Queue' },
  { key: 'storage', label: 'Storage' },
]

function serviceDot(status: string | undefined): string {
  if (status === 'warn') return 'bg-warning'
  if (status && status !== 'ok') return 'bg-accent'
  return 'bg-success'
}

interface AdminHealth {
  status?: string
  uptime_s?: number
  services?: Record<string, string>
}

export default function AdminDashboardClient() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Non-developer staff get a focused dashboard with their available tools.
  if (user && user.role !== 'developer') {
    const roleLabel = user.role?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    const visibleStoreLinks = storeManagementLinks.filter(l => l.roles.includes(user.role))
    const visibleOpsLinks = operationsLinks.filter(l => l.roles.includes(user.role))

    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl font-bold text-gray-900">Staff Dashboard</h1>
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                {roleLabel}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Welcome back, {user?.name?.split(' ')[0] || 'Staff'}. Select a tool below to get started.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4">Your Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleStoreLinks.map((link) => (
                <LinkCard key={link.href} link={link} />
              ))}
              {visibleOpsLinks.map((link) => (
                <LinkCard key={link.href} link={link} />
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    )
  }

  return <AdminDashboardBody user={user} queryClient={queryClient} />
}

// Module scope — components defined inside a render function get a fresh
// identity every render, forcing React to unmount/remount the whole grid.
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
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

function LinkCard({ link }: { link: { href: string; label: string; icon: React.ElementType; desc: string } }) {
  const Icon = link.icon
  return (
    <Link
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
}

function AdminDashboardBody({ user, queryClient }: { user: ReturnType<typeof useAuthStore.getState>['user']; queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: products = [], isLoading: productsLoading, error: productsError } = useAllProducts()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
  const { data: orders = [], isLoading: ordersLoading, error: ordersError } = useOrders()
  const { data: stores = [], isLoading: storesLoading, error: storesError } = useStores()
  const { data: specials = [], isLoading: specialsLoading, error: specialsError } = useSpecials()
  const { data: recipes = [], isLoading: recipesLoading, error: recipesError } = useRecipes()

  const { data: contactData, isLoading: contactLoading, error: contactError } = useQuery({
    queryKey: ['contact-messages'],
    queryFn: () => api.getMessages(),
  })

  const { data: healthData, isLoading: healthLoading, error: healthError } = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api.getAdminHealth(),
    refetchInterval: 60_000,
  })

  const productsCount = products.length || 0
  const categoriesCount = categories.length || 0
  const ordersCount = orders.length || 0
  const storesCount = stores.length || 0
  const specialsCount = specials.length || 0
  const recipesCount = recipes.length || 0
  const contactCount = Array.isArray(contactData?.data) ? (contactData.data as unknown[]).length : Array.isArray(contactData) ? (contactData as unknown[]).length : null

  const loading = productsLoading || categoriesLoading || ordersLoading || storesLoading || specialsLoading || recipesLoading || contactLoading
  const error = productsError?.message || categoriesError?.message || ordersError?.message || storesError?.message || specialsError?.message || recipesError?.message || contactError?.message || null
  const stats = { products: productsCount, categories: categoriesCount, orders: ordersCount, stores: storesCount, specials: specialsCount, recipes: recipesCount }
  const recentOrders = [...(orders as Order[])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

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

  const roleBadge = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const health = (healthData ?? null) as AdminHealth | null
  const healthStatus = health?.status ?? (healthError ? 'error' : undefined)
  const serviceValues = Object.values(health?.services ?? {})
  const allOk = healthStatus === 'ok' && serviceValues.every((s) => s === 'ok')

  return (
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
              <button onClick={fetchData} className="ml-auto text-primary text-sm font-medium hover:underline flex items-center gap-1">
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard icon={ShoppingBag} label="Products" value={stats.products} color="bg-primary" />
              <StatCard icon={Tags} label="Categories" value={stats.categories} color="bg-blue-500" />
              <StatCard icon={ShoppingCart} label="Orders" value={stats.orders} color="bg-success" />
              <StatCard icon={Store} label="Stores" value={stats.stores} color="bg-purple-500" />
              <StatCard icon={Sparkles} label="Specials" value={stats.specials} color="bg-amber-500" />
              <StatCard icon={BookOpen} label="Recipes" value={stats.recipes} color="bg-pink-500" />
            </div>
          )}
        </motion.div>

        {/* Management links — only real destinations */}
        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">Store Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {storeManagementLinks.map((link) => (
              <LinkCard key={link.href} link={link} />
            ))}
            <Link
              href="/admin/messages"
              className="group bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MessageSquare size={20} className="text-primary" />
                </div>
                <ArrowUpRight size={16} className="text-gray-300 ml-auto group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-medium text-gray-900 mb-0.5">Messages</h3>
              <p className="text-xs text-gray-400">{contactCount !== null ? `${contactCount} customer message${contactCount === 1 ? '' : 's'}` : 'Customer enquiries inbox'}</p>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">Catalog Management</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {catalogManagementLinks.map((link) => (
              <LinkCard key={link.href} link={link} />
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-8">
          <h2 className="font-display text-lg font-semibold mb-4">Operations</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {operationsLinks.map((link) => (
              <LinkCard key={link.href} link={link} />
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <motion.div variants={fadeUp}>
            <h2 className="font-display text-lg font-semibold mb-4">Recent Orders</h2>
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
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
                {recentOrders.map((order) => (
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
                      <span className="text-gray-400">{new Date(order.created_at).toLocaleDateString('en-ZA')}</span>
                      <span className="font-semibold text-gray-700">R{Number(order.total).toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* System Health — rendered from the real /admin/health payload */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">System Health</h2>
              {healthLoading && <Loader2 size={14} className="animate-spin text-gray-300" />}
              {!healthLoading && healthError && (
                <button onClick={fetchData} className="text-primary text-xs font-medium hover:underline">Retry</button>
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${allOk || healthLoading ? 'bg-success/10' : 'bg-warning/10'}`}>
                  <HeartPulse size={20} className={allOk || healthLoading ? 'text-success' : 'text-warning'} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {healthLoading
                      ? 'Checking…'
                      : healthError
                        ? 'Health check unavailable'
                        : allOk
                          ? 'All Systems Normal'
                          : 'Degraded — investigate below'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {healthLoading ? 'Fetching service status' : healthError ? (healthError as Error).message : 'Last checked: just now'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {SERVICE_ORDER.map(({ key, label }) => {
                  const status = health?.services?.[key]
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${healthLoading ? 'bg-gray-200 animate-pulse' : serviceDot(status)}`} />
                      <span className="text-gray-500">{label}</span>
                      {!healthLoading && !healthError && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-300 ml-auto">{status ?? '—'}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </main>
  )
}
