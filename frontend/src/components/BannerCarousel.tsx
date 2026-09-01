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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            {slide.subtitle && (
              <p className="text-white/80 text-sm md:text-base mb-2 font-[family-name:var(--font-primary)]">
                {slide.subtitle}
              </p>
            )}
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 font-[family-name:var(--font-primary)]">
              {slide.title}
            </h2>
            {slide.ctaLabel && slide.url && (
              <Link
                href={slide.url}
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                {slide.ctaLabel}
              </Link>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <button
        onClick={goPrev}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goNext}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        <button
          onClick={() => setPaused(p => !p)}
          aria-label={paused ? 'Resume autoplay' : 'Pause autoplay'}
          className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="Banner slides">
        {activeBanners.map((b, bi) =>
          b.slides.map((_, si) => (
            <button
              key={`${bi}-${si}`}
              onClick={() => goTo(bi, si)}
              role="tab"
              aria-selected={bi === currentBanner && si === currentSlide}
              aria-label={`Slide ${si + 1} of banner ${bi + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/50 ${
                bi === currentBanner && si === currentSlide
                  ? 'bg-white scale-110'
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
}
