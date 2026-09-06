'use client';

import { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

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
  mass?: number;
  stiffness?: number;
  damping?: number;
  precision?: number;
  format?: (value: number) => string;
}

export default function AnimatedNumber({
  value,
  mass = 0.8,
  stiffness = 75,
  damping = 15,
  precision = 0,
  format,
}: AnimatedNumberProps) {
  const spring = useSpring(value, { mass, stiffness, damping });
  const display = useTransform(spring, (current: number) => {
    const n = parseFloat(current.toFixed(precision));
    return format ? format(n) : n.toLocaleString();
  });

  useEffect(() => {
    spring.set(value);
    return () => spring.stop();
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}
