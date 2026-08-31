'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  startNavigation,
  completeNavigation,
  cancelNavigation,
  subscribeToNav,
} from '@/lib/navigation/transition-service';

/**
 * Page transition controller.
 * Manages leave/enter transitions and connects to navigation service.
 */
export function PageTransitionController({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const prevPathRef = useRef(pathname);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Handle navigation start on pathname change (before new content loads)
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      // Start leave transition
      const cleanup = startNavigation();
      cleanupRef.current = cleanup;
    }
  }, [pathname, searchParams]);

  // When new page is mounted and ready, complete navigation
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      // Wait a brief moment for content to mount, then complete
      const timer = setTimeout(() => {
        completeNavigation();
        cleanupRef.current?.();
        cleanupRef.current = null;
        prevPathRef.current = pathname;
      }, 250);

      return () => {
        clearTimeout(timer);
        // If component unmounts during transition (cancelled nav), clean up
        cancelNavigation();
        cleanupRef.current?.();
      };
    }
    prevPathRef.current = pathname;
  }, [pathname, searchParams]);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      cancelNavigation();
      cleanupRef.current?.();
    };
  }, []);

  return (
    <motion.div
      key={pathname}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 8, filter: 'blur(2px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, filter: 'blur(1px)' }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.35,
        ease: [0.4, 0.01, 0.165, 0.99],
      }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
}


