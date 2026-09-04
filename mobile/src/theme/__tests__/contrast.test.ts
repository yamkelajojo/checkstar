import { checkContrast } from '../colors';

describe('checkContrast', () => {
  it('returns true for high-contrast pairs', () => {
    expect(checkContrast('#000000', '#FFFFFF')).toBe(true);
    expect(checkContrast('#FFFFFF', '#000000')).toBe(true);
  });

  it('returns false for low-contrast normal text', () => {
    expect(checkContrast('#CCCCCC', '#FFFFFF')).toBe(false);
  });

  it('returns false for low-contrast large text', () => {
    // #CCCCCC on white is ~1.63:1 — fails even large text AA (3:1)
    expect(checkContrast('#CCCCCC', '#FFFFFF', true)).toBe(false);
  });

  it('returns true for WCAG AA threshold (4.5:1)', () => {
    // #767676 on white is exactly 4.54:1 — passes AA normal
    expect(checkContrast('#767676', '#FFFFFF')).toBe(true);
  });

  it('returns false below WCAG AA threshold', () => {
    // #999999 on white is ~2.85:1 — fails AA normal
    expect(checkContrast('#999999', '#FFFFFF')).toBe(false);
  });

  it('handles 3-character hex', () => {
    expect(checkContrast('#000', '#FFF')).toBe(true);
    expect(checkContrast('#CCC', '#FFF')).toBe(false);
  });

  it('handles hex without # prefix', () => {
    expect(checkContrast('000000', 'FFFFFF')).toBe(true);
  });

  it('returns true for non-hex inputs (rgba, named)', () => {
    expect(checkContrast('rgba(0,0,0,1)', '#FFFFFF')).toBe(true);
    expect(checkContrast('red', '#FFFFFF')).toBe(true);
  });

  it('Checkstar brand orange on white fails normal text AA', () => {
    // #EB6522 on white ~3.3:1 — fails AA normal, passes large
    expect(checkContrast('#EB6522', '#FFFFFF')).toBe(false);
    expect(checkContrast('#EB6522', '#FFFFFF', true)).toBe(true);
  });

  it('Checkstar dark orange on white passes normal text AA', () => {
    // #CC4400 on white ~4.6:1 — passes AA normal
    expect(checkContrast('#CC4400', '#FFFFFF')).toBe(true);
  });
});
