import type { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = { title: 'Products | Checkstar Admin', description: 'Manage products' }

export default function ProductsPage() {
  return <ProductsClient />
}
