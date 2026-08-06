const React = require('react');
const { View } = require('react-native');

function useSharedValue(initialValue) {
  return React.useRef({ value: initialValue }).current;
}

function useAnimatedStyle() {
  return {};
}

function withTiming(toValue) {
  return toValue;
}

function withSpring(toValue) {
  return toValue;
}

function withDelay(_delay, value) {
  return value;
}

function withSequence(...values) {
  return values[values.length - 1];
}

function cancelAnimation() {}

const Easing = {
  out: () => (t) => t,
  in: () => (t) => t,
  inOut: () => (t) => t,
  linear: (t) => t,
  cubic: (t) => t,
};

const FadeIn = { duration: () => ({}), delay: () => ({}) };

const Animated = { View };

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  cancelAnimation,
  Easing,
  FadeIn,
};
