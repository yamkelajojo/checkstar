import type { Metadata } from 'next'
import ContactClient from './ContactClient'

export const metadata: Metadata = {
  title: 'Contact Us — Checkstar',
  description: 'Get in touch with Checkstar — we would love to hear from you.',
}

export default function ContactPage() {
  return <ContactClient />
}
