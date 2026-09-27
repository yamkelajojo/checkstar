'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { mediaUrl } from '@/lib/media'

type NextImageProps = Omit<Parameters<typeof Image>[0], 'src' | 'alt'>

interface SafeImageProps extends NextImageProps {
  src: string | null | undefined
  alt: string
}

/**
 * Same-origin path of the raster placeholder shipped with the API. Raster on
 * purpose: next/image's optimizer rejects `image/svg+xml` unless
 * `dangerouslyAllowSVG` is enabled, so an SVG fallback renders as a blank
 * card — the exact failure this component exists to prevent.
 */
export const MEDIA_FALLBACK_PATH = '/products/product-placeholder.webp'

/**
 * Crash-proof, blank-proof image for backend media.
 *
 * Backend image URLs are absolutized against whatever host the API request
 * arrived on (LAN IPs, tunnels, ports…). next/image throws at render time for
 * hosts that are not in `images.remotePatterns`, and that throw takes the
 * whole route down with it. mediaUrl() normalises the hosts we control to
 * same-origin paths — those keep the optimized next/image path. Anything that
 * is still an absolute http(s) URL renders as a plain <img>, which cannot
 * throw, instead of risking the page.
 *
 * On top of that, a media URL can still fail *after* render — a 404 for a
 * stale stored path, or an optimizer rejection. Previously the component
 * silently rendered nothing in that case, which is how "some product cards
 * have no image" shipped while every test stayed green. Now every failure
 * mode degrades to the branded placeholder instead of an empty card.
 */
export default function SafeImage({ src, alt, fill, width, height, sizes, className, style, priority, quality, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  // A new src is a new chance: don't carry a previous failure over.
  useEffect(() => {
    setFailed(false)
  }, [src])

  const requested = failed ? MEDIA_FALLBACK_PATH : mediaUrl(src)
  const normalized = requested || MEDIA_FALLBACK_PATH

  const handleError = () => {
    // Guard against looping if the placeholder itself ever fails to load.
    if (!failed) setFailed(true)
  }

  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith('blob:') || normalized.startsWith('data:')) {
    const fallbackStyle = fill
      ? { position: 'absolute' as const, inset: 0, width: '100%', height: '100%', ...style }
      : style
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={normalized}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={className}
        style={fallbackStyle}
        onError={handleError}
      />
    )
  }

  return (
    <Image
      src={normalized}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      quality={quality}
      onError={handleError}
      {...rest}
    />
  )
}
