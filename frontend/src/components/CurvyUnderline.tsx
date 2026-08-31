'use client';

import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';

interface CurvyUnderlineProps {
  color?: string;
  width?: number;
  thickness?: number;
  className?: string;
}

export default function CurvyUnderline({
  color = '#EB6522',
  width = 140,
  thickness = 3,
  className = '',
}: CurvyUnderlineProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <svg
      width={width}
      height={thickness * 3}
      viewBox={`0 0 ${width} ${thickness * 3}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <motion.path
        d={`M 0 ${thickness * 1.5} Q ${width / 4} ${thickness * 0.5}, ${width / 2} ${thickness * 2}, ${width * 3 / 4} ${thickness * 0.8}, ${width} ${thickness * 1.5}`}
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={width}
        strokeDashoffset={width}
        initial={{ strokeDashoffset: shouldReduceMotion ? 0 : width }}
        animate={{ strokeDashoffset: shouldReduceMotion ? 0 : 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
      />
    </svg>
  );
}
