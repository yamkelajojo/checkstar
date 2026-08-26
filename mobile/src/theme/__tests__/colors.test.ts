/**
 * Design System Color Token Tests
 * V-Model: Unit testing of primitive → semantic → component token hierarchy
 */

import {
  brand,
  neutral,
  light,
  dark,
  palettes,
  getPalette,
  componentTokens,
  type ColorPalette,
  type ThemeName,
} from '../colors';

describe('Primitive Tokens', () => {
  describe('brand', () => {
    it('has core brand orange', () => {
      expect(brand.orange).toBe('#EB6522');
    });

    it('has accessible strong orange for AA contrast on white', () => {
      expect(brand.orangeStrong).toBe('#CC4400');
    });

    it('has soft orange for tinted backgrounds', () => {
      expect(brand.orangeSoft).toBe('#FFE0CC');
    });

    it('has interaction states', () => {
      expect(brand.orangeBright).toBe('#F47A3A');
      expect(brand.orangeDeep).toBe('#A93D0A');
    });

    it('has star/yellow tokens with accessible dark variant', () => {
      expect(brand.star).toBe('#FBBF24');
      expect(brand.starDark).toBe('#925E00');
      expect(brand.starSoft).toBe('#FFF4CC');
    });

    it('has semantic status colors with accessible variants', () => {
      expect(brand.success).toBe('#2D6A4F');
      expect(brand.successSoft).toBe('#E5F1EB');
      expect(brand.successStrong).toBe('#1F513B');

      expect(brand.warning).toBe('#8A5A00');
      expect(brand.warningSoft).toBe('#FFF4D6');
      expect(brand.warningStrong).toBe('#744D00');

      expect(brand.error).toBe('#B42318');
      expect(brand.errorSoft).toBe('#FDE8E7');
      expect(brand.errorStrong).toBe('#8E1B12');
    });

    it('maintains legacy aliases for migration', () => {
      expect(brand.primary).toBe(brand.orange);
      expect(brand.primaryDark).toBe(brand.orangeStrong);
      expect(brand.primaryLight).toBe(brand.orangeSoft);
      expect(brand.accent).toBe('#CC0000');
    });
  });

  describe('neutral', () => {
    it('light theme warm neutrals adjusted for contrast', () => {
      expect(neutral.warm50).toBe('#FFFCF9');
      expect(neutral.warm100).toBe('#FAF7F4');
      expect(neutral.warm200).toBe('#F0ECE5');
      expect(neutral.warm300).toBe('#E6DFD6');
      expect(neutral.warm400).toBe('#DCCFC4');
      expect(neutral.warm500).toBe('#CEC0B3');
      expect(neutral.warm600).toBe('#C9BFB7');
      expect(neutral.warm700).toBe('#968D84');
      expect(neutral.warm800).toBe('#7B716A');
      expect(neutral.warm900).toBe('#6B625C');
      expect(neutral.warm950).toBe('#1B1816');
    });

    it('dark theme warm neutrals adjusted for contrast', () => {
      expect(neutral.dark950).toBe('#0F0D0C');
      expect(neutral.dark900).toBe('#14110F');
      expect(neutral.dark800).toBe('#1E1B18');
      expect(neutral.dark700).toBe('#2A2622');
      expect(neutral.dark600).toBe('#0E0C0A');
      expect(neutral.dark500).toBe('#35302A');
      expect(neutral.dark400).toBe('#423C35');
      expect(neutral.dark300).toBe('#5A524A');
      expect(neutral.dark200).toBe('#8A8178');
      expect(neutral.dark100).toBe('#B0A8A0');
      expect(neutral.dark50).toBe('#D4CCC4');
      expect(neutral.dark0).toBe('#FFF9F5');
    });

    it('text hierarchy goes from warm ink to warm white', () => {
      expect(neutral.warm950).toBe('#1B1816');
      expect(neutral.warm900).toBe('#6B625C');
      expect(neutral.warm800).toBe('#7B716A');
      expect(neutral.warm700).toBe('#968D84');

      expect(neutral.dark0).toBe('#FFF9F5');
      expect(neutral.dark50).toBe('#D4CCC4');
      expect(neutral.dark100).toBe('#B0A8A0');
      expect(neutral.dark200).toBe('#8A8178');
    });

    it('has pure white/black for specific uses only', () => {
      expect(neutral.white).toBe('#FFFFFF');
      expect(neutral.black).toBe('#000000');
    });
  });
});

describe('Semantic Tokens — Light Theme', () => {
  it('background uses warm whites', () => {
    expect(light.background.primary).toBe(neutral.warm50);
    expect(light.background.secondary).toBe(neutral.warm100);
  });

  it('surface hierarchy: primary < elevated > sunken', () => {
    expect(light.surface.primary).toBe(neutral.warm200);
    expect(light.surface.elevated).toBe(neutral.white);
    expect(light.surface.sunken).toBe(neutral.warm300);
  });

  it('border hierarchy: subtle < default < strong', () => {
    expect(light.border.subtle).toBe(neutral.warm300);
    expect(light.border.default).toBe(neutral.warm400);
    expect(light.border.strong).toBe(neutral.warm500);
  });

  it('text hierarchy: primary > secondary > tertiary > disabled', () => {
    expect(light.text.primary).toBe(neutral.warm950);
    expect(light.text.secondary).toBe(neutral.warm900);
    expect(light.text.tertiary).toBe(neutral.warm800);
    expect(light.text.disabled).toBe(neutral.warm700);
    expect(light.text.inverse).toBe(neutral.dark0);
    expect(light.text.brand).toBe('#B8420D');
  });

  it('action.primary uses accessible orangeStrong', () => {
    expect(light.action.primary.background).toBe(brand.orangeStrong);
    expect(light.action.primary.foreground).toBe(neutral.white);
    expect(light.action.primary.pressed).toBe(brand.orangeDeep);
    expect(light.action.primary.disabledBackground).toBe(neutral.warm500);
    expect(light.action.primary.disabledForeground).toBe(neutral.warm700);
  });

  it('action.secondary uses orangeSoft background with orangeDeep text', () => {
    expect(light.action.secondary.background).toBe(brand.orangeSoft);
    expect(light.action.secondary.foreground).toBe(brand.orangeDeep);
    expect(light.action.secondary.border).toBe('#E8D5C8');
    expect(light.action.secondary.pressedBackground).toBe('#F0DCC8');
  });

  it('action.destructive uses semantic error color', () => {
    expect(light.action.destructive.background).toBe(brand.error);
    expect(light.action.destructive.foreground).toBe(neutral.white);
    expect(light.action.destructive.pressedBackground).toBe(brand.errorStrong);
  });

  it('status colors have primary/soft/strong variants', () => {
    expect(light.status.success.primary).toBe(brand.success);
    expect(light.status.success.soft).toBe(brand.successSoft);
    expect(light.status.success.strong).toBe(brand.successStrong);

    expect(light.status.warning.primary).toBe(brand.warning);
    expect(light.status.warning.soft).toBe(brand.warningSoft);
    expect(light.status.warning.strong).toBe(brand.warningStrong);

    expect(light.status.error.primary).toBe(brand.error);
    expect(light.status.error.soft).toBe(brand.errorSoft);
    expect(light.status.error.strong).toBe(brand.errorStrong);

    expect(light.status.star.primary).toBe(brand.star);
    expect(light.status.star.dark).toBe(brand.starDark);
    expect(light.status.star.soft).toBe(brand.starSoft);
  });

  it('overlay uses warm ink', () => {
    expect(light.overlay).toBe('rgba(27, 24, 22, 0.4)');
  });

  it('hairline aliases border.subtle', () => {
    expect(light.hairline).toBe(light.border.subtle);
  });

  it('legacy flat tokens match semantic values', () => {
    expect(light.legacy.bg).toBe(light.background.primary);
    expect(light.legacy.bgAlt).toBe(light.background.secondary);
    expect(light.legacy.surface).toBe(light.surface.primary);
    expect(light.legacy.surfaceElevated).toBe(light.surface.elevated);
    expect(light.legacy.border).toBe(light.border.subtle);
    expect(light.legacy.text).toBe(light.text.primary);
    expect(light.legacy.textMuted).toBe(light.text.secondary);
    expect(light.legacy.textFaint).toBe(light.text.tertiary);
    expect(light.legacy.onPrimary).toBe(light.text.inverse);
  });
});

describe('Semantic Tokens — Dark Theme', () => {
  it('background uses warm charcoal', () => {
    expect(dark.background.primary).toBe(neutral.dark950);
    expect(dark.background.secondary).toBe(neutral.dark900);
  });

  it('surface hierarchy', () => {
    expect(dark.surface.primary).toBe(neutral.dark800);
    expect(dark.surface.elevated).toBe(neutral.dark700);
    expect(dark.surface.sunken).toBe(neutral.dark600);
  });

  it('border hierarchy', () => {
    expect(dark.border.subtle).toBe(neutral.dark500);
    expect(dark.border.default).toBe(neutral.dark400);
    expect(dark.border.strong).toBe(neutral.dark300);
  });

  it('text hierarchy uses warm white scale', () => {
    expect(dark.text.primary).toBe(neutral.dark0);
    expect(dark.text.secondary).toBe(neutral.dark50);
    expect(dark.text.tertiary).toBe(neutral.dark100);
    expect(dark.text.disabled).toBe(neutral.dark200);
    expect(dark.text.inverse).toBe(neutral.warm950);
    expect(dark.text.brand).toBe('#FF9A68');
  });

  it('action.primary uses brand orange for dark mode', () => {
    expect(dark.action.primary.background).toBe(brand.orange);
    expect(dark.action.primary.foreground).toBe(neutral.white);
    expect(dark.action.primary.pressed).toBe(brand.orangeBright);
    expect(dark.action.primary.disabledBackground).toBe(neutral.dark300);
    expect(dark.action.primary.disabledForeground).toBe(neutral.dark200);
  });

  it('action.secondary uses dark-appropriate values', () => {
    expect(dark.action.secondary.background).toBe('#2E2924');
    expect(dark.action.secondary.foreground).toBe('#FF9A68');
    expect(dark.action.secondary.border).toBe('#524A42');
    expect(dark.action.secondary.pressedBackground).toBe('#3A332B');
  });

  it('action.destructive uses accessible error color', () => {
    expect(dark.action.destructive.background).toBe(brand.error);
    expect(dark.action.destructive.foreground).toBe(neutral.white);
    expect(dark.action.destructive.pressedBackground).toBe(brand.errorStrong);
  });

  it('status colors are brighter for dark mode', () => {
    expect(dark.status.success.primary).toBe('#6EC88A');
    expect(dark.status.warning.primary).toBe('#FFD85D');
    expect(dark.status.error.primary).toBe('#F98070');
  });

  it('overlay uses warm charcoal', () => {
    expect(dark.overlay).toBe('rgba(15, 13, 12, 0.6)');
  });

  it('hairline aliases border.subtle', () => {
    expect(dark.hairline).toBe(dark.border.subtle);
  });

  it('legacy flat tokens match semantic values', () => {
    expect(dark.legacy.bg).toBe(dark.background.primary);
    expect(dark.legacy.bgAlt).toBe(dark.background.secondary);
    expect(dark.legacy.surface).toBe(dark.surface.primary);
    expect(dark.legacy.surfaceElevated).toBe(dark.surface.elevated);
    expect(dark.legacy.border).toBe(dark.border.subtle);
    expect(dark.legacy.text).toBe(dark.text.primary);
    expect(dark.legacy.textMuted).toBe(dark.text.secondary);
    expect(dark.legacy.textFaint).toBe(dark.text.tertiary);
    expect(dark.legacy.onPrimary).toBe(dark.text.inverse);
  });
});

describe('Palette Registry', () => {
  it('registers both themes', () => {
    expect(palettes.light).toBe(light);
    expect(palettes.dark).toBe(dark);
  });

  it('getPalette returns correct theme', () => {
    expect(getPalette('light')).toBe(light);
    expect(getPalette('dark')).toBe(dark);
  });

  it('TypeScript types enforce ThemeName', () => {
    const themes: ThemeName[] = ['light', 'dark'];
    expect(themes).toHaveLength(2);
  });
});

describe('ColorPalette Interface', () => {
  it('has all required semantic categories', () => {
    const palette: ColorPalette = light;
    expect(palette.background).toHaveProperty('primary');
    expect(palette.background).toHaveProperty('secondary');
    expect(palette.surface).toHaveProperty('primary');
    expect(palette.surface).toHaveProperty('elevated');
    expect(palette.surface).toHaveProperty('sunken');
    expect(palette.border).toHaveProperty('subtle');
    expect(palette.border).toHaveProperty('default');
    expect(palette.border).toHaveProperty('strong');
    expect(palette.text).toHaveProperty('primary');
    expect(palette.text).toHaveProperty('secondary');
    expect(palette.text).toHaveProperty('tertiary');
    expect(palette.text).toHaveProperty('disabled');
    expect(palette.text).toHaveProperty('inverse');
    expect(palette.text).toHaveProperty('brand');
    expect(palette.action).toHaveProperty('primary');
    expect(palette.action).toHaveProperty('secondary');
    expect(palette.action).toHaveProperty('destructive');
    expect(palette.status).toHaveProperty('success');
    expect(palette.status).toHaveProperty('warning');
    expect(palette.status).toHaveProperty('error');
    expect(palette.status).toHaveProperty('star');
    expect(palette).toHaveProperty('overlay');
    expect(palette).toHaveProperty('hairline');
    expect(palette).toHaveProperty('legacy');
  });

  it('action.primary has all states', () => {
    const action = light.action.primary;
    expect(action).toHaveProperty('background');
    expect(action).toHaveProperty('foreground');
    expect(action).toHaveProperty('pressed');
    expect(action).toHaveProperty('disabledBackground');
    expect(action).toHaveProperty('disabledForeground');
  });
});

describe('Component Tokens', () => {
  it('button tokens reference semantic action tokens', () => {
    const btn = componentTokens.button;
    expect(btn.primary.background).toBe('{action.primary.background}');
    expect(btn.primary.foreground).toBe('{action.primary.foreground}');
    expect(btn.primary.pressed).toBe('{action.primary.pressed}');
    expect(btn.secondary.background).toBe('{action.secondary.background}');
    expect(btn.destructive.background).toBe('{action.destructive.background}');
  });

  it('input tokens reference semantic surface/border/text tokens', () => {
    const input = componentTokens.input;
    expect(input.background).toBe('{surface.sunken}');
    expect(input.border).toBe('{border.default}');
    expect(input.focusBorder).toBe('{brand.orangeFocus}');
    expect(input.errorBorder).toBe('{status.error.primary}');
    expect(input.successBorder).toBe('{status.success.primary}');
    expect(input.text).toBe('{text.primary}');
    expect(input.placeholder).toBe('{text.tertiary}');
    expect(input.disabledBackground).toBe('{surface.primary}');
    expect(input.disabledBorder).toBe('{border.subtle}');
    expect(input.disabledText).toBe('{text.disabled}');
  });

  it('card tokens reference semantic surface/border', () => {
    const card = componentTokens.card;
    expect(card.background).toBe('{surface.primary}');
    expect(card.border).toBe('{border.subtle}');
    expect(card.elevatedBackground).toBe('{surface.elevated}');
    expect(card.elevatedBorder).toBe('{border.default}');
    expect(card.radius).toBe(16);
    expect(card.padding).toBe(16);
  });

  it('navigation tokens reference brand and text tokens', () => {
    const nav = componentTokens.navigation;
    expect(nav.active).toBe('{brand.orange}');
    expect(nav.inactive).toBe('{text.tertiary}');
    expect(nav.background).toBe('{surface.elevated}');
    expect(nav.border).toBe('{hairline}');
    expect(nav.badgeBackground).toBe('{brand.orange}');
    expect(nav.badgeForeground).toBe('{text.inverse}');
  });

  it('progress tokens reference hairline and brand', () => {
    const prog = componentTokens.progress;
    expect(prog.track).toBe('{hairline}');
    expect(prog.fill).toBe('{brand.orange}');
  });

  it('skeleton tokens reference surface and hairline', () => {
    const skel = componentTokens.skeleton;
    expect(skel.base).toBe('{surface.primary}');
    expect(skel.highlight).toBe('{hairline}');
  });

  it('divider tokens reference border', () => {
    const div = componentTokens.divider;
    expect(div.color).toBe('{border.default}');
    expect(div.strong).toBe('{border.strong}');
  });
});