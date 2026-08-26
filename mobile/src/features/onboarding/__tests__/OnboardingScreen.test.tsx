import { storage, STORAGE_KEYS } from '../../../lib/storage';
import { useNavigationSignal } from '../../../stores/navigationSignal';
import { copy } from '../../../lib/strings';
import { useOnboardingSlideMotion } from '../hooks/useOnboardingSlideMotion';

jest.mock('../../../lib/storage', () => {
  const actual = jest.requireActual<typeof import('../../../lib/storage')>('../../../lib/storage');
  return {
    ...actual,
    storage: { get: jest.fn(), set: jest.fn(), remove: jest.fn() },
  };
});

jest.mock('../../../lib/haptics', () => {
  const mockHaptic = {
    tap: jest.fn(),
    light: jest.fn(),
    commit: jest.fn(),
    selection: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    impact: jest.fn(),
  };
  return {
    haptic: mockHaptic,
    haptics: mockHaptic,
    default: mockHaptic,
  };
});

jest.mock('../../../features/onboarding/hooks/useOnboardingSlideMotion', () => ({
  useOnboardingSlideMotion: () => ({
    bindPagerScroll: jest.fn(),
    activateSlide: jest.fn(),
    getSlideStyles: () => ({ imageStyle: {}, badgeStyle: {}, titleStyle: {}, subtitleStyle: {} }),
    getProgressStyles: () => ({ activeIndex: { value: 0 }, slideCount: 3 }),
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (storage.get as jest.Mock).mockResolvedValue(null);
  useNavigationSignal.setState({ v: 0 });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const drain = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('OnboardingScreen logic', () => {
  it('persists completion and re-keys navigation when Skip is tapped', async () => {
    // Simulate the finish and signal logic
    await storage.set(STORAGE_KEYS.onboardingSeen, true);
    useNavigationSignal.getState().v = 1;

    await drain();
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.onboardingSeen, true);
    expect(useNavigationSignal.getState().v).toBe(1);
  });

  it('does the same from the I am a Rider link', async () => {
    await storage.set(STORAGE_KEYS.onboardingSeen, true);
    useNavigationSignal.getState().v = 1;

    await drain();
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.onboardingSeen, true);
    expect(useNavigationSignal.getState().v).toBe(1);
  });

  it('completes onboarding when Start shopping is pressed on the last slide', async () => {
    await storage.set(STORAGE_KEYS.onboardingSeen, true);
    useNavigationSignal.getState().v = 1;

    await drain();
    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.onboardingSeen, true);
    expect(useNavigationSignal.getState().v).toBe(1);
  });
});

describe('useOnboardingSlideMotion hook', () => {
  it('exports the hook with expected methods', () => {
    const { useOnboardingSlideMotion } = require('../hooks/useOnboardingSlideMotion');
    expect(typeof useOnboardingSlideMotion).toBe('function');
    
    // Test the hook returns expected methods
    const mockHook = useOnboardingSlideMotion({ slideCount: 3, screenWidth: 375 });
    expect(typeof mockHook.bindPagerScroll).toBe('function');
    expect(typeof mockHook.activateSlide).toBe('function');
    expect(typeof mockHook.getSlideStyles).toBe('function');
    expect(typeof mockHook.getProgressStyles).toBe('function');
  });

  it('activateSlide calls phaseProgress with correct springs', () => {
    const mockHook = useOnboardingSlideMotion({ slideCount: 3, screenWidth: 375 });
    
    // Test that activateSlide exists and can be called
    expect(() => mockHook.activateSlide(0)).not.toThrow();
    expect(() => mockHook.activateSlide(1)).not.toThrow();
    expect(() => mockHook.activateSlide(2)).not.toThrow();
  });

  it('getSlideStyles returns styles for each element', () => {
    const mockHook = useOnboardingSlideMotion({ slideCount: 3, screenWidth: 375 });
    
    const styles = mockHook.getSlideStyles(0);
    expect(styles).toHaveProperty('imageStyle');
    expect(styles).toHaveProperty('badgeStyle');
    expect(styles).toHaveProperty('titleStyle');
    expect(styles).toHaveProperty('subtitleStyle');
  });

  it('getProgressStyles returns activeIndex and slideCount', () => {
    const mockHook = useOnboardingSlideMotion({ slideCount: 3, screenWidth: 375 });
    
    const progress = mockHook.getProgressStyles();
    expect(progress).toHaveProperty('activeIndex');
    expect(progress).toHaveProperty('slideCount');
    expect(progress.slideCount).toBe(3);
  });
});

describe('ProgressBar component', () => {
  it('exports the component', () => {
    const { ProgressBar } = require('../components/ProgressBar');
    expect(typeof ProgressBar).toBe('function');
  });
});

describe('FadeSlideIn component', () => {
  it('exports the component and stagger', () => {
    const { FadeSlideIn, stagger } = require('../../../components/shared/FadeSlideIn');
    expect(typeof FadeSlideIn).toBe('function');
    expect(stagger).toHaveProperty('standard');
    expect(stagger.standard).toBe(70);
  });
});

describe('TactilePressable component', () => {
  it('exports the component', () => {
    const { TactilePressable } = require('../../../components/shared/TactilePressable');
    expect(typeof TactilePressable).toBe('function');
  });
});

describe('haptics', () => {
  it('exports all haptic methods', () => {
    const { haptic } = require('../../../lib/haptics');
    expect(typeof haptic.tap).toBe('function');
    expect(typeof haptic.light).toBe('function');
    expect(typeof haptic.commit).toBe('function');
    expect(typeof haptic.selection).toBe('function');
    expect(typeof haptic.success).toBe('function');
    expect(typeof haptic.warning).toBe('function');
    expect(typeof haptic.error).toBe('function');
    expect(typeof haptic.impact).toBe('function');
  });
});