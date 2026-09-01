'use client';

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
    <div className="hidden md:block border-y border-border/30">
      <div className="text-center py-3">
        <h3 className="text-sm font-semibold text-text-muted font-[family-name:var(--font-primary)] uppercase tracking-wider" style={{ textAlign: 'center' }}>
          Available Instore
        </h3>
      </div>
      <div className="backdrop-blur-md bg-white/60 border-t border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <span className="text-xs font-semibold text-text-muted font-[family-name:var(--font-primary)] uppercase tracking-wider whitespace-nowrap">
              Services
            </span>
            <span className="text-border/40">|</span>
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
      </div>
    </div>
  );
}
