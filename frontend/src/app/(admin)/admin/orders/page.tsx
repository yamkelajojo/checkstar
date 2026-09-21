import type { Metadata } from 'next'
import StoreOrdersClient from './StoreOrdersClient'

export const metadata: Metadata = {
  title: 'Store Orders | Checkstar Admin',
  description: 'Manage orders for your store',
}

export default function StoreOrdersPage() {
  return <StoreOrdersClient />
}
