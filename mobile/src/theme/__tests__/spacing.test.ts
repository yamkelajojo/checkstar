/**
 * Design System Spacing & Radius Tests
 * V-Model: Unit testing of 4pt grid, semantic aliases, radius, elevation
 */

import {
  spacing,
  semanticSpacing,
  radius,
  semanticRadius,
  borderWidth,
  elevation,
  hitTarget,
} from '../spacing';

describe('Spacing Scale — 4pt Base Grid', () => {
  it('has base units following 4pt rhythm', () => {
    expect(spacing.xxs).toBe(4);   // 1×4
    expect(spacing.xs).toBe(8);    // 2×4
    expect(spacing.sm).toBe(12);   // 3×4
    expect(spacing.md).toBe(16);   // 4×4
    expect(spacing.lg).toBe(20);   // 5×4
    expect(spacing.xl).toBe(24);   // 6×4
    expect(spacing.xxl).toBe(32);  // 8×4
    expect(spacing.xxxl).toBe(40); // 10×4
    expect(spacing.huge).toBe(48); // 12×4
    expect(spacing.massive).toBe(64); // 16×4
    expect(spacing.extreme).toBe(80); // 20×4
  });

  it('primary rhythm revolves around 8/16/24/32', () => {
    const primary = [spacing.xs, spacing.md, spacing.xl, spacing.xxl];
    expect(primary).toEqual([8, 16, 24, 32]);
  });

  it('avoids arbitrary values like 13, 19, 27', () => {
    const allValues = Object.values(spacing);
    const arbitrary = [13, 19, 27, 33, 37, 44, 52, 56, 60, 68, 72, 76];
    arbitrary.forEach((val) => {
      expect(allValues).not.toContain(val);
    });
  });
});

describe('Semantic Spacing Aliases', () => {
  it('screenPadding uses md (16)', () => {
    expect(semanticSpacing.screenPadding).toBe(spacing.md);
  });

  it('cardPadding uses md (16), comfortable uses lg (20)', () => {
    expect(semanticSpacing.cardPadding).toBe(spacing.md);
    expect(semanticSpacing.cardPaddingComfortable).toBe(spacing.lg);
  });

  it('sectionGap uses xl (24)', () => {
    expect(semanticSpacing.sectionGap).toBe(spacing.xl);
  });

  it('groupGap uses md (16), elementGap uses sm (12)', () => {
    expect(semanticSpacing.groupGap).toBe(spacing.md);
    expect(semanticSpacing.elementGap).toBe(spacing.sm);
  });

  it('tightGap uses xs (8), microGap uses xxs (4)', () => {
    expect(semanticSpacing.tightGap).toBe(spacing.xs);
    expect(semanticSpacing.microGap).toBe(spacing.xxs);
  });

  it('inlineGap uses xs (8) for chips/pills', () => {
    expect(semanticSpacing.inlineGap).toBe(spacing.xs);
  });

  it('fieldGap uses md (16) for form fields', () => {
    expect(semanticSpacing.fieldGap).toBe(spacing.md);
  });

  it('listItemPadding uses md (16)', () => {
    expect(semanticSpacing.listItemPadding).toBe(spacing.md);
  });

  it('navigation heights', () => {
    expect(semanticSpacing.navBarHeight).toBe(56);
    expect(semanticSpacing.tabBarHeight).toBe(56);
    expect(semanticSpacing.stickyBarHeight).toBe(72);
  });

  it('sheetHandleGap uses sm (12)', () => {
    expect(semanticSpacing.sheetHandleGap).toBe(spacing.sm);
  });
});

describe('Corner Radius', () => {
  it('has scale from xs to full circle', () => {
    expect(radius.xs).toBe(6);
    expect(radius.sm).toBe(8);
    expect(radius.md).toBe(12);
    expect(radius.lg).toBe(16);
    expect(radius.xl).toBe(20);
    expect(radius.xxl).toBe(24);
    expect(radius.pill).toBe(999);
    expect(radius.full).toBe(9999);
  });

  it('semantic aliases match design spec', () => {
    expect(semanticRadius.input).toBe(radius.md);        // 12
    expect(semanticRadius.button).toBe(radius.md);       // 12-14 per spec
    expect(semanticRadius.buttonPill).toBe(radius.pill); // 999
    expect(semanticRadius.card).toBe(radius.lg);         // 16
    expect(semanticRadius.cardLarge).toBe(radius.xl);    // 20
    expect(semanticRadius.sheet).toBe(radius.xxl);       // 24
    expect(semanticRadius.modal).toBe(radius.xxl);       // 24
    expect(semanticRadius.chip).toBe(radius.pill);       // 999
    expect(semanticRadius.badge).toBe(radius.pill);      // 999
    expect(semanticRadius.avatar).toBe(radius.full);     // 9999
    expect(semanticRadius.imageFrame).toBe(radius.xl);   // 20
    expect(semanticRadius.smallControl).toBe(radius.sm); // 8
  });
});

describe('Border Widths', () => {
  it('has hairline, thin, thick, focus', () => {
    expect(borderWidth.hairline).toBe(0.5);
    expect(borderWidth.thin).toBe(1);
    expect(borderWidth.thick).toBe(2);
    expect(borderWidth.focus).toBe(2);
  });
});

describe('Hit Targets (Accessibility)', () => {
  it('minimum 44pt for iOS', () => {
    expect(hitTarget.minimum).toBe(44);
  });

  it('comfortable 48dp for Android', () => {
    expect(hitTarget.comfortable).toBe(48);
  });

  it('large 56 for prominent actions', () => {
    expect(hitTarget.large).toBe(56);
  });
});

describe('Elevation / Shadows', () => {
  it('level0 is flat with no shadow', () => {
    expect(elevation.level0.shadowColor).toBe('transparent');
    expect(elevation.level0.shadowOpacity).toBe(0);
    expect(elevation.level0.elevation).toBe(0);
  });

  it('level1 for cards - subtle warm shadow', () => {
    expect(elevation.level1.shadowColor).toBe('#1B1816'); // warm ink
    expect(elevation.level1.shadowOffset).toEqual({ width: 0, height: 1 });
    expect(elevation.level1.shadowOpacity).toBe(0.05);
    expect(elevation.level1.shadowRadius).toBe(3);
    expect(elevation.level1.elevation).toBe(2);
  });

  it('level2 for raised navigation', () => {
    expect(elevation.level2.shadowColor).toBe('#1B1816');
    expect(elevation.level2.shadowOffset).toEqual({ width: 0, height: 4 });
    expect(elevation.level2.shadowOpacity).toBe(0.08);
    expect(elevation.level2.shadowRadius).toBe(8);
    expect(elevation.level2.elevation).toBe(4);
  });

  it('level3 for dialogs/sheets', () => {
    expect(elevation.level3.shadowColor).toBe('#1B1816');
    expect(elevation.level3.shadowOffset).toEqual({ width: 0, height: 8 });
    expect(elevation.level3.shadowOpacity).toBe(0.12);
    expect(elevation.level3.shadowRadius).toBe(16);
    expect(elevation.level3.elevation).toBe(8);
  });

  it('level4 for toasts/dropdowns', () => {
    expect(elevation.level4.shadowColor).toBe('#1B1816');
    expect(elevation.level4.shadowOffset).toEqual({ width: 0, height: 12 });
    expect(elevation.level4.shadowOpacity).toBe(0.15);
    expect(elevation.level4.shadowRadius).toBe(24);
    expect(elevation.level4.elevation).toBe(12);
  });

  it('all shadows use warm ink not pure black', () => {
    Object.values(elevation).forEach((level) => {
      if (level.shadowColor !== 'transparent') {
        expect(level.shadowColor).toBe('#1B1816');
      }
    });
  });
});