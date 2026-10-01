'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useFavorites, useAddFavorite, useRemoveFavorite } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export default function FavoriteHeart({ productId, size = 18 }: { productId: number; size?: number }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data: favorites = [] } = useFavorites({ enabled: isAuthenticated })
  const addMut = useAddFavorite()
  const removeMut = useRemoveFavorite()
  const [localFav, setLocalFav] = useState<boolean | null>(null)

  const serverFav = favorites.some((item: any) => {
    const p = item?.product ?? item
    return Number(p?.id ?? item?.product_id) === Number(productId)
  })

  useEffect(() => {
    setLocalFav(null)
  }, [serverFav])

  const isFav = localFav ?? serverFav

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      toast.info('Please sign in to save products to your favorites')
      return
    }
    if (isFav) {
      setLocalFav(false)
      removeMut.mutate(productId, {
        onSuccess: () => toast.success('Removed from favorites'),
        onError: () => {
          setLocalFav(true)
          toast.error('Failed to remove from favorites')
        },
      })
    } else {
      setLocalFav(true)
      addMut.mutate(productId, {
        onSuccess: () => toast.success('Added to favorites'),
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.status === 409) {
            setLocalFav(true)
            toast.success('Saved to favorites')
            return
          }
          setLocalFav(false)
          toast.error('Failed to add to favorites')
        },
      })
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFav}
      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm transition-all ${
        isFav
          ? 'bg-primary text-white'
          : 'bg-white/90 text-gray-500 hover:text-primary hover:bg-white'
      }`}
    >
      <Heart size={size} className={isFav ? 'fill-white' : ''} />
    </button>
  )
}
