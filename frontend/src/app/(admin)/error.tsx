'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="rounded-2xl border border-primary/20 bg-surface p-10 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#EB6522" strokeWidth="2" />
            <path d="M12 8v4m0 4h.01" stroke="#EB6522" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <h2 className="text-xl font-bold text-foreground">Admin dashboard error</h2>
        <p className="mt-2 max-w-sm text-sm text-foreground/60">
          {error.message || 'Something went wrong in the admin dashboard. Please try again.'}
        </p>

        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 font-semibold text-sm text-surface transition-colors hover:bg-primary-dark"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Try Again
        </button>
      </div>
    </div>
  );
}
