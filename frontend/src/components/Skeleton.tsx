'use client';

import { motion } from 'motion/react';

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`bg-gray-200 rounded-lg ${className ?? ''}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="aspect-square rounded-2xl" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}

export function ProductCarouselSkeleton() {
  return (
    <div className="py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <SkeletonBlock className="w-full h-48 md:h-64 rounded-2xl" />
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonBlock key={i} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}
