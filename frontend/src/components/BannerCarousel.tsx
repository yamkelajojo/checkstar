'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const activeBanners = useMemo(
    () => banners.filter(b => b.slides && b.slides.length > 0),
    [banners]
  );

  const totalSlides = activeBanners[currentBanner]?.slides.length ?? 0;

  useEffect(() => {
    if (activeBanners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev < totalSlides - 1) return prev + 1;
        setCurrentBanner(b => (b + 1) % activeBanners.length);
        return 0;
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [totalSlides, activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const banner = activeBanners[currentBanner];
  const slide = banner.slides[currentSlide];

  const goTo = (bannerIdx: number, slideIdx: number) => {
    setCurrentBanner(bannerIdx);
    setCurrentSlide(slideIdx);
  };

  const goNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      setCurrentBanner(b => (b + 1) % activeBanners.length);
      setCurrentSlide(0);
    }
  };

  const goPrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    } else {
      const prevBanner = currentBanner === 0 ? activeBanners.length - 1 : currentBanner - 1;
      setCurrentBanner(prevBanner);
      setCurrentSlide(activeBanners[prevBanner].slides.length - 1);
    }
  };

  const bgStyle = slide.bgType === 'gradient'
    ? { background: `linear-gradient(135deg, ${slide.colors.join(', ')})` }
    : slide.bgType === 'radial'
    ? { background: `radial-gradient(circle, ${slide.colors.join(', ')})` }
    : { background: slide.colors[0] };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={bgStyle}>
      {slide.pattern === 'dots' && (
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      )}
      {slide.pattern === 'lines' && (
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 11px)'
        }} />
      )}
      {slide.pattern === 'circles' && (
        <div className="absolute inset-0 opacity-10" style={{
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
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={goNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {activeBanners.map((b, bi) =>
          b.slides.map((_, si) => (
            <button
              key={`${bi}-${si}`}
              onClick={() => goTo(bi, si)}
              className={`w-2 h-2 rounded-full transition-colors ${
                bi === currentBanner && si === currentSlide ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
}
