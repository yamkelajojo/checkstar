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

const Animated = Object.assign(
  function AnimatedComponent(props) {
    return props.children;
  },
  {
    View: function AnimatedView(props) { return props.children; },
    Text: function AnimatedText(props) { return props.children; },
    Image: function AnimatedImage(props) { return props.children; },
    ScrollView: function AnimatedScrollView(props) { return props.children; },
    FlatList: function AnimatedFlatList(props) { return props.children; },
    createAnimatedComponent: (C) => C,
  }
);

const Reanimated = {
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
  interpolate: (v) => v,
  Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
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
};

module.exports = Reanimated;
