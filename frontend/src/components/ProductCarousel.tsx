'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import { fadeUp } from '@/lib/motion/variants';
import type { Product } from '@/types';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductCarouselProps {
  title: string;
  products: Product[];
  href?: string;
}

export function ProductCarousel({ title, products, href }: ProductCarouselProps) {
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
        <h2 className="text-xl font-bold tracking-tight text-text-primary font-[family-name:var(--font-primary)]">
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
        slidesPerView={1.5}
        navigation
        pagination={{ clickable: true }}
        breakpoints={{
          640: { slidesPerView: 2.5, spaceBetween: 16 },
          768: { slidesPerView: 3.5, spaceBetween: 16 },
          1024: { slidesPerView: 4.5, spaceBetween: 16 },
        }}
        className="product-carousel !-mx-2 !px-2 pb-10"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <Link href={`/products/${product.slug}`} className="group block">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border-subtle bg-background-secondary">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {product.effective_price !== product.price && (
                  <div className="absolute top-2 left-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                    Sale
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-semibold text-text-primary line-clamp-2 font-[family-name:var(--font-primary)]">
                  {product.name}
                </h3>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-base font-bold text-primary font-[family-name:var(--font-primary)]">
                    R{product.effective_price?.toFixed(2) ?? product.price.toFixed(2)}
                  </span>
                  {product.effective_price !== product.price && (
                    <span className="text-xs text-text-muted line-through">
                      R{product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.unit && (
                  <span className="text-xs text-text-muted">/{product.unit}</span>
                )}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.section>
  );
}
