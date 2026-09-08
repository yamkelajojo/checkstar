import { Suspense } from 'react'
import type { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
  title: 'Products — Checkstar',
  description: 'Browse our full range of groceries and household essentials.',
}

function ProductsFallback() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-4 pb-6 sm:pt-6 sm:pb-8 lg:py-8">
      <div className="h-9 w-44 rounded-lg bg-gray-50 animate-pulse" />
      <div className="mt-3 h-4 w-72 rounded bg-gray-50 animate-pulse" />
      <div className="mt-6 h-11 max-w-md rounded-lg bg-gray-50 animate-pulse" />
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-3 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-gray-50 rounded-xl aspect-square animate-pulse" />
        ))}
      </div>
    </div>
  )
}

/**
 * ProductsClient reads `?search=` via useSearchParams, which requires a
 * Suspense boundary on statically prerendered routes — without it, client
 * navigation into this page can throw (the crash reported on the products
 * page). Every other route using useSearchParams (login, reset, verify)
 * already wraps its client the same way.
 */
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsFallback />}>
      <ProductsClient />
    </Suspense>
  )
}
