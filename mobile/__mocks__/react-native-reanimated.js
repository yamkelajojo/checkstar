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

// Animated components render the real RN component, forwarding all props.
// This matters for accessibility: accessibilityRole/Label/State must reach
// the rendered element so tests (and screen readers) can see them.
// Styles produced by the mocked useAnimatedStyle are plain objects, which
// RN accepts directly.
const React = require('react');
const RN = require('react-native');

function animatedHost(Component) {
  return function AnimatedComponent(props) {
    return React.createElement(Component, props);
  };
}

const Animated = Object.assign(
  animatedHost(RN.View),
  {
    View: animatedHost(RN.View),
    Text: animatedHost(RN.Text),
    Image: animatedHost(RN.Image),
    ScrollView: animatedHost(RN.ScrollView),
    FlatList: animatedHost(RN.FlatList),
    Pressable: animatedHost(RN.Pressable),
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
