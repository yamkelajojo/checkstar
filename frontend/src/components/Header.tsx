'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ShoppingCart, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { navLinks } from '@/lib/navigation'
import NavLink from '@/components/NavLink'
import { Logo } from '@/components/Logo'
import AnimatedNumber from '@/components/AnimatedNumber'

const cubic: [number, number, number, number] = [0.4, 0.01, 0.165, 0.99]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const shouldReduceMotion = useReducedMotion()
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)
  const { user, isAuthenticated, logout } = useAuthStore()
  const itemCount = useCartStore(s => s.itemCount)

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

  // Close only after navigation completes — keeps overlay visible until next page content appears
  useEffect(() => {
    if (prevPathRef.current !== pathname && menuOpen) {
      setMenuOpen(false)
    }
    prevPathRef.current = pathname
  }, [pathname, menuOpen])

  const handleNavClick = (href: string) => {
    // Same-page click has no pathname change — close immediately
    if (href === pathname) setMenuOpen(false)
  }

  const panelVariants = {
    closed: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -8,
      filter: shouldReduceMotion ? 'blur(0px)' : 'blur(6px)',
      transition: shouldReduceMotion
        ? { duration: 0.1 }
        : {
            duration: 0.15,
            ease: cubic,
            when: 'afterChildren' as const,
            staggerChildren: 0.02,
            staggerDirection: -1 as const,
          },
    },
    open: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: shouldReduceMotion
        ? { duration: 0.1 }
        : {
            duration: 0.2,
            ease: cubic,
            when: 'beforeChildren' as const,
            staggerChildren: 0.025,
            delayChildren: 0.02,
          },
    },
  }

  const itemVariants = {
    closed: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : -8,
      scale: shouldReduceMotion ? 1 : 1.03,
      filter: shouldReduceMotion ? 'blur(0px)' : 'blur(2px)',
      transition: shouldReduceMotion ? { duration: 0.08 } : { duration: 0.12, ease: cubic },
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: shouldReduceMotion ? { duration: 0.08 } : { duration: 0.18, ease: cubic },
    },
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 hover:opacity-90 transition-opacity">
            <Logo variant="lockup" size={26} tone="dark" />
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
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium shadow-md shadow-primary/20">
                  <AnimatedNumber value={itemCount} />
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
                      ? { duration: 0.28, ease: cubic, delay: 0.05 }
                      : { duration: 0.22, ease: cubic }
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
                      ? { duration: 0.28, ease: cubic, delay: 0.05 }
                      : { duration: 0.22, ease: cubic }
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
              initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              animate={{ opacity: 1, backdropFilter: 'blur(2px)' }}
              exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
              transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.18, ease: cubic }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
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
              className="fixed inset-x-0 top-16 bottom-0 z-40 lg:hidden bg-white overflow-y-auto overscroll-contain will-change-transform flex flex-col pb-[env(safe-area-inset-bottom)]"
            >
              <motion.nav
                className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-1 text-center"
                variants={{ open: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } } }}
              >
                <div className="w-full max-w-sm flex flex-col items-center">
                  {navLinks.map(link => (
                    <motion.div key={link.href} variants={itemVariants} className="w-full">
                      <Link
                        href={link.href}
                        onClick={() => handleNavClick(link.href)}
                        className="flex items-center justify-center py-3.5 text-[17px] font-normal tracking-[-0.01em] text-gray-800 hover:text-primary transition-colors text-center"
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <motion.div variants={itemVariants} className="w-full max-w-sm pt-6 mt-2">
                  {!isAuthenticated ? (
                    <Link
                      href="/auth/login"
                      onClick={() => handleNavClick('/auth/login')}
                      className="inline-flex w-full items-center justify-center bg-primary text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors"
                    >
                      Login / Register
                    </Link>
                  ) : (
                    <div className="flex gap-3 w-full">
                      <Link
                        href={user?.role === 'rider' ? '/rider/dashboard' : '/account/orders'}
                        onClick={() => handleNavClick(user?.role === 'rider' ? '/rider/dashboard' : '/account/orders')}
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
