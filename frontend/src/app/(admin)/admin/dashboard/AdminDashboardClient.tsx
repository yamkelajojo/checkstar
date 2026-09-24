'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import { useAuthStore } from '@/stores/auth-store'
import {
  useAllProducts, useCategories, useStores, useSpecials, useRecipes,
  useStoreOrders, useStoreInventory, usePendingDispatch,
} from '@/lib/query'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Order, Store } from '@/types'
import { resolveUserStore } from '@/types'
import {
  ShoppingBag, Store as StoreIcon, Tags, Sparkles,
  BookOpen,
  HeartPulse, Loader2, AlertCircle,
  RefreshCw, LayoutDashboard,
  ShoppingCart,
  AlertTriangle, PackageX, Bike as BikeIcon,
} from 'lucide-react'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import { api } from '@/lib/api'
import EmptyState from '@/components/admin/EmptyState'

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

  // Non-developer staff get a focused cockpit for their store.
  if (user && user.role !== 'developer') {
    return <StaffDashboard user={user} />
  }

  return <AdminDashboardBody user={user} queryClient={queryClient} />
}

// ---------------------------------------------------------------------------
// Staff dashboard — owner / manager / logistics
// ---------------------------------------------------------------------------

function StaffDashboard({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']> }) {
  const myStore = resolveUserStore(user)
  const storeId = myStore?.id ?? null
  const roleLabel = user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const { data: pending = [], isLoading: pendingLoading } = usePendingDispatch(storeId ?? undefined, { enabled: !!storeId })
  const { data: inventoryRaw, isLoading: inventoryLoading } = useStoreInventory(storeId ?? undefined, { enabled: !!storeId })
  const { data: orders = [], isLoading: ordersLoading } = useStoreOrders(storeId ?? undefined, undefined, { enabled: !!storeId })

  const inventory = (inventoryRaw ?? []) as Array<{ stock_quantity: number }>
  const lowStockCount = inventory.filter((i) => i.stock_quantity > 0 && i.stock_quantity < 10).length
  const outOfStockCount = inventory.filter((i) => i.stock_quantity === 0).length
  const awaitingDispatch = (pending as unknown[]).length
  const recentOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  const attention = [
    { label: 'orders awaiting dispatch', count: awaitingDispatch, href: '/account/dispatch', icon: BikeIcon, tone: 'text-amber-600' },
    { label: 'low on stock', count: lowStockCount, href: '/admin/inventory', icon: AlertTriangle, tone: 'text-amber-600' },
    { label: 'out of stock', count: outOfStockCount, href: '/admin/inventory', icon: PackageX, tone: 'text-accent' },
  ]
  const anyAttention = attention.some((a) => a.count > 0)

  // Data-integrity edge: a staff role whose account has no resolvable store
  // must not render a blank dashboard.
  if (!storeId) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {roleLabel}
            </span>
          </div>
          <p className="text-gray-500 text-sm">Welcome back, {user.name?.split(' ')[0] || 'Staff'}.</p>
        </div>
        <EmptyState
          icon={StoreIcon}
          title="No store linked to your account"
          hint="Your dashboard tracks one store. If this looks wrong, ask a developer to check your store access."
        />
      </main>
    )
  }

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
            Welcome back, {user.name?.split(' ')[0] || 'Staff'}.
            {myStore ? ` Here’s what needs your attention at ${myStore.name}.` : ''}
          </p>
        </motion.div>

        {storeId && (
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4">Needs Attention</h2>
            {pendingLoading || inventoryLoading ? (
              <div className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : !anyAttention ? (
              <div className="bg-white border border-gray-100 rounded-xl p-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-success" />
                </div>
                <p className="text-sm text-gray-600">Nothing needs attention right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {attention.map((a) => {
                  const Icon = a.icon
                  return (
                    <Link
                      key={a.label}
                      href={a.href}
                      className={`bg-white border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow ${
                        a.count > 0 ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.count > 0 ? 'bg-amber-100' : 'bg-gray-50'}`}>
                        <Icon size={17} className={a.count > 0 ? a.tone : 'text-gray-300'} />
                      </div>
                      <div>
                        <p className="font-display text-xl font-bold text-gray-900 leading-none">{a.count}</p>
                        <p className="text-xs text-gray-500 mt-1">{a.label}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {storeId && (
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-primary hover:underline font-medium">
                All orders →
              </Link>
            </div>
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
                    href="/admin/orders"
                    className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <OrderRow order={order} />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </motion.div>
    </main>
  )
}

function OrderRow({ order }: { order: Order }) {
  return (
    <>
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
    </>
  )
}

// ---------------------------------------------------------------------------
// Developer dashboard — platform overview
// ---------------------------------------------------------------------------

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

function AdminDashboardBody({ user, queryClient }: { user: ReturnType<typeof useAuthStore.getState>['user']; queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: products = [], isLoading: productsLoading, error: productsError } = useAllProducts()
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategories()
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

  // Store focus: the backend resolves a developer's store explicitly, so
  // order/stock widgets need one. Defaults to the first store once loaded.
  const [focusStoreId, setFocusStoreId] = useState<number | null>(null)
  useEffect(() => {
    if (focusStoreId == null && stores.length > 0) setFocusStoreId(stores[0].id)
  }, [stores, focusStoreId])
  const focusStore: Store | undefined = stores.find((s) => s.id === focusStoreId)

  const { data: storeOrders = [], isLoading: storeOrdersLoading } = useStoreOrders(focusStoreId ?? undefined, undefined, { enabled: !!focusStoreId })
  const { data: pending = [] } = usePendingDispatch(focusStoreId ?? undefined, { enabled: !!focusStoreId })
  const { data: inventoryRaw } = useStoreInventory(focusStoreId ?? undefined, { enabled: !!focusStoreId })
  const inventory = (inventoryRaw ?? []) as Array<{ stock_quantity: number }>
  const lowStockCount = inventory.filter((i) => i.stock_quantity > 0 && i.stock_quantity < 10).length
  const outOfStockCount = inventory.filter((i) => i.stock_quantity === 0).length
  const awaitingDispatch = (pending as unknown[]).length

  const productsCount = products.length || 0
  const categoriesCount = categories.length || 0
  const storesCount = stores.length || 0
  const specialsCount = specials.length || 0
  const recipesCount = recipes.length || 0
  const contactCount = Array.isArray(contactData?.data) ? (contactData.data as unknown[]).length : Array.isArray(contactData) ? (contactData as unknown[]).length : null

  const loading = productsLoading || categoriesLoading || storesLoading || specialsLoading || recipesLoading || contactLoading
  const error = productsError?.message || categoriesError?.message || storesError?.message || specialsError?.message || recipesError?.message || contactError?.message || null
  const recentOrders = [...storeOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

  const fetchData = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] })
    queryClient.invalidateQueries({ queryKey: ['categories'] })
    queryClient.invalidateQueries({ queryKey: ['store-orders'] })
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
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              <LayoutDashboard size={12} />
              {roleBadge || 'Admin'}
            </span>
            {stores.length > 0 && (
              <label htmlFor="dev-store-focus" className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                Store focus
                <select
                  id="dev-store-focus"
                  value={focusStoreId ?? ''}
                  onChange={(e) => setFocusStoreId(Number(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            )}
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
              <StatCard icon={ShoppingBag} label="Products" value={productsCount} color="bg-primary" />
              <StatCard icon={Tags} label="Categories" value={categoriesCount} color="bg-blue-500" />
              <StatCard icon={ShoppingCart} label={focusStore ? `Orders · ${focusStore.name}` : 'Orders'} value={focusStoreId ? storeOrders.length : '—'} color="bg-success" />
              <StatCard icon={StoreIcon} label="Stores" value={storesCount} color="bg-purple-500" />
              <StatCard icon={Sparkles} label="Live Sales" value={specialsCount} color="bg-amber-500" />
              <StatCard icon={BookOpen} label="Recipes" value={recipesCount} color="bg-pink-500" />
            </div>
          )}
        </motion.div>

        {/* Store pulse — the focused store's operational state */}
        {focusStore && (
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4">
              {focusStore.name} — right now
            </h2>
            {storeOrdersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 h-20 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <PulseTile
                  label="awaiting dispatch"
                  count={awaitingDispatch}
                  href="/account/dispatch"
                  tone={awaitingDispatch > 0 ? 'warn' : 'ok'}
                />
                <PulseTile
                  label="low on stock"
                  count={lowStockCount}
                  href="/admin/inventory"
                  tone={lowStockCount > 0 ? 'warn' : 'ok'}
                />
                <PulseTile
                  label="out of stock"
                  count={outOfStockCount}
                  href="/admin/inventory"
                  tone={outOfStockCount > 0 ? 'danger' : 'ok'}
                />
              </div>
            )}
          </motion.div>
        )}

        {/* Navigation lives in the AdminNav sidebar — these pages used to
            duplicate it as icon-card grids (noise, per the admin audit). */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders — the focused store's orders, linking to the staff order view */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-primary hover:underline font-medium">
                All orders →
              </Link>
            </div>
            {storeOrdersLoading ? (
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
                <p className="text-sm text-gray-400">{focusStore ? `No orders for ${focusStore.name} yet` : stores.length > 0 ? 'Pick a store above to see its orders' : 'No stores yet'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/admin/orders"
                    className="block bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <OrderRow order={order} />
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

function PulseTile({ label, count, href, tone }: { label: string; count: number; href: string; tone: 'ok' | 'warn' | 'danger' }) {
  return (
    <Link
      href={href}
      className={`bg-white border rounded-xl p-4 hover:shadow-md transition-shadow flex items-center gap-3 ${
        tone === 'ok' ? 'border-gray-100' : tone === 'warn' ? 'border-amber-200 bg-amber-50/40' : 'border-red-200 bg-red-50/40'
      }`}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          tone === 'ok' ? 'bg-success' : tone === 'warn' ? 'bg-amber-500' : 'bg-red-500'
        }`}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="font-display text-xl font-bold text-gray-900 leading-none">{count}</p>
        <p className="text-xs text-gray-500 mt-1 truncate">{label}</p>
      </div>
    </Link>
  )
}
