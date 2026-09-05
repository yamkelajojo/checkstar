// Jest setup for mobile tests
// Manual mock for react-native-reanimated is in __mocks__/react-native-reanimated.js

// Safe-area insets are part of the design system now (ScreenHeader /
// useTopSafeArea); every component test gets zero insets by default.
// Suites that need specific insets can still override with a local
// jest.mock (their mock wins over this one).
jest.mock('react-native-safe-area-context', () => {
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    useSafeAreaInsets: () => zero,
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: zero,
    },
  };
});

