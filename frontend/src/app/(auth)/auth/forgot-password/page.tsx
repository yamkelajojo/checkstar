import type { Metadata } from 'next'
import ForgotPasswordClient from './ForgotPasswordClient'

export const metadata: Metadata = {
  title: 'Forgot password — Checkstar',
  description: 'Request a password reset link for your Checkstar account.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />
}
