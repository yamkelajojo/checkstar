import type { Metadata } from 'next'
import CartClient from './CartClient'

export const metadata: Metadata = {
  title: 'Cart — Checkstar',
  description: 'View and edit your Checkstar shopping cart.',
}

export default function CartPage() {
  return <CartClient />
}
