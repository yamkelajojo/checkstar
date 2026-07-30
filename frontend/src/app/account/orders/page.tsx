import type { Metadata } from 'next'
import OrdersClient from './OrdersClient'

export const metadata: Metadata = {
  title: 'My Orders — Checkstar',
  description: 'View your Checkstar order history.',
}

export default function OrdersPage() {
  return <OrdersClient />
}
