import type { Metadata } from 'next'
import RegisterClient from './RegisterClient'

export const metadata: Metadata = {
  title: 'Register — Checkstar',
  description: 'Create a Checkstar customer account.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
