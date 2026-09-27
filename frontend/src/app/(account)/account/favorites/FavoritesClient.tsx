'use client'

import { motion } from 'motion/react'
import { Heart, ShoppingBag, Trash2, Search, AlertCircle, Loader2 } from 'lucide-react'
import { useFavorites, useRemoveFavorite } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import EmptyState from '@/components/EmptyState'
import ErrorNotice from '@/components/ErrorNotice'
import { useCartStore } from '@/stores/cart-store'
import { toast } from 'sonner'
import { fadeUpTight as fadeUp, staggerTight as stagger } from '@/lib/motion/variants'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import type { Product } from '@/types'
import { formatZar } from '@/lib/money'

export default function FavoritesClient() {
  const { user } = useAuthStore()
  const { data: favorites = [], isLoading, error, refetch } = useFavorites()
  const removeMut = useRemoveFavorite()
  const addItem = useCartStore(s => s.addItem)

  const handleRemove = (id: number) => {
    removeMut.mutate(id, { onSuccess: () => toast.success('Removed from favorites'), onError: (e: any) => toast.error(e.message || 'Failed') })
  }

  const handleAddToCart = (product: Product) => {
    addItem({ product, quantity: 1 } as any)
    toast.success('Added to cart')
  }

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Heart size={32} className="mx-auto text-gray-200 mb-3" />
        <h1 className="text-xl font-semibold">Sign in to see favorites</h1>
        <p className="text-sm text-gray-500 mt-2">Save products you love for quick re-order.</p>
        <Link href="/auth/login" className="inline-block mt-4 px-5 py-2.5 bg-primary text-white rounded-lg text-sm">Sign in</Link>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial="hidden" animate="show" variants={stagger}>
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Heart size={24} className="text-primary" /> Favorites</h1>
          <p className="text-sm text-gray-500 mt-1">{favorites.length} saved {favorites.length === 1 ? 'product' : 'products'}</p>
        </motion.div>

        {error && (
          <motion.div variants={fadeUp} className="mb-6">
            <ErrorNotice
              title="We couldn't load your favorites"
              error={error}
              onRetry={() => refetch()}
            />
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="bg-white border rounded-xl p-4 animate-pulse h-48" />)}</div>
        ) : favorites.length === 0 ? (
          <motion.div variants={fadeUp} className="bg-white border border-gray-100 rounded-xl">
            <EmptyState
              icon={Heart}
              title="No favorites yet"
              caption="Tap the heart on any product to save it for later."
              action={
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  Browse products
                </Link>
              }
            />
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {favorites.map((product: any) => {
              const p = product as Product
              return (
                <div key={p.id} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                      {p.image ? <SafeImage src={p.image} alt={p.name} width={200} height={200} className="object-cover w-full h-full group-hover:scale-105 transition-transform" /> : <ShoppingBag size={28} className="text-gray-300" />}
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/products/${p.slug}`}><p className="text-sm font-medium line-clamp-2 hover:text-primary">{p.name}</p></Link>
                    <p className="text-sm font-semibold text-primary mt-1">{formatZar(p.effective_price ?? p.sale_price ?? p.price)}</p>
                    <div className="flex gap-1.5 mt-3">
                      <button onClick={() => handleAddToCart(p)} className="flex-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary-dark">Add</button>
                      <button onClick={() => handleRemove(p.id)} disabled={removeMut.isPending} className="p-1.5 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </motion.div>
    </main>
  )
}
