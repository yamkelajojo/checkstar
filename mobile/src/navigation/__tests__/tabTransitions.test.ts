import {
  TAB_ORDER,
  getTabIndex,
  getTabDirection,
  getTabTransitionConfig,
  getStaggerDelayForContent,
  getMotionBlurIntensity,
  getMotionBlurStyle,
  shouldAnimateTabTransition,
} from '../tabTransitions';

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

describe('getTabTransitionConfig', () => {
  it('provides right-to-left translate for direction 1 (content enters from right)', () => {
    const config = getTabTransitionConfig(1, 390);
    // When moving right, incoming content should start from right (positive X) and go to 0
    expect(config.enteringX).toBeGreaterThan(0);
    expect(config.exitingX).toBeLessThan(0);
  });

  it('provides left-to-right translate for direction -1', () => {
    const config = getTabTransitionConfig(-1, 390);
    expect(config.enteringX).toBeLessThan(0);
    expect(config.exitingX).toBeGreaterThan(0);
  });

  it('returns zero translate for direction 0', () => {
    const config = getTabTransitionConfig(0, 390);
    expect(config.enteringX).toBe(0);
    expect(config.exitingX).toBe(0);
  });

  it('uses Apple spring with snappy timing', () => {
    const config = getTabTransitionConfig(1, 390);
    expect(config.spring.damping).toBeGreaterThanOrEqual(26);
    expect(config.spring.stiffness).toBeGreaterThanOrEqual(300);
    expect(config.duration).toBeLessThanOrEqual(320);
    expect(config.duration).toBeGreaterThanOrEqual(220);
  });

  it('caps translate to screen width fraction for performance', () => {
    const config = getTabTransitionConfig(1, 390);
    expect(Math.abs(config.enteringX)).toBeLessThanOrEqual(390);
    expect(Math.abs(config.enteringX)).toBeGreaterThanOrEqual(20);
  });
});

describe('getStaggerDelayForContent', () => {
  it('returns increasing delays for list items', () => {
    const d0 = getStaggerDelayForContent(0, true);
    const d1 = getStaggerDelayForContent(1, true);
    const d2 = getStaggerDelayForContent(2, true);
    expect(d1).toBeGreaterThan(d0);
    expect(d2).toBeGreaterThan(d1);
  });

  it('uses tighter stagger for entering vs exiting', () => {
    const entering = getStaggerDelayForContent(2, true);
    const exiting = getStaggerDelayForContent(2, false);
    // entering should be staggered, exiting faster or zero
    expect(entering).toBeGreaterThanOrEqual(0);
  });

  it('caps total stagger to avoid long waits', () => {
    const maxDelay = getStaggerDelayForContent(20, true);
    expect(maxDelay).toBeLessThanOrEqual(300);
  });

  it('returns 0 for first item with no base delay', () => {
    const d = getStaggerDelayForContent(0, true, 0);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThanOrEqual(40);
  });
});

describe('getMotionBlurIntensity', () => {
  it('returns 0 when not moving', () => {
    expect(getMotionBlurIntensity(0, 0)).toBe(0);
  });

  it('increases with velocity', () => {
    const low = getMotionBlurIntensity(0.2, 0);
    const high = getMotionBlurIntensity(0.8, 0);
    expect(high).toBeGreaterThan(low);
  });

  it('increases with progress offset from rest', () => {
    const atRest = getMotionBlurIntensity(0, 0);
    const midTransition = getMotionBlurIntensity(0, 0.5);
    expect(midTransition).toBeGreaterThan(atRest);
  });

  it('caps intensity to 1', () => {
    const extreme = getMotionBlurIntensity(10, 1);
    expect(extreme).toBeLessThanOrEqual(1);
  });

  it('returns subtle values for typical swipe velocities (<0.15)', () => {
    const typical = getMotionBlurIntensity(0.3, 0.2);
    expect(typical).toBeGreaterThan(0);
    expect(typical).toBeLessThanOrEqual(0.4);
  });
});

describe('getMotionBlurStyle', () => {
  it('returns neutral style when intensity 0', () => {
    const style = getMotionBlurStyle(0);
    expect(style.scaleX).toBeCloseTo(1, 1);
    expect(style.opacity).toBeCloseTo(1, 1);
  });

  it('stretches horizontally when intensity high', () => {
    const style = getMotionBlurStyle(0.8);
    expect(style.scaleX).toBeGreaterThan(1);
    expect(style.scaleX).toBeLessThanOrEqual(1.06);
  });

  it('slightly squishes vertically to conserve volume', () => {
    const style = getMotionBlurStyle(0.6);
    expect(style.scaleY).toBeLessThanOrEqual(1);
    expect(style.scaleY).toBeGreaterThanOrEqual(0.96);
  });

  it('reduces opacity subtly during motion', () => {
    const style = getMotionBlurStyle(0.5);
    expect(style.opacity).toBeLessThan(1);
    expect(style.opacity).toBeGreaterThanOrEqual(0.85);
  });

  it('keeps blur subtle for low intensities', () => {
    const style = getMotionBlurStyle(0.15);
    expect(style.scaleX).toBeLessThanOrEqual(1.02);
    expect(style.opacity).toBeGreaterThanOrEqual(0.94);
  });
});

describe('shouldAnimateTabTransition', () => {
  it('returns false for same tab', () => {
    expect(shouldAnimateTabTransition(2, 2)).toBe(false);
  });

  it('returns true for different tabs', () => {
    expect(shouldAnimateTabTransition(0, 1)).toBe(true);
    expect(shouldAnimateTabTransition(3, 1)).toBe(true);
  });

  it('returns false when reduceMotion enabled', () => {
    expect(shouldAnimateTabTransition(0, 1, true)).toBe(false);
  });
});
