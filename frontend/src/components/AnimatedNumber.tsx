'use client';

import { useEffect } from 'react';
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';

/**
 * AnimatedNumber — vendored from cult-ui (MIT), lightly adapted.
 *
 * The value itself is spring-driven and ticks odometer-style as it changes:
 * no mount/unmount swap, no delayed state update, no scale bounce — the
 * jaggedness the old implementation had. Formatting runs on every frame, so
 * money (`format`), integers (`precision`) and counts all share one smooth
 * effect; tune the feel per context via the spring props (quantities get a
 * snappier spring, prices the soft default).
 */
interface AnimatedNumberProps {
  value: number;
  className?: string;
  mass?: number;
  stiffness?: number;
  damping?: number;
  precision?: number;
  format?: (value: number) => string;
}

export default function AnimatedNumber({
  value,
  className,
  mass = 0.8,
  stiffness = 75,
  damping = 15,
  precision = 0,
  format,
}: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const spring = useSpring(value, { mass, stiffness, damping });
  const display = useTransform(spring, (current: number) => {
    const n = parseFloat(current.toFixed(precision));
    return format ? format(n) : n.toLocaleString();
  });

  useEffect(() => {
    spring.set(value);
    return () => spring.stop();
  }, [spring, value]);

  // prefers-reduced-motion: no odometer — show the final value statically
  // (restores the behaviour the pre-spring implementation had).
  if (shouldReduceMotion) {
    const n = parseFloat(value.toFixed(precision));
    return <span className={className}>{format ? format(n) : n.toLocaleString()}</span>;
  }

  return <motion.span className={className}>{display}</motion.span>;
}
