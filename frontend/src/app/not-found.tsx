import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <Logo variant="stacked" size={36} tone="dark" />

      <h1
        className="mt-8 font-bold text-foreground"
        style={{ fontFamily: 'var(--font-handlee), cursive', fontSize: '6rem', lineHeight: 1 }}
      >
        404
      </h1>

      <p className="mt-3 max-w-sm text-lg text-foreground/70">
        Sorry, we couldn&apos;t find that page. It may have been moved or doesn&apos;t exist.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-semibold text-surface transition-colors hover:bg-primary-dark"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M10 12L6 8l4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Go Home
      </Link>
    </div>
  );
}
