'use client';

import { motion } from 'motion/react';
import { spring } from '@/lib/motion/tokens';

function SkeletonBlock({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: delay * 0.05, type: 'spring', ...spring.apple }}
      className={`shimmer rounded-[12px] border border-gray-100/50 ${className ?? ''}`}
    />
  );
}

export function ProductCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="space-y-3 bg-white rounded-[16px] p-3 border border-gray-100/80">
      <SkeletonBlock className="aspect-[4/3] rounded-[12px]" delay={index} />
      <div className="space-y-2">
        <SkeletonBlock className="h-3.5 w-3/4" delay={index} />
        <SkeletonBlock className="h-3 w-1/2" delay={index} />
        <SkeletonBlock className="h-4 w-1/3" delay={index} />
      </div>
    </motion.div>
  );
}

export function ProductCarouselSkeleton() {
  return (
    <div className="py-7">
      <div className="mb-5 flex items-baseline justify-between">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ProductCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return <SkeletonBlock className="w-full h-48 md:h-64 rounded-[20px]" />;
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-28 rounded-[16px]" delay={i} />
      ))}
    </div>
  );
}
