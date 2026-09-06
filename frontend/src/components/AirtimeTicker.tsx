'use client';

/**
 * "Also In-Store" home-page section — now a cult-ui LogoCarousel showing the
 * in-store services (MTN, Vodacom, Cell C, Telkom, rain) as animated brand
 * logos. Mock logos live in components/brand-logos.tsx; drop the real brand
 * SVGs in there when available and this section picks them up automatically.
 *
 * (Kept the historical export name; the old text-only ticker is gone.)
 */

import { GradientHeading } from '@/components/ui/gradient-heading';
import { LogoCarousel } from '@/components/ui/logo-carousel';

export function AirtimeTicker() {
  return (
    <section className="py-12" aria-label="Also in store">
      <div className="max-w-7xl mx-auto px-4">
        <div className="w-full max-w-screen-lg mx-auto flex flex-col items-center space-y-8">
          <div className="text-center">
            <GradientHeading variant="secondary" size="xs">
              Also In-Store
            </GradientHeading>
            <GradientHeading size="md">Airtime, data &amp; bill payments</GradientHeading>
          </div>

          {/* Decorative: the logos repeat the paragraph's information, so
              screen readers should hear the copy once, not five changing
              images. */}
          <div aria-hidden="true">
            <LogoCarousel columnCount={3} />
          </div>

          <p className="text-sm text-text-muted max-w-xl text-center leading-relaxed">
            Pick up airtime, data, and bill payments at any Checkstar store &mdash; MTN, Vodacom, Cell C, Telkom, and rain.
          </p>
        </div>
      </div>
    </section>
  );
}
