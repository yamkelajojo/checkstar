// Manual mock for react-native-reanimated
// The built-in mock can't be used because react-native-worklets has ESM syntax
// that jest-expo can't transform. This provides a minimal mock with Easing.bezier.

const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  in: (t) => t,
  out: (t) => t,
  inOut: (t) => t,
  bezier: () => (t) => t,
  bounce: () => (t) => t,
  circle: () => (t) => t,
  cubic: () => (t) => t,
  poly: () => (t) => t,
  quad: () => (t) => t,
  sin: () => (t) => t,
  step: () => (t) => t,
};

// Animated component that just renders children wrapped in a View
function AnimatedView(props) {
  return props.children;
}

function passthrough(props) {
  return props.children ?? null;
}

const Animated = Object.assign(
  function AnimatedComponent(props) {
    return passthrough(props);
  },
  {
    View: function AnimatedView(props) { return passthrough(props); },
    Text: function AnimatedText(props) { return passthrough(props); },
    Image: function AnimatedImage(props) { return passthrough(props); },
    ScrollView: function AnimatedScrollView(props) { return passthrough(props); },
    FlatList: function AnimatedFlatList(props) { return passthrough(props); },
    Pressable: function AnimatedPressable(props) { return passthrough(props); },
    createAnimatedComponent: (C) => C,
  }
);

// babel-preset-expo transpiles ESM to CJS WITHOUT interop helpers, so a
// default import (`import Animated from 'react-native-reanimated'`) receives
// this whole namespace object, not `.default`. Mirror the Animated members at
// the top level so both `Animated.createAnimatedComponent(...)` (module
// default) and `Reanimated.Animated.View` resolve under jest.
const Reanimated = Object.assign({}, Animated, {
  default: Animated,
  Animated,
  Easing,
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: (fn) => fn(),
  useDerivedValue: (fn) => ({ value: fn() }),
  useAnimatedRef: () => ({ current: null }),
  useAnimatedGestureHandler: (h) => h,
  useAnimatedScrollHandler: (h) => h,
  withTiming: (v) => v,
  withSpring: (v) => v,
  withDecay: (v) => v,
  withRepeat: (v) => v,
  cancelAnimation: () => {},
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,
  withDelay: (_delay, animation) => animation,
  withSequence: (...animations) => animations[animations.length - 1],
  withRepeat: (animation) => animation,
  interpolate: (v) => v,
  interpolateColor: (v) => v,
  Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
  Layout: { duration: () => ({}) },
  FadeIn: { duration: () => ({}) },
  FadeOut: { duration: () => ({}) },
  SlideInRight: { duration: () => ({}) },
  SlideOutLeft: { duration: () => ({}) },
  Curves: {},
  ZoomIn: { duration: () => ({}) },
  ZoomOut: { duration: () => ({}) },
  LinearTransition: {},
  SequencedTransition: {},
  FadingTransition: {},
  SharedTransition: { duration: () => ({}) },
  SlideInLeft: { duration: () => ({}) },
  SlideOutRight: { duration: () => ({}) },
  SlideInDown: { duration: () => ({}) },
  SlideOutUp: { duration: () => ({}) },
  EnterTransition: {},
  ExitTransition: {},
  useReducedMotion: () => false,
  useAnimatedProps: (fn) => fn(),
  useEvent: () => () => {},
  useAnimatedReaction: () => {},
  useAnimatedGestureHandler: (h) => h,
  measure: () => ({}),
  scrollTo: () => {},
});

module.exports = Reanimated;
