'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { ShoppingCart, Menu, X, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/products', label: 'Products' },
  { href: '/specials', label: 'Specials' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/community', label: 'Community' },
  { href: '/stores', label: 'Stores' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const itemCount = useCartStore(s => s.itemCount())

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-bold text-primary">
          Checkstar
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-sm text-gray-600 hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative p-2 text-gray-600 hover:text-primary transition-colors">
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link href={user?.role === 'rider' ? '/rider/dashboard' : '/account/orders'} className="p-2 text-gray-600 hover:text-primary transition-colors">
                <User size={20} />
              </Link>
              <button onClick={logout} className="p-2 text-gray-600 hover:text-accent transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="hidden sm:inline-flex bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
              Login
            </Link>
          )}

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 text-gray-600">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-100 bg-white overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="text-sm text-gray-600 hover:text-primary transition-colors">
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated && (
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                  Login / Register
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
