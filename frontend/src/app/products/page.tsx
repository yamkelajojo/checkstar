import type { Metadata } from 'next'
import ProductsClient from './ProductsClient'

export const metadata: Metadata = {
  title: 'Products — Checkstar',
  description: 'Browse our full range of groceries and household essentials.',
}

export default function ProductsPage() {
  return <ProductsClient />
}
