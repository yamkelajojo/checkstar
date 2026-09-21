import { Easing } from 'react-native-reanimated';

// Apple iOS 18 easing — cohesive, polished
export const EASE_APPLE = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_APPLE_SPRING = Easing.bezier(0.4, 0.01, 0.165, 0.99);
export const EASE_EMPHASIZED = Easing.bezier(0.2, 0, 0, 1);
export const EASE_GENTLE = Easing.bezier(0.25, 0.1, 0.25, 1);

// Legacy — kept for compat, but prefer Apple
export const EASE_SETTLE = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_TACTILE = Easing.bezier(0.34, 1.35, 0.64, 1);
export const EASE_PLAYFUL = Easing.bezier(0.34, 1.7, 0.66, 1);
export const EASE_READING = Easing.bezier(0.25, 0.1, 0.3, 1);
export const EASE_DROP = Easing.bezier(0.5, 0, 0.2, 1);
export const EASE_IN_QUICK = Easing.bezier(0.5, 0, 0.9, 0.4);

// Spring presets — Apple tuned
export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
  overshootClamping: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export const SPRING_GENTLE: SpringConfig = { damping: 20, stiffness: 120, mass: 1, overshootClamping: false };
export const SPRING_STANDARD: SpringConfig = { damping: 18, stiffness: 180, mass: 1, overshootClamping: false };
export const SPRING_SNAPPY: SpringConfig = { damping: 22, stiffness: 260, mass: 0.9, overshootClamping: true };
export const SPRING_BOUNCY: SpringConfig = { damping: 12, stiffness: 180, mass: 1, overshootClamping: false };
export const SPRING_PRESS: SpringConfig = { damping: 20, stiffness: 500, mass: 0.45, overshootClamping: true };
export const CAROUSEL_SPRING: SpringConfig = { damping: 30, stiffness: 320, mass: 0.8, overshootClamping: true, restDisplacementThreshold: 0.1, restSpeedThreshold: 0.1 };
export const CRASH_SPRING: SpringConfig = { damping: 18, stiffness: 300, mass: 0.75, overshootClamping: false };
export const DOT_SPRING: SpringConfig = { damping: 20, stiffness: 380, mass: 0.6, overshootClamping: false };
export const PRESS_SPRING: SpringConfig = { damping: 20, stiffness: 700, mass: 0.4, overshootClamping: true };

// Apple — new polished springs
export const SPRING_APPLE: SpringConfig = { damping: 30, stiffness: 400, mass: 0.8, overshootClamping: false };
export const SPRING_APPLE_GENTLE: SpringConfig = { damping: 28, stiffness: 220, mass: 1.0, overshootClamping: false };
export const SPRING_APPLE_BOUNCE: SpringConfig = { damping: 22, stiffness: 450, mass: 0.6, overshootClamping: false };
export const SPRING_APPLE_LIST: SpringConfig = { damping: 28, stiffness: 350, mass: 0.75, overshootClamping: false };
