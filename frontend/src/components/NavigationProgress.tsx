'use client';

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useNavigationState } from '@/lib/navigation/transition-service';

export function NavigationProgress() {
  const { status, progress } = useNavigationState();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {(status === 'loading' || progress > 0) && (
        <motion.div
          key="progress-bar"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-[#EB6522] via-[#F47A3A] to-[#EB6522] shadow-[0_0_12px_rgba(235,101,34,0.35)]"
          style={{
            width: `${progress * 100}%`,
            transition: 'width 120ms ease-out',
          }}
        />
      )}
    </AnimatePresence>
  );
}
