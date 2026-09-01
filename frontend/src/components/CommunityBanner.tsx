'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { fadeUp } from '@/lib/motion/variants';

export function CommunityBanner() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      className="py-16"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-light to-primary/10 p-8 md:p-12 text-center">
          <div className="absolute top-4 right-4 text-primary/20" aria-hidden="true">
            <Heart size={120} fill="currentColor" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Heart className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary font-[family-name:var(--font-primary)]">
              Our Community
            </h2>
            <p className="mt-4 text-text-muted text-lg max-w-2xl mx-auto">
              From Christmas parties to library reopenings — Checkstar has been part of Durban for over a decade.
            </p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 mt-8 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              See Our Impact →
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
