'use client';

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useNavigationState } from '@/lib/navigation/transition-service';
import { spring, ease } from '@/lib/motion/tokens';

export function NavigationProgress() {
  const { status, progress } = useNavigationState();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {(status === 'loading' || progress > 0) && (
        <motion.div
          key="progress-bar"
          initial={{ opacity: 0, y: -2, filter: 'blur(2px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -2, filter: 'blur(2px)' }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.25, ease: ease.apple }}
          className="fixed top-0 left-0 right-0 z-[60] h-[2.5px] bg-gradient-to-r from-primary via-[#FF8A4A] to-primary shadow-[0_0_12px_rgba(235,101,34,0.4)] origin-left"
          style={{
            scaleX: progress,
          }}
        />
      )}
    </AnimatePresence>
  );
}
