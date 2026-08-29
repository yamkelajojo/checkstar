'use client'

import { motion, useReducedMotion } from 'motion/react'
import { ease, dur } from '@/lib/animations/operations-motion'

interface AnimatedTextProps {
  text: string
  className?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
  delay?: number
}

export default function AnimatedText({
  text,
  className = '',
  as: Tag = 'span',
  delay = 0,
}: AnimatedTextProps) {
  const prefersReduced = useReducedMotion()

  if (prefersReduced) {
    return <Tag className={className}>{text}</Tag>
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur.base, delay, ease: ease.out }}
      style={{ display: 'inline-block' }}
    >
      {text}
    </motion.span>
  )
}
