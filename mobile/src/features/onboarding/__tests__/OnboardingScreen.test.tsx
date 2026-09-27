/**
 * Onboarding screen — renders the real component.
 *
 * The previous suite called `storage.set(...)` itself three times and asserted
 * the mock had been called: it verified jest, not the screen. This one mounts
 * OnboardingScreen and drives it the way a first-run customer would.
 *
 * Interaction tests are kept to the last case: once a test in a file has used
 * fireEvent, RNTL v14's async act environment stops committing renders made by
 * later tests, so render-only cases go first.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
// `jest` stays the injected global so the hoisted mock factories and the
// loose jest.Mock casts typecheck like the rest of the suite.
import { describe, it, expect, beforeEach } from '@jest/globals';
import { OnboardingScreen } from '../OnboardingScreen';
import { storage, STORAGE_KEYS } from '../../../lib/storage';
import { useNavigationSignal } from '../../../stores/navigationSignal';
import { copy } from '../../../lib/strings';

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
  return { haptic: mockHaptic, haptics: mockHaptic, default: mockHaptic };
});

jest.mock('../../../features/onboarding/hooks/useOnboardingSlideMotion', () => ({
  useOnboardingSlideMotion: () => ({
    bindPagerScroll: jest.fn(),
    activateSlide: jest.fn(),
    getSlideStyles: () => ({ imageStyle: {}, badgeStyle: {}, titleStyle: {}, subtitleStyle: {} }),
    getProgressStyles: () => ({ activeIndex: { value: 0 }, slideCount: 3 }),
  }),
}));

// react-native-pager-view reaches for a native module at import time; the
// screen only needs children rendering plus the onPageSelected callback.
jest.mock('react-native-pager-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Pager = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      setPage: jest.fn(),
      setPageWithoutAnimation: jest.fn(),
    }));
    return React.createElement(View, { testID: 'onboarding-pager', ...props }, props.children);
  });
  return { __esModule: true, default: Pager };
});

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (storage.get as jest.Mock).mockResolvedValue(null);
  (storage.set as jest.Mock).mockResolvedValue(undefined);
});

describe('OnboardingScreen', () => {
  it('shows the first slide with skip and next controls', async () => {
    await render(<OnboardingScreen />);

    expect(screen.getByText(copy.onboarding.slides.groceriesTitle)).toBeTruthy();
    expect(screen.getByText(copy.onboarding.skip)).toBeTruthy();
  });

  it('switches to the last-slide call to action when the pager advances', async () => {
    await render(<OnboardingScreen />);

    const pager = screen.getByTestId('onboarding-pager');
    // The screen listens to the pager, not to our mocks: report page 2.
    pager.props.onPageSelected({ nativeEvent: { position: 2 } });

    expect(await screen.findByText(copy.onboarding.startShopping)).toBeTruthy();
    expect(screen.getByText(copy.onboarding.iAmARider)).toBeTruthy();
  });

  it('persists completion from Skip and routes rider intent to Auth', async () => {
    const signal = jest.fn();
    useNavigationSignal.setState({ signal } as never);

    await render(<OnboardingScreen />);

    fireEvent.press(screen.getByText(copy.onboarding.skip));
    await screen.findByText(copy.onboarding.slides.groceriesTitle);

    expect(storage.set).toHaveBeenCalledWith(STORAGE_KEYS.onboardingSeen, true);
    expect(signal).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText(copy.onboarding.iAmARider));

    // iAmARider awaits storage before navigating.
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('Auth', { intent: 'rider' }),
    );
    expect(storage.set).toHaveBeenCalledTimes(2);
  });
});
