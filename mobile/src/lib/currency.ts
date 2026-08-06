const zarFormatter = new Intl.NumberFormat('en-ZA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format a monetary amount in South African Rand.
 * @param cents - whole-cents amount (1234 == R 12,34)
 */
export function formatZar(cents: number): string {
  const amount = cents / 100;
  return `R ${zarFormatter.format(amount)}`;
}