import { Suspense } from 'react'
import type { Metadata } from 'next'
import VerifyEmailClient from './VerifyEmailClient'

export const metadata: Metadata = {
  title: 'Verify email — Checkstar',
  description: 'Confirm your Checkstar account email address.',
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailClient />
    </Suspense>
  )
}
