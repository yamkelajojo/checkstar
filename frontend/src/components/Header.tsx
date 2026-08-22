'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ShoppingCart, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { navLinks } from '@/lib/navigation'
import NavLink from '@/components/NavLink'

const cubic: [number, number, number, number] = [0.4, 0.01, 0.165, 0.99]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const { user, isAuthenticated, logout } = useAuthStore()
  const itemCount = useCartStore(s => s.itemCount())

  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const panelVariants = {
    closed: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -12,
      height: 0,
      transition: shouldReduceMotion
        ? { duration: 0.15 }
        : {
            duration: 0.3,
            ease: cubic,
            when: 'afterChildren' as const,
            staggerChildren: 0.04,
            staggerDirection: -1 as const,
          },
    },
    open: {
      opacity: 1,
      y: 0,
      height: 'auto' as const,
      transition: shouldReduceMotion
        ? { duration: 0.15 }
        : {
            duration: 0.5,
            ease: cubic,
            when: 'beforeChildren' as const,
            staggerChildren: 0.07,
            delayChildren: 0.15,
          },
    },
  }

  const itemVariants = {
    closed: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -14,
      scale: shouldReduceMotion ? 1 : 1.06,
      transition: shouldReduceMotion ? { duration: 0.12 } : { duration: 0.25, ease: cubic },
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: shouldReduceMotion ? { duration: 0.12 } : { duration: 0.45, ease: cubic },
    },
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl font-bold text-primary">
            Checkstar
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(link => (
              <NavLink key={link.href} href={link.href} label={link.label} />
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
                <button onClick={() => { logout().catch(() => {}) }} className="p-2 text-gray-600 hover:text-accent transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden sm:inline-flex bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                Login
              </Link>
            )}

            <motion.button
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="lg:hidden relative inline-flex items-center justify-center w-11 h-11 -mr-2 text-gray-700 hover:text-primary transition-colors touch-manipulation"
            >
              <motion.span
                animate={menuOpen ? 'open' : 'closed'}
                variants={{ closed: { rotate: 0 }, open: { rotate: 90 } }}
                transition={shouldReduceMotion ? { duration: 0.15 } : { duration: 0.3, ease: cubic }}
                className="relative block w-[22px] h-[14px]"
              >
                <motion.span
                  variants={{
                    closed: { y: 0, rotate: 0 },
                    open: { y: 6, rotate: 45 },
                  }}
                  transition={
                    menuOpen
                      ? { duration: 0.4, ease: cubic, delay: 0.12 }
                      : { duration: 0.3, ease: cubic }
                  }
                  className="absolute left-0 top-0 w-full h-[2px] bg-current rounded-full origin-center"
                />
                <motion.span
                  variants={{
                    closed: { y: 8, rotate: 0 },
                    open: { y: 6, rotate: -45 },
                  }}
                  transition={
                    menuOpen
                      ? { duration: 0.4, ease: cubic, delay: 0.12 }
                      : { duration: 0.3, ease: cubic }
                  }
                  className="absolute left-0 top-0 w-full h-[2px] bg-current rounded-full origin-center"
                />
              </motion.span>
            </motion.button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={shouldReduceMotion ? { duration: 0.15 } : { duration: 0.35, ease: cubic }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 top-16 bg-black/20 backdrop-blur-[2px] z-40 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              key="panel"
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial="closed"
              animate="open"
              exit="closed"
              variants={panelVariants}
              className="fixed top-16 left-0 right-0 z-40 lg:hidden bg-white border-t border-gray-100 shadow-[0_12px_32px_rgba(0,0,0,0.08)] overflow-hidden will-change-transform"
            >
              <motion.nav
                className="max-w-7xl mx-auto px-4 py-5 flex flex-col"
                variants={{ open: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } }}
              >
                {navLinks.map(link => (
                  <motion.div key={link.href} variants={itemVariants} className="border-b border-gray-100 last:border-0">
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center py-3.5 text-[17px] font-medium text-gray-800 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div variants={itemVariants} className="pt-4 mt-1">
                  {!isAuthenticated ? (
                    <Link
                      href="/auth/login"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex w-full items-center justify-center bg-primary text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Login / Register
                    </Link>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        href={user?.role === 'rider' ? '/rider/dashboard' : '/account/orders'}
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-xl text-sm font-medium"
                      >
                        <User size={16} /> Account
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          logout().catch(() => {})
                        }}
                        className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl text-sm font-medium"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  )}
                </motion.div>
              </motion.nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
