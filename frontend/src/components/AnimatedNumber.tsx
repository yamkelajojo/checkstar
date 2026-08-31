'use client';

import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useState, useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export default function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (value !== display) {
      setKey((k) => k + 1);
      // Short delay to allow exit animation then update
      const timer = setTimeout(() => setDisplay(value), shouldReduceMotion ? 0 : 200);
      return () => clearTimeout(timer);
    }
  }, [value, display, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={`${key}-${display}`}
        initial={{ y: 10, opacity: 0, scale: 0.7 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -10, opacity: 0, scale: 0.7 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className={className}
      >
        {display}
      </motion.span>
    </AnimatePresence>
  );
}
