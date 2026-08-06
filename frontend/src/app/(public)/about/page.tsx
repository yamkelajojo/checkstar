import type { Metadata } from 'next'
import AboutClient from './AboutClient'

export const metadata: Metadata = {
  title: 'About — Checkstar',
  description: 'Learn about Checkstar — our story, values, and team in Durban, South Africa.',
}

export default function AboutPage() {
  return <AboutClient />
}
