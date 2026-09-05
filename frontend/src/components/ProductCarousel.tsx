'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { fadeUp } from '@/lib/motion/variants';
import { ProductCarouselSkeleton } from '@/components/Skeleton';
import { ErrorFallback } from '@/components/ErrorFallback';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types';
import type { UseQueryResult } from '@tanstack/react-query';
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
  if (queryResult?.isLoading) {
    return <ProductCarouselSkeleton />;
  }

  if (queryResult?.isError) {
    return (
      <ErrorFallback
        message={`Failed to load ${title.toLowerCase()}`}
        onRetry={() => queryResult.refetch()}
      />
    );
  }

  if (products.length === 0) return null;

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={fadeUp}
      className="py-6"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            View All →
          </Link>
        )}
      </div>

      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={12}
        slidesPerView={2}
        slidesPerGroup={2}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 16 },
          768: { slidesPerView: 4, slidesPerGroup: 4, spaceBetween: 16 },
          1024: { slidesPerView: 5, slidesPerGroup: 5, spaceBetween: 16 },
        }}
        className="product-carousel !-mx-2 !px-2 pb-10"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} compact />
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.section>
  );
}
