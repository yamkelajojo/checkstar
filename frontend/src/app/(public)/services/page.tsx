import type { Metadata } from 'next'
import ServicesClient from './ServicesClient'

export const metadata: Metadata = {
  title: 'Services — Checkstar',
  description: 'Learn about Checkstar services including grocery delivery, in-store shopping, and more.',
}

export default function ServicesPage() {
  return <ServicesClient />
}
