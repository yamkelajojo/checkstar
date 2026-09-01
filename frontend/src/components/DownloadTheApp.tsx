'use client';

import { motion } from 'motion/react';
import { fadeUp } from '@/lib/motion/variants';
import { Smartphone } from 'lucide-react';

export function DownloadTheApp() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      className="py-16"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-dark to-primary-dark">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" aria-hidden="true" />
          <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 md:p-12">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-[family-name:var(--font-primary)]">
                Get the Checkstar App
              </h2>
              <p className="mt-3 text-white/80 text-lg">
                Shop, track, and save &mdash; all in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                <a
                  href="https://apps.apple.com/app/checkstar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-semibold hover:bg-black/90 transition-colors"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-none opacity-80">Download on the</div>
                    <div className="text-sm font-semibold leading-tight">App Store</div>
                  </div>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.checkstar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-semibold hover:bg-black/90 transition-colors"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-none opacity-80">GET IT ON</div>
                    <div className="text-sm font-semibold leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
            </div>
            <div className="relative w-48 h-80 flex-shrink-0">
              <div className="absolute inset-0 rounded-[40px] border-[6px] border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
                <div className="absolute inset-4 rounded-[32px] bg-gradient-to-b from-white/20 to-white/5 overflow-hidden">
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Smartphone className="text-white/50" size={40} />
                    <div className="text-center">
                      <p className="text-white/80 text-xs font-semibold">Checkstar</p>
                      <p className="text-white/50 text-[10px]">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
