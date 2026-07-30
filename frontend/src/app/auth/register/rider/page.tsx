import type { Metadata } from 'next'
import RiderRegisterClient from './RiderRegisterClient'

export const metadata: Metadata = {
  title: 'Become a Rider — Checkstar',
  description: 'Register as a Checkstar delivery Rider.',
}

export default function RiderRegisterPage() {
  return <RiderRegisterClient />
}
