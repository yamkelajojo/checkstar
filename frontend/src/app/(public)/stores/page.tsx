import type { Metadata } from 'next'
import StoresClient from './StoresClient'

export const metadata: Metadata = {
  title: 'Our Stores — Checkstar',
  description: 'Find a Checkstar store near you in Durban.',
}

export default function StoresPage() {
  return <StoresClient />
}
