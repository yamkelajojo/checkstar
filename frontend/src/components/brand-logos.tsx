'use client';

/**
 * MOCK brand logos for the "Also In-Store" services carousel.
 *
 * ⚠️ PLACEHOLDERS — replace with the real brand SVGs when available.
 * Each component is a self-contained SVG accepting standard SVG props, which
 * is all the LogoCarousel requires (img: ComponentType<SVGProps<SVGSVGElement>>).
 * To swap in a real logo: paste the official SVG as a component here (or
 * import it) and keep the entry shape in LOGOS below.
 */

import type { SVGProps } from 'react'

const BADGE = {
  width: 240,
  height: 120,
  rx: 18,
} as const

function Badge({
  fill,
  stroke,
  children,
  ...props
}: SVGProps<SVGSVGElement> & { fill: string; stroke?: string }) {
  return (
    <svg
      viewBox={`0 0 ${BADGE.width} ${BADGE.height}`}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect
        x="4"
        y="4"
        width={BADGE.width - 8}
        height={BADGE.height - 8}
        rx={BADGE.rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke ? 3 : 0}
      />
      {children}
    </svg>
  )
}

/** MTN — yellow with black wordmark (mock). */
export function MTNLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge fill="#FFCB05" {...props}>
      <text
        x="120"
        y="66"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="46"
        fill="#0A0A0A"
        letterSpacing="2"
      >
        MTN
      </text>
    </Badge>
  )
}

/** Vodacom — red with white wordmark (mock). */
export function VodacomLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge fill="#E60000" {...props}>
      <text
        x="120"
        y="64"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="38"
        fill="#FFFFFF"
      >
        vodacom
      </text>
    </Badge>
  )
}

/** Cell C — white with red wordmark (mock). */
export function CellCLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge fill="#FFFFFF" stroke="#E3E3E3" {...props}>
      <text
        x="120"
        y="64"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="900"
        fontSize="40"
        fill="#E30613"
      >
        Cell C
      </text>
    </Badge>
  )
}

/** Telkom — blue with white wordmark (mock). */
export function TelkomLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge fill="#0066B3" {...props}>
      <text
        x="120"
        y="64"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="38"
        fill="#FFFFFF"
      >
        Telkom
      </text>
    </Badge>
  )
}

/** rain — black with white lowercase wordmark (mock). */
export function RainLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <Badge fill="#0A0A0A" {...props}>
      <text
        x="120"
        y="64"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="44"
        fill="#FFFFFF"
        letterSpacing="1"
      >
        rain
      </text>
    </Badge>
  )
}

/** The service set shown in the carousel. Swap components for real logos here. */
export const BRAND_LOGOS = [
  { name: 'MTN', id: 1, img: MTNLogo },
  { name: 'Vodacom', id: 2, img: VodacomLogo },
  { name: 'Cell C', id: 3, img: CellCLogo },
  { name: 'Telkom', id: 4, img: TelkomLogo },
  { name: 'rain', id: 5, img: RainLogo },
] as const
