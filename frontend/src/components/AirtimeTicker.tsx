'use client';

const SERVICES = [
  { name: 'MTN', label: 'Airtime & Data' },
  { name: 'Vodacom', label: 'Airtime & Data' },
  { name: 'Cell C', label: 'Airtime & Data' },
  { name: 'Telkom', label: 'Airtime & Data' },
  { name: 'rain', label: 'Data' },
];

export function AirtimeTicker() {
  const tickerContent = SERVICES.map(s => s.name).join(' \u2022 ');

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="rounded-xl border border-border bg-surface px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Also In-Store
            </span>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Pick up airtime, data, and bill payments at any Checkstar store &mdash; MTN, Vodacom, Cell C, Telkom, and rain.
          </p>
        </div>
      </div>
    </section>
  );
}
