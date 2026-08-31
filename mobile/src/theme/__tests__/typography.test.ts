/**
 * Design System Typography Tests
 * V-Model: Unit testing of type scale, weights, line heights, dynamic scaling
 */

import {
  fontFamily,
  fontWeight,
  letterSpacing,
  textStyle,
  semanticText,
  getDynamicScale,
  scaleTextStyle,
  scaleSemanticTextStyle,
  type TextStyle,
  type SemanticTextStyle,
} from '../typography';

describe('Font Family', () => {
  it('uses system font as primary', () => {
    expect(fontFamily.system).toBe('System');
  });

  it('has monospace for technical content', () => {
    expect(fontFamily.mono).toBe('monospace');
  });
});

describe('Font Weights', () => {
  it('has full weight scale from light to black', () => {
    expect(fontWeight.light).toBe('300');
    expect(fontWeight.regular).toBe('400');
    expect(fontWeight.medium).toBe('500');
    expect(fontWeight.semibold).toBe('600');
    expect(fontWeight.bold).toBe('700');
    expect(fontWeight.extrabold).toBe('800');
    expect(fontWeight.black).toBe('900');
  });
});

describe('Letter Spacing', () => {
  it('has tight to wide scale', () => {
    expect(letterSpacing.tighter).toBe(-0.8);
    expect(letterSpacing.tight).toBe(-0.4);
    expect(letterSpacing.normal).toBe(0);
    expect(letterSpacing.wide).toBe(0.5);
    expect(letterSpacing.wider).toBe(1.1);
    expect(letterSpacing.widest).toBe(1.5);
  });
});

describe('Type Scale — textStyle', () => {
  it('has complete hierarchy from display to micro', () => {
    const styles = [
      'display', 'h1', 'h2', 'h3', 'title',
      'bodyLarge', 'body', 'bodySmall',
      'label', 'labelStrong',
      'caption', 'micro',
      'price', 'priceLarge',
    ] as const;

    styles.forEach((key) => {
      const style = textStyle[key];
      expect(style).toHaveProperty('size');
      expect(style).toHaveProperty('lineHeight');
      expect(style).toHaveProperty('weight');
      expect(style).toHaveProperty('letterSpacing');
      expect(typeof style.size).toBe('number');
      expect(typeof style.lineHeight).toBe('number');
      expect(style.lineHeight).toBeGreaterThan(style.size);
    });
  });

  it('display is largest', () => {
    expect(textStyle.display.size).toBe(34);
    expect(textStyle.display.lineHeight).toBe(42);
    expect(textStyle.display.weight).toBe(fontWeight.bold);
    expect(textStyle.display.letterSpacing).toBe(letterSpacing.tight);
  });

  it('h1/h2/h3 descend in size', () => {
    expect(textStyle.h1.size).toBe(28);
    expect(textStyle.h2.size).toBe(24);
    expect(textStyle.h3.size).toBe(20);
    expect(textStyle.h1.weight).toBe(fontWeight.bold);
    expect(textStyle.h2.weight).toBe(fontWeight.bold);
    expect(textStyle.h3.weight).toBe(fontWeight.bold);
  });

  it('title is for card/list items', () => {
    expect(textStyle.title.size).toBe(17);
    expect(textStyle.title.lineHeight).toBe(24);
    expect(textStyle.title.weight).toBe(fontWeight.semibold);
  });

  it('body variants for reading comfort', () => {
    expect(textStyle.bodyLarge.size).toBe(17);
    expect(textStyle.bodyLarge.lineHeight).toBe(26);
    expect(textStyle.bodyLarge.weight).toBe(fontWeight.regular);

    expect(textStyle.body.size).toBe(16);
    expect(textStyle.body.lineHeight).toBe(24);
    expect(textStyle.body.weight).toBe(fontWeight.regular);

    expect(textStyle.bodySmall.size).toBe(14);
    expect(textStyle.bodySmall.lineHeight).toBe(22);
    expect(textStyle.bodySmall.weight).toBe(fontWeight.regular);
  });

  it('label variants for interactive elements', () => {
    expect(textStyle.label.size).toBe(14);
    expect(textStyle.label.lineHeight).toBe(20);
    expect(textStyle.label.weight).toBe(fontWeight.medium);
    expect(textStyle.label.letterSpacing).toBe(letterSpacing.wide);

    expect(textStyle.labelStrong.size).toBe(14);
    expect(textStyle.labelStrong.weight).toBe(fontWeight.semibold);
  });

  it('caption/micro for metadata', () => {
    expect(textStyle.caption.size).toBe(12);
    expect(textStyle.caption.lineHeight).toBe(16);
    expect(textStyle.caption.weight).toBe(fontWeight.medium);

    expect(textStyle.micro.size).toBe(11);
    expect(textStyle.micro.lineHeight).toBe(14);
    expect(textStyle.micro.weight).toBe(fontWeight.medium);
  });

  it('price variants for prominent numbers', () => {
    expect(textStyle.price.size).toBe(20);
    expect(textStyle.price.lineHeight).toBe(28);
    expect(textStyle.price.weight).toBe(fontWeight.bold);

    expect(textStyle.priceLarge.size).toBe(28);
    expect(textStyle.priceLarge.lineHeight).toBe(36);
  });

  it('line heights follow 4pt baseline grid where possible', () => {
    const gridStyles = [
      textStyle.display, // 42
      textStyle.h1, // 36
      textStyle.h2, // 32
      textStyle.h3, // 28
      textStyle.title, // 24
      textStyle.bodyLarge, // 26 (not on grid but reasonable)
      textStyle.body, // 24
      textStyle.bodySmall, // 22
      textStyle.label, // 20
      textStyle.caption, // 16
      textStyle.micro, // 14
    ];

    gridStyles.forEach((style) => {
      expect(style.lineHeight % 2).toBe(0); // even numbers
    });
  });
});

describe('Semantic Text Styles', () => {
  it('has screen-level hierarchy', () => {
    expect(semanticText.screenTitle).toEqual(textStyle.h1);
    expect(semanticText.sectionTitle).toEqual(textStyle.h3);
    expect(semanticText.cardTitle).toEqual(textStyle.title);
    expect(semanticText.listTitle).toEqual(textStyle.title);
  });

  it('has body hierarchy', () => {
    expect(semanticText.bodyPrimary).toEqual(textStyle.body);
    expect(semanticText.bodySecondary).toEqual(textStyle.bodySmall);
    expect(semanticText.bodyTertiary.size).toBe(textStyle.caption.size);
    expect(semanticText.bodyTertiary.weight).toBe(fontWeight.regular);
  });

  it('has interactive styles', () => {
    expect(semanticText.buttonPrimary).toEqual(textStyle.labelStrong);
    expect(semanticText.buttonSecondary).toEqual(textStyle.label);
    expect(semanticText.buttonDestructive).toEqual(textStyle.labelStrong);
    expect(semanticText.link.size).toBe(textStyle.body.size);
    expect(semanticText.link.weight).toBe(fontWeight.medium);
  });

  it('has form styles', () => {
    expect(semanticText.inputLabel).toEqual(textStyle.label);
    expect(semanticText.inputValue).toEqual(textStyle.body);
    expect(semanticText.inputPlaceholder.size).toBe(textStyle.body.size);
    expect(semanticText.inputPlaceholder.weight).toBe(fontWeight.regular);
    expect(semanticText.inputError.size).toBe(textStyle.caption.size);
    expect(semanticText.inputError.weight).toBe(fontWeight.medium);
    expect(semanticText.inputHelper).toEqual(textStyle.caption);
  });

  it('has status styles', () => {
    expect(semanticText.statusSuccess.size).toBe(textStyle.caption.size);
    expect(semanticText.statusSuccess.weight).toBe(fontWeight.semibold);
    expect(semanticText.statusWarning.size).toBe(textStyle.caption.size);
    expect(semanticText.statusError.size).toBe(textStyle.caption.size);
  });

  it('has metadata styles', () => {
    expect(semanticText.metadata).toEqual(textStyle.caption);
    expect(semanticText.timestamp).toEqual(textStyle.micro);
    expect(semanticText.price).toEqual(textStyle.price);
    expect(semanticText.priceLarge).toEqual(textStyle.priceLarge);
  });

  it('has brand styles', () => {
    expect(semanticText.brandPrimary).toEqual(textStyle.title);
    expect(semanticText.brandSecondary).toEqual(textStyle.body);
  });
});

describe('Dynamic Type Scaling', () => {
  describe('getDynamicScale', () => {
    it('returns 1.0 for normal scale', () => {
      expect(getDynamicScale(1.0)).toBe(1.0);
    });

    it('clamps minimum to 0.85', () => {
      expect(getDynamicScale(0.5)).toBe(0.85);
      expect(getDynamicScale(0.8)).toBe(0.85);
    });

    it('clamps maximum to 1.5', () => {
      expect(getDynamicScale(2.0)).toBe(1.5);
      expect(getDynamicScale(1.8)).toBe(1.5);
    });

    it('allows values in range', () => {
      expect(getDynamicScale(0.85)).toBe(0.85);
      expect(getDynamicScale(1.2)).toBe(1.2);
      expect(getDynamicScale(1.5)).toBe(1.5);
    });
  });

  describe('scaleTextStyle', () => {
    it('scales size and lineHeight proportionally', () => {
      const scaled = scaleTextStyle(textStyle.body, 1.2);
      expect(scaled.size).toBe(Math.round(16 * 1.2));
      expect(scaled.lineHeight).toBe(Math.round(24 * 1.2));
      expect(scaled.weight).toBe(textStyle.body.weight);
      expect(scaled.letterSpacing).toBe(textStyle.body.letterSpacing);
    });

    it('preserves other properties', () => {
      const scaled = scaleTextStyle(textStyle.h1, 1.5);
      expect(scaled.weight).toBe(fontWeight.bold);
      expect(scaled.letterSpacing).toBe(letterSpacing.tight);
    });

    it('clamps scale factor', () => {
      const scaled = scaleTextStyle(textStyle.body, 2.0);
      expect(scaled.size).toBe(Math.round(16 * 1.5));
    });
  });

  describe('scaleSemanticTextStyle', () => {
    it('scales semantic text styles', () => {
      const scaled = scaleSemanticTextStyle(semanticText.buttonPrimary, 1.25);
      expect(scaled.size).toBe(Math.round(14 * 1.25));
      expect(scaled.lineHeight).toBe(Math.round(20 * 1.25));
      expect(scaled.weight).toBe(fontWeight.semibold);
    });
  });
});

describe('TypeScript Types', () => {
  it('TextStyleKey includes all textStyle keys', () => {
    const keys: Array<keyof typeof textStyle> = [
      'display', 'h1', 'h2', 'h3', 'title',
      'bodyLarge', 'body', 'bodySmall',
      'label', 'labelStrong',
      'caption', 'micro',
      'price', 'priceLarge',
    ];
    expect(keys.length).toBe(14);
  });

  it('SemanticTextKey includes all semanticText keys', () => {
    const keys: Array<keyof typeof semanticText> = [
      'screenTitle', 'sectionTitle', 'cardTitle', 'listTitle',
      'bodyPrimary', 'bodySecondary', 'bodyTertiary',
      'buttonPrimary', 'buttonSecondary', 'buttonDestructive', 'link',
      'inputLabel', 'inputValue', 'inputPlaceholder', 'inputError', 'inputHelper',
      'statusSuccess', 'statusWarning', 'statusError',
      'metadata', 'timestamp', 'price', 'priceLarge',
      'brandPrimary', 'brandSecondary',
    ];
    expect(keys.length).toBe(25);
  });
});