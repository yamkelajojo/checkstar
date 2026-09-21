import type { Metadata } from 'next'
import InventoryClient from './InventoryClient'

export const metadata: Metadata = {
  title: 'Inventory | Checkstar Admin',
  description: 'Manage store inventory and stock levels',
}

export default function InventoryPage() {
  return <InventoryClient />
}
