'use client'

import { motion } from 'motion/react'
import { fadeUpTight as fadeUp } from '@/lib/motion/variants'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />
}

export function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="text-center py-16"
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon size={32} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-600 mb-1">{title}</h3>
      <p className="text-sm text-gray-400">{description}</p>
    </motion.div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div variants={fadeUp} className="text-center py-12">
      <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={28} className="text-accent" />
      </div>
      <p className="text-sm text-gray-600 mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        <RefreshCw size={16} /> Retry
      </button>
    </motion.div>
  )
}
