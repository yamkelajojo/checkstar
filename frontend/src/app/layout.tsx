import type { Metadata } from 'next'
import './globals.css'
import { inter } from './fonts/inter/inter'
import { handlee } from './fonts/handlee/handlee'
import { Providers } from '@/lib/providers'
import { NavigationProgress } from '@/components/NavigationProgress'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Checkstar — Fresh groceries, delivered',
  description: 'Durban-based supermarket with free delivery',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} ${handlee.variable} bg-surface text-foreground`}>
        <NavigationProgress />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
