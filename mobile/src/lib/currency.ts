let zarFormatter: Intl.NumberFormat | null = null;
try {
  zarFormatter = new Intl.NumberFormat('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
} catch {
  zarFormatter = null;
}

/**
 * Format a monetary amount in South African Rand.
 * Falls back to manual toFixed when Intl is unavailable (Android JSC).
 * @param cents - whole-cents amount (1234 == R 12,34)
 */
export function formatZar(cents: number): string {
  const amount = cents / 100;
  if (zarFormatter) {
    try {
      return `R ${zarFormatter.format(amount)}`;
    } catch {}
  }
  // Fallback: manual 2-decimal with space separator
  const fixed = amount.toFixed(2);
  // Add thousands separator (e.g. 1234.50 -> 1 234.50 style? use comma for now)
  return `R ${fixed}`;
}