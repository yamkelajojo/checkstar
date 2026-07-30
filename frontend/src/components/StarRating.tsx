'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export default function StarRating({ value, onChange, readonly = false, size = 20 }: Props) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
        >
          <Star
            size={size}
            className={(hover || value) >= star ? 'fill-warning text-warning' : 'text-gray-200'}
          />
        </button>
      ))}
    </div>
  )
}
