'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAddFavorite, useRemoveFavorite } from '@/lib/query'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export default function FavoriteHeart({ productId, size = 18 }: { productId: number; size?: number }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data: checkData } = useQuery({
    queryKey: ['favorite-check', productId],
    queryFn: () => api.checkFavorite(productId),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
  const addMut = useAddFavorite()
  const removeMut = useRemoveFavorite()
  const [localFav, setLocalFav] = useState<boolean | null>(null)

  const isFav = localFav ?? checkData?.isFavorited ?? false

  if (!isAuthenticated) return null

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isFav) {
      setLocalFav(false)
      removeMut.mutate(productId, {
        onSuccess: () => toast.success('Removed from favorites'),
        onError: () => { setLocalFav(true); toast.error('Failed to remove') },
      })
    } else {
      setLocalFav(true)
      addMut.mutate(productId, {
        onSuccess: () => toast.success('Added to favorites'),
        onError: () => { setLocalFav(false); toast.error('Failed to add') },
      })
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFav}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all ${isFav ? 'bg-primary text-white' : 'bg-white/80 text-gray-400 hover:text-primary hover:bg-white'}`}
    >
      <Heart size={size} className={isFav ? 'fill-white' : ''} />
    </button>
  )
}
