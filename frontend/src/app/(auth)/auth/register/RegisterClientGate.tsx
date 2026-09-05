'use client'

// Client-side gate for the register form: the page (Server Component) cannot
// pass `ssr: false` to next/dynamic itself, and the form relies on
// browser-only state (localStorage-persisted auth store).
import dynamic from 'next/dynamic'

const RegisterClient = dynamic(() => import('./RegisterClient'), { ssr: false })

export default function RegisterClientGate() {
  return <RegisterClient />
}
