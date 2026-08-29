/**
 * Header Motion Presets — Varied motion identity for titles/headings.
 * Uses motion/react with different easing, durations, and techniques.
 */

import { motion, type Variants } from 'motion/react';

export const headerMotionVariants = {
  // Blur-to-focus with slight scale (elegant, editorial)
  blurFocus: {
    hidden: { opacity: 0, filter: 'blur(8px)', scale: 0.96 },
    show: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
  } as Variants,

  // Clip / mask reveal from bottom (sharp, architectural)
  clipUp: {
    hidden: { opacity: 0, clipPath: 'inset(100% 0 0 0)' },
    show: { opacity: 1, clipPath: 'inset(0% 0 0 0)', transition: { duration: 0.55, ease: [0.77, 0, 0.175, 1] } },
  } as Variants,

  // Staggered letter reveal (expressive, hand-drawn feel)
  letterReveal: {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } },
  } as Variants,

  // Scale with overshoot (playful bounce for smaller headers)
  overshoot: {
    hidden: { opacity: 0, scale: 0.85, y: 12 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
  } as Variants,

  // Gentle fade with subtle rotation (organic, warm)
  gentleRotate: {
    hidden: { opacity: 0, y: 8, rotate: -0.5 },
    show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
  } as Variants,
};
