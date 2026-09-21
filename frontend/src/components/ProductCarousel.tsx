'use client';

import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { ProductCarouselSkeleton } from '@/components/Skeleton';
import { ErrorFallback } from '@/components/ErrorFallback';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';
import type { UseQueryResult } from '@tanstack/react-query';
import { spring, ease } from '@/lib/motion/tokens';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  href?: string;
  queryResult?: UseQueryResult;
}

export function ProductCarousel({ title, products, href, queryResult }: ProductCarouselProps) {
  const shouldReduce = useReducedMotion()

  if (queryResult?.isLoading) {
    return <ProductCarouselSkeleton />;
  }

  if (queryResult?.isError) {
    return (
      <ErrorFallback
        message={`Couldn't load ${title.toLowerCase()}`}
        onRetry={() => queryResult.refetch()}
      />
    );
  }

  if (products.length === 0) {
    return (
      <motion.section
        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true }}
        transition={{ ease: ease.apple }}
        className="py-6"
      >
        <h2 className="text-[18px] font-bold tracking-tight text-foreground mb-3">{title}</h2>
        <div className="py-10 text-center bg-white rounded-[16px] border border-gray-100 shadow-sm">
          <p className="text-[13px] text-gray-400">Nothing here yet — check back soon.</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
      }}
      className="py-7"
    >
      <motion.div
        variants={{
          hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: 'blur(4px)' },
          visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: ease.apple } },
        }}
        className="mb-5 flex items-baseline justify-between"
      >
        <h2 className="text-[19px] font-bold tracking-tight text-foreground font-sans">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="text-[13px] font-semibold text-primary hover:text-primary-dark transition-colors inline-flex items-center gap-1 group"
          >
            View All <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        )}
      </motion.div>

      <motion.div
        variants={{
          hidden: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', ...spring.apple, delay: 0.08 } },
        }}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={12}
          slidesPerView={2}
          slidesPerGroup={2}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 14 },
            768: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 16 },
            1024: { slidesPerView: 5, slidesPerGroup: 5, spaceBetween: 16 },
          }}
          className="product-carousel !-mx-2 !px-2 pb-10"
        >
          {products.map((product, idx) => (
            <SwiperSlide key={product.id}>
              <ProductCard product={product} compact index={idx} />
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
    </motion.section>
  );
}
