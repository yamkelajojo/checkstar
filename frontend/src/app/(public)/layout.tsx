'use client';

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartToast from '@/components/CartToast';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4, filter: 'blur(1px)' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: [0.4, 0.01, 0.165, 0.99] }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CartToast />
    </>
  );
}
