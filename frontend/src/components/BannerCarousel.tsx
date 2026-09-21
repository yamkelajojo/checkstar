'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface Slide {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  url?: string;
  bgType: 'solid' | 'gradient' | 'radial';
  colors: string[];
  pattern?: string;
}

interface Banner {
  id: number;
  name: string;
  slides: Slide[];
}

interface BannerCarouselProps {
  banners: Banner[];
}

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const activeBanners = useMemo(
    () => banners.filter(b => b.slides && b.slides.length > 0),
    [banners]
  );

  const totalSlides = activeBanners[currentBanner]?.slides.length ?? 0;

  const goNext = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setCurrentBanner(b => (b + 1) % activeBanners.length);
      setCurrentSlide(0);
    }
  }, [currentSlide, totalSlides, activeBanners.length]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    } else {
      const prevBanner = currentBanner === 0 ? activeBanners.length - 1 : currentBanner - 1;
      setCurrentBanner(prevBanner);
      const prevSlides = activeBanners[prevBanner]?.slides;
      setCurrentSlide(prevSlides ? prevSlides.length - 1 : 0);
    }
  }, [currentSlide, currentBanner, activeBanners]);

  useEffect(() => {
    if (activeBanners.length === 0 || paused) return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) return;

    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [goNext, activeBanners.length, paused]);

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[currentBanner];
  if (!banner) return null;
  const slide = banner.slides[currentSlide];
  if (!slide) return null;

  const goTo = (bannerIdx: number, slideIdx: number) => {
    setCurrentBanner(bannerIdx);
    setCurrentSlide(slideIdx);
  };

  const bgStyle = slide.bgType === 'gradient'
    ? { background: `linear-gradient(135deg, ${slide.colors.join(', ')})` }
    : slide.bgType === 'radial'
    ? { background: `radial-gradient(circle, ${slide.colors.join(', ')})` }
    : { background: slide.colors[0] };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={bgStyle}
      role="region"
      aria-label="Promotional banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {slide.pattern === 'dots' && (
        <div className="absolute inset-0 opacity-10" aria-hidden="true" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      )}
      {slide.pattern === 'lines' && (
        <div className="absolute inset-0 opacity-10" aria-hidden="true" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)'
        }} />
      )}
      {slide.pattern === 'circles' && (
        <div className="absolute inset-0 opacity-10" aria-hidden="true" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 30%, white 31%, white 32%, transparent 33%)',
          backgroundSize: '40px 40px'
        }} />
      )}

      <div className="relative px-8 py-12 md:px-16 md:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentBanner}-${currentSlide}`}
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)', scale: 0.98 }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
            exit={{ opacity: 0, y: -8, filter: 'blur(6px)', scale: 0.98 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {slide.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-white/85 text-sm md:text-base mb-3 font-sans tracking-wide"
              >
                {slide.subtitle}
              </motion.p>
            )}
            <motion.h2
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-4xl font-bold text-white mb-7 font-sans leading-tight tracking-tight"
            >
              {slide.title}
            </motion.h2>
            {slide.ctaLabel && slide.url && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Link
                  href={slide.url}
                  className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-[12px] font-semibold hover:bg-white/90 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:scale-[1.02] active:scale-[0.98] duration-200"
                >
                  {slide.ctaLabel}
                </Link>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.3)' }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={goPrev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <ChevronLeft size={18} strokeWidth={2.5} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.3)' }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        onClick={goNext}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <ChevronRight size={18} strokeWidth={2.5} />
      </motion.button>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setPaused(p => !p)}
          aria-label={paused ? 'Resume autoplay' : 'Pause autoplay'}
          className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {paused ? <Play size={12} fill="white" /> : <Pause size={12} />}
        </motion.button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Banner slides">
        {activeBanners.map((b, bi) =>
          b.slides.map((_, si) => {
            const isActive = bi === currentBanner && si === currentSlide
            return (
              <motion.button
                key={`${bi}-${si}`}
                onClick={() => goTo(bi, si)}
                role="tab"
                aria-selected={isActive}
                aria-label={`Slide ${si + 1} of banner ${bi + 1}`}
                animate={{ scale: isActive ? 1.2 : 1, width: isActive ? 20 : 8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={`h-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 ${
                  isActive ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.2)]' : 'bg-white/40 hover:bg-white/60'
                }`}
              />
            )
          })
        )}
      </div>
    </div>
  );
}
