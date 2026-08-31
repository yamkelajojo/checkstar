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
    <div className="hidden md:block border-y border-border-subtle">
      <Glass effect="frosted" options={{ blur: 16 }}>
        <div className="overflow-hidden py-3">
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
      </Glass>
    </div>
  );
}
