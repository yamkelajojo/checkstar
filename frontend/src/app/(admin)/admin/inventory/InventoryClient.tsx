'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { api, ApiError } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { useStores } from '@/lib/query'
import Select from '@/components/ui/select'
import Tooltip from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  Package, Search, AlertTriangle, Loader2, RefreshCw,
  Check, X, Edit3, Eye, EyeOff, Lock, Store as StoreIcon,
  ArrowUpDown, Filter
} from 'lucide-react'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import type { Product } from '@/types'

interface InventoryItem {
  id: number
  store_id: number
  product_id: number
  stock_quantity: number
  reserved_quantity: number
  is_available: boolean
  product?: Product
}

type FilterType = 'all' | 'low' | 'out' | 'unavailable'

export default function InventoryClient() {
  const { user, isLoading: authLoading } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQuantity, setEditQuantity] = useState<string>('')
  const [storeIdInput, setStoreIdInput] = useState('')

  const allowedRoles = ['store_manager', 'logistics_officer', 'store_owner', 'developer']
  const authResolved = !authLoading && !!user
  const authorized = authResolved && allowedRoles.includes(user!.role)

  const { data: stores = [] } = useStores()
  const activeStoreId = user?.role === 'developer' && storeIdInput ? Number(storeIdInput) : undefined

  // For developer, require explicit store_id
  const shouldFetch = authorized && (user?.role !== 'developer' || !!activeStoreId)

  const { data: inventoryData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['store-inventory', activeStoreId],
    queryFn: () => api.getStoreInventory(activeStoreId).then(r => r.data),
    enabled: shouldFetch,
  })

  const updateMutation = useMutation({
    meta: { silent: true },
    mutationFn: ({ productId, data }: { productId: number; data: { stock_quantity?: number; is_available?: boolean } }) =>
      api.updateStoreInventory(productId, data, activeStoreId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-inventory'] })
      setEditingId(null)
      toast.success('Inventory updated')
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Could not update inventory'
      toast.error(msg)
    },
  })

  const inventory: InventoryItem[] = useMemo(() => (inventoryData as InventoryItem[]) ?? [], [inventoryData])

  const filtered = useMemo(() => {
    let items = inventory
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(i =>
        i.product?.name.toLowerCase().includes(q) ||
        i.product?.slug.toLowerCase().includes(q) ||
        String(i.product_id).includes(q)
      )
    }
    if (filter === 'low') items = items.filter(i => i.stock_quantity > 0 && i.stock_quantity < 10)
    if (filter === 'out') items = items.filter(i => i.stock_quantity === 0)
    if (filter === 'unavailable') items = items.filter(i => !i.is_available)
    return items
  }, [inventory, search, filter])

  const lowStockCount = useMemo(() => inventory.filter(i => i.stock_quantity > 0 && i.stock_quantity < 10).length, [inventory])
  const outOfStockCount = useMemo(() => inventory.filter(i => i.stock_quantity === 0).length, [inventory])
  const unavailableCount = useMemo(() => inventory.filter(i => !i.is_available).length, [inventory])

  if (authLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-primary" />
      </main>
    )
  }

  if (!authorized) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-rose-500" />
        </div>
        <h1 className="text-xl font-semibold">Not authorized</h1>
        <p className="text-sm text-gray-500 mt-2">
          Inventory management requires Store Manager, Logistics Officer, Store Owner or Developer access.
        </p>
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-4">
          Back to Dashboard
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">Inventory</h1>
            <p className="text-gray-500 text-sm">
              {inventory.length} product{inventory.length !== 1 ? 's' : ''} in stock
              {lowStockCount > 0 && <span className="text-amber-600"> · {lowStockCount} low stock</span>}
              {outOfStockCount > 0 && <span className="text-red-500"> · {outOfStockCount} out of stock</span>}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-primary transition-colors"
            aria-label="Refresh inventory"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin text-primary' : ''} />
          </button>
        </motion.div>

        {user?.role === 'developer' && (
          <motion.div variants={fadeUp} className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <label htmlFor="inventory-store-select" className="block text-xs font-medium text-amber-800 mb-1 flex items-center gap-1.5">
              <StoreIcon size={12} /> Developer: pick a store
            </label>
            <Select
              id="inventory-store-select"
              value={storeIdInput}
              onChange={setStoreIdInput}
              options={[
                { value: '', label: 'Select store…' },
                ...stores.map(s => ({
                  value: String((s as { id: number }).id),
                  label: (s as { name: string }).name,
                })),
              ]}
              placeholder="Select store…"
              className="min-w-56"
            />
            {!activeStoreId && (
              <p className="text-xs text-amber-700 mt-2">Select a store to load its inventory. This is required for the developer role.</p>
            )}
          </motion.div>
        )}

        {/* Filters */}
        <motion.div variants={fadeUp} className="mb-6 bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products by name or ID…"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label={`All (${inventory.length})`} />
              <FilterButton active={filter === 'low'} onClick={() => setFilter('low')} label={`Low (${lowStockCount})`} variant="amber" />
              <FilterButton active={filter === 'out'} onClick={() => setFilter('out')} label={`Out (${outOfStockCount})`} variant="red" />
              <FilterButton active={filter === 'unavailable'} onClick={() => setFilter('unavailable')} label={`Hidden (${unavailableCount})`} variant="gray" />
            </div>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div variants={fadeUp} className="mb-6 bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle size={18} className="text-accent shrink-0" />
            <p className="text-sm text-gray-600">{(error as Error).message}</p>
            <button onClick={() => refetch()} className="ml-auto text-primary text-sm font-medium hover:underline flex items-center gap-1">
              <RefreshCw size={13} /> Retry
            </button>
          </motion.div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="animate-pulse flex gap-4">
                  <div className="h-12 w-12 bg-gray-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-gray-100 rounded" />
                    <div className="h-3 w-32 bg-gray-100 rounded" />
                  </div>
                  <div className="h-8 w-20 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : user?.role === 'developer' && !activeStoreId ? (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <StoreIcon size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">Select a store to view inventory</p>
            <p className="text-sm text-gray-400">Developers must specify a store ID to access store-scoped data.</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <Package size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium mb-1">
              {inventory.length === 0 ? 'No inventory found' : 'No matching products'}
            </p>
            <p className="text-sm text-gray-400">
              {inventory.length === 0 ? 'This store has no products assigned yet.' : 'Try adjusting your search or filters.'}
            </p>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="space-y-3">
            {filtered.map(item => {
              const product = item.product
              const available = item.stock_quantity - (item.reserved_quantity ?? 0)
              const isLow = item.stock_quantity > 0 && item.stock_quantity < 10
              const isOut = item.stock_quantity === 0
              const isEditing = editingId === item.id

              return (
                <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    {/* Product image placeholder */}
                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {product?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package size={20} className="text-gray-300" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900 truncate">{product?.name ?? `Product #${item.product_id}`}</span>
                        {isLow && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Low stock</span>}
                        {isOut && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out of stock</span>}
                        {!item.is_available && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Hidden</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 tabular-nums">
                        <span>ID {item.product_id}</span>
                        <span>·</span>
                        <span>Reserved: {item.reserved_quantity ?? 0}</span>
                        <span>·</span>
                        <span className={available < 5 ? 'text-amber-600 font-medium' : ''}>Available: {available}</span>
                        {product?.unit && <><span>·</span><span>{product.unit}</span></>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Stock editor */}
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={item.reserved_quantity ?? 0}
                            value={editQuantity}
                            onChange={e => setEditQuantity(e.target.value)}
                            className="w-20 px-2 py-1.5 border border-primary/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const qty = Number(editQuantity)
                              if (Number.isNaN(qty) || qty < (item.reserved_quantity ?? 0)) {
                                toast.error(`Stock cannot be below reserved (${item.reserved_quantity ?? 0})`)
                                return
                              }
                              updateMutation.mutate({ productId: item.product_id, data: { stock_quantity: qty } })
                            }}
                            disabled={updateMutation.isPending}
                            className="p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-right mr-1">
                            <p className="text-sm font-semibold text-gray-900">{item.stock_quantity}</p>
                            <p className="text-[11px] text-gray-400">in stock</p>
                          </div>
                          <Tooltip content="Edit stock">
                            <button
                              onClick={() => {
                                setEditingId(item.id)
                                setEditQuantity(String(item.stock_quantity))
                              }}
                              aria-label="Edit stock"
                              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                            >
                              <Edit3 size={14} />
                            </button>
                          </Tooltip>
                        </>
                      )}

                      {/* Availability toggle */}
                      <Tooltip content={item.is_available ? 'Hide product' : 'Make available'}>
                        <button
                          onClick={() => updateMutation.mutate({ productId: item.product_id, data: { is_available: !item.is_available } })}
                          disabled={updateMutation.isPending}
                          aria-label={item.is_available ? 'Hide product' : 'Make available'}
                          className={`p-2 rounded-lg transition-colors ${item.is_available ? 'text-success hover:bg-success/10' : 'text-gray-300 hover:bg-gray-50'}`}
                        >
                          {item.is_available ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        <motion.div variants={fadeUp} className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5"><ArrowUpDown size={12} /> How inventory works</p>
          <p>Stock is decremented when a Rider marks items as bought at the Store, not when the Customer places the Order. Reserved quantity shows units in active orders. You cannot set stock below reserved quantity.</p>
        </motion.div>
      </motion.div>
    </main>
  )
}

function FilterButton({ active, onClick, label, variant = 'default' }: { active: boolean; onClick: () => void; label: string; variant?: 'default' | 'amber' | 'red' | 'gray' }) {
  const base = 'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap'
  const activeStyles = {
    default: 'bg-primary text-white border-primary',
    amber: 'bg-amber-500 text-white border-amber-500',
    red: 'bg-red-500 text-white border-red-500',
    gray: 'bg-gray-800 text-white border-gray-800',
  }
  const inactiveStyles = {
    default: 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    red: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
    gray: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
  }
  return (
    <button onClick={onClick} className={`${base} ${active ? activeStyles[variant] : inactiveStyles[variant]}`}>
      {label}
    </button>
  )
}
