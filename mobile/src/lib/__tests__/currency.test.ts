import { formatZar } from '../currency';

describe('formatZar', () => {
  it('formats zero', () => {
    expect(formatZar(0)).toBe('R 0,00');
  });

  it('formats cents as two decimal ZAR with comma decimal separator', () => {
    expect(formatZar(1234)).toBe('R 12,34');
  });

  it('rounds half up at two decimals', () => {
    expect(formatZar(999)).toBe('R 9,99');
  });

  it('formats a whole-rand amount', () => {
    expect(formatZar(1200)).toBe('R 12,00');
  });

  it('handles negative amounts', () => {
    expect(formatZar(-450)).toBe('R -4,50');
  });
});