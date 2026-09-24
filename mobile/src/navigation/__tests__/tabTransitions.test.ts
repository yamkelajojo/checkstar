import { TAB_ORDER, getTabIndex, getTabDirection } from '../tabTransitions';

describe('TAB_ORDER', () => {
  it('defines 5 tabs in expected order', () => {
    expect(TAB_ORDER).toEqual(['Home', 'Browse', 'Favorites', 'Cart', 'Account']);
  });
});

describe('getTabIndex', () => {
  it('returns correct index for each tab', () => {
    expect(getTabIndex('Home')).toBe(0);
    expect(getTabIndex('Browse')).toBe(1);
    expect(getTabIndex('Favorites')).toBe(2);
    expect(getTabIndex('Cart')).toBe(3);
    expect(getTabIndex('Account')).toBe(4);
  });

  it('returns -1 for unknown tab', () => {
    expect(getTabIndex('Unknown' as any)).toBe(-1);
  });
});

describe('getTabDirection', () => {
  it('returns 1 when moving right (next > prev)', () => {
    expect(getTabDirection(0, 1)).toBe(1);
    expect(getTabDirection(1, 3)).toBe(1);
    expect(getTabDirection(0, 4)).toBe(1);
  });

  it('returns -1 when moving left (next < prev)', () => {
    expect(getTabDirection(1, 0)).toBe(-1);
    expect(getTabDirection(3, 1)).toBe(-1);
    expect(getTabDirection(4, 0)).toBe(-1);
  });

  it('returns 0 when same index', () => {
    expect(getTabDirection(2, 2)).toBe(0);
  });

  it('handles edge: prev -1 (initial) defaults to 0 direction', () => {
    expect(getTabDirection(-1, 0)).toBe(0);
    expect(getTabDirection(-1, 2)).toBe(0);
  });
});

describe('motion removal (regression)', () => {
  it('tabTransitions no longer exports motion-blur helpers', () => {
    // The motion-blur layer was removed with the scroll-motion simplification.
    // These must stay gone — they were a crash + preference regression.
    const mod = require('../tabTransitions');
    expect(mod.getMotionBlurIntensity).toBeUndefined();
    expect(mod.getMotionBlurStyle).toBeUndefined();
    expect(mod.getTabTransitionConfig).toBeUndefined();
    expect(mod.getStaggerDelayForContent).toBeUndefined();
  });
});
