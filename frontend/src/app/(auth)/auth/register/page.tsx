import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const RegisterClient = dynamic(() => import('./RegisterClient'), { ssr: false })

export const metadata: Metadata = {
  title: 'Register — Checkstar',
  description: 'Create a Checkstar customer account.',
}

export default function RegisterPage() {
  return <RegisterClient />
}
