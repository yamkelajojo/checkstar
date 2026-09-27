'use client';

import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { spring } from '@/lib/motion/tokens';

interface ErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorFallback({ message = 'Something went wrong', onRetry, className }: ErrorFallbackProps) {
  const shouldReduce = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', ...spring.apple }}
      className={`flex flex-col items-center justify-center py-12 text-center bg-white rounded-card border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ${className ?? ''}`}
    >
      <motion.div
        initial={shouldReduce ? undefined : { scale: 0.8, rotate: -4 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', ...spring.appleBounce, delay: 0.1 }}
        className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4"
      >
        <AlertTriangle className="text-red-500" size={20} strokeWidth={2} />
      </motion.div>
      <p className="text-[14px] font-semibold text-gray-900 tracking-tight mb-1">{message}</p>
      <p className="text-[12px] text-gray-500 mb-5 max-w-[28ch] leading-relaxed">Please try again or check your connection.</p>
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-gray-900 px-4 py-2 rounded-full hover:bg-black transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
        >
          <RefreshCw size={14} strokeWidth={2} />
          Try again
        </motion.button>
      )}
    </motion.div>
  );
}
