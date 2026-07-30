import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Checkstar — Fresh groceries, delivered',
  description: 'Durban-based supermarket with free delivery',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-white text-[#212529]">{children}</body>
    </html>
  )
}
