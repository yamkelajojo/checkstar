import { Easing } from 'react-native-reanimated';

// Named easing curves (port from GreenBidder)
export const EASE_SETTLE = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_TACTILE = Easing.bezier(0.34, 1.35, 0.64, 1);
export const EASE_PLAYFUL = Easing.bezier(0.34, 1.7, 0.66, 1);
export const EASE_READING = Easing.bezier(0.25, 0.1, 0.3, 1);
export const EASE_DROP = Easing.bezier(0.5, 0, 0.2, 1);
export const EASE_IN_QUICK = Easing.bezier(0.5, 0, 0.9, 0.4);

// Spring presets
export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
  overshootClamping: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export const SPRING_GENTLE: SpringConfig = { damping: 20, stiffness: 120, mass: 1, overshootClamping: false };
export const SPRING_STANDARD: SpringConfig = { damping: 15, stiffness: 150, mass: 1, overshootClamping: false };
export const SPRING_SNAPPY: SpringConfig = { damping: 24, stiffness: 200, mass: 0.8, overshootClamping: true };
export const SPRING_BOUNCY: SpringConfig = { damping: 12, stiffness: 180, mass: 0.8, overshootClamping: false };
export const SPRING_PRESS: SpringConfig = { damping: 18, stiffness: 450, mass: 0.5, overshootClamping: false };
export const CAROUSEL_SPRING: SpringConfig = { damping: 26, stiffness: 180, mass: 0.8, overshootClamping: true, restDisplacementThreshold: 0.1, restSpeedThreshold: 0.1 };
export const CRASH_SPRING: SpringConfig = { damping: 9, stiffness: 210, mass: 0.75, overshootClamping: false };
export const DOT_SPRING: SpringConfig = { damping: 12, stiffness: 280, mass: 0.6, overshootClamping: false };
export const PRESS_SPRING: SpringConfig = { damping: 14, stiffness: 600, mass: 0.4, overshootClamping: true };
