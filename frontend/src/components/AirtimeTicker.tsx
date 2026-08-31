'use client';

import { Glass } from 'solid-glass/react';
import 'solid-glass/css';

const PROVIDERS = [
  'MTN',
  'Vodacom',
  'Cell C',
  'YoCo',
  'rain',
  'Telkom',
  'PayAsYouGo',
];

export function AirtimeTicker() {
  const tickerContent = PROVIDERS.join(' • ');

  return (
    <div className="hidden md:block border-y border-[#E6DFD6]/30">
      <Glass effect="frosted" options={{ blur: 16 }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <span className="text-xs font-semibold text-text-muted font-[family-name:var(--font-primary)] uppercase tracking-wider whitespace-nowrap">
              Services
            </span>
            <span className="text-[#E6DFD6]/40">|</span>
            <span className="text-xs text-text-muted/70 font-[family-name:var(--font-primary)] whitespace-nowrap">
              Available in-store
            </span>
            <span className="text-[#E6DFD6]/40">|</span>
            <div className="overflow-hidden flex-1">
              <div className="marquee flex whitespace-nowrap">
                <span className="mx-4 text-sm font-medium text-text-muted font-[family-name:var(--font-primary)]">
                  {tickerContent}
                </span>
                <span className="mx-4 text-sm font-medium text-text-muted font-[family-name:var(--font-primary)]">
                  {tickerContent}
                </span>
                <span className="mx-4 text-sm font-medium text-text-muted font-[family-name:var(--font-primary)]">
                  {tickerContent}
                </span>
                <span className="mx-4 text-sm font-medium text-text-muted font-[family-name:var(--font-primary)]">
                  {tickerContent}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Glass>
    </div>
  );
}
