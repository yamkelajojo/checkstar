'use client';

import { motion } from 'motion/react';
import { fadeUp } from '@/lib/motion/variants';

export function DownloadTheApp() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      className="py-0 overflow-x-clip"
    >
      <div className="bg-[#1B1816]">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — Copy + Store Buttons */}
            <motion.div variants={fadeUp} className="text-center md:text-left">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight uppercase">
                Download the{' '}
                <span className="text-primary">Checkstar</span>{' '}
                App
              </h2>
              <p className="mt-5 text-white/60 text-lg max-w-md mx-auto md:mx-0">
                Shop, track your order, and save — all in the palm of your hand.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
                <a
                  href="https://apps.apple.com/app/checkstar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-none opacity-70">Download on the</div>
                    <div className="text-sm font-semibold leading-tight">App Store</div>
                  </div>
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.checkstar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-black px-6 py-3.5 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 010 1.38l-2.302 2.302L15.396 12l2.302-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302L5.864 2.658z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-[10px] leading-none opacity-70">GET IT ON</div>
                    <div className="text-sm font-semibold leading-tight">Google Play</div>
                  </div>
                </a>
              </div>
            </motion.div>

            {/* Right — iOS Device Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center md:justify-end"
            >
              <div className="relative w-[260px] sm:w-[280px]">
                {/* Phone frame */}
                <div className="relative rounded-[44px] bg-black p-[10px] shadow-2xl shadow-black/40">
                  {/* Notch */}
                  <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-2xl z-10" />
                  {/* Screen */}
                  <div className="relative rounded-[36px] bg-white overflow-hidden aspect-[9/19.2]">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[10px] font-semibold text-black">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                      </div>
                    </div>
                    {/* App content placeholder */}
                    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-[#FFF5ED] to-white px-5">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
                        <svg width="24" height="24" viewBox="0 0 300 400" fill="none">
                          <path d="M 18 252 C 68 226 108 214 150 214 C 192 214 234 232 258 262 C 224 248 188 241 150 241 C 112 241 64 247 18 252 Z" fill="white" />
                          <path d="M 108 348 C 99 262 91 170 93 86 C 105 128 119 152 133 173 C 172 118 222 58 277 15 C 214 98 149 222 108 348 Z" fill="white" opacity="0.6" />
                        </svg>
                      </div>
                      <p className="text-xs font-bold text-gray-900 tracking-tight">Checkstar</p>
                      <p className="text-[9px] text-primary mt-0.5">Fresh groceries, delivered</p>
                      <div className="mt-4 w-full space-y-2">
                        <div className="h-8 rounded-lg bg-gray-100" />
                        <div className="flex gap-2">
                          <div className="h-16 flex-1 rounded-lg bg-primary/10" />
                          <div className="h-16 flex-1 rounded-lg bg-primary/10" />
                        </div>
                        <div className="h-8 rounded-lg bg-gray-100" />
                        <div className="flex gap-2">
                          <div className="h-16 flex-1 rounded-lg bg-primary/10" />
                          <div className="h-16 flex-1 rounded-lg bg-primary/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Home indicator */}
                <div className="mx-auto mt-2 w-[100px] h-[4px] rounded-full bg-white/30" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
