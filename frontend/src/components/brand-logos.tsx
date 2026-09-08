'use client';

/**
 * Carrier logos for the "Also In-Store" services carousel.
 *
 * Real brand logos served from /public/images/logos (PNG). Each component is
 * a function accepting standard SVG props (className is all the LogoCarousel
 * forwards) so the vendored logo-carousel keeps working unchanged.
 */

import type { SVGProps } from 'react'
import Image from 'next/image'

function logoImage(src: string, alt: string, width: number, height: number) {
  function BrandLogo(props: SVGProps<SVGSVGElement>) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={props.className}
      />
    )
  }

  BrandLogo.displayName = `BrandLogo(${alt})`

  return BrandLogo
}

/** MTN — yellow with black wordmark. */
export const MTNLogo = logoImage('/images/logos/mtn-logo.png', 'MTN', 600, 600)

/** Vodacom — red with white wordmark. */
export const VodacomLogo = logoImage('/images/logos/vodacom-logo.png', 'Vodacom', 3000, 2000)

/** Cell C — white with red wordmark. */
export const CellCLogo = logoImage('/images/logos/cell-c-logo.png', 'Cell C', 1000, 556)

/** Telkom — blue with white wordmark. */
export const TelkomLogo = logoImage('/images/logos/telkom-logo.png', 'Telkom', 3000, 2000)

/** rain — black with white lowercase wordmark. */
export const RainLogo = logoImage('/images/logos/rain-logo.png', 'rain', 500, 280)

/** The service set shown in the carousel. */
export const BRAND_LOGOS = [
  { name: 'MTN', id: 1, img: MTNLogo },
  { name: 'Vodacom', id: 2, img: VodacomLogo },
  { name: 'Cell C', id: 3, img: CellCLogo },
  { name: 'Telkom', id: 4, img: TelkomLogo },
  { name: 'rain', id: 5, img: RainLogo },
] as const