export * from './curves';

/**
 * Apple iOS 18 Motion — cohesive, polished, no element just appears
 * Every spring tuned to feel like real material, not decoration
 * Based on Impeccable craft floor + Apple HIG
 */

export const springs = {
  gentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
  standard: {
    damping: 18,
    stiffness: 180,
    mass: 1,
  },
  snappy: {
    damping: 22,
    stiffness: 260,
    mass: 0.9,
  },
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 1,
  },
  slow: {
    damping: 25,
    stiffness: 80,
    mass: 1.2,
  },
  press: {
    damping: 25,
    stiffness: 350,
    mass: 0.6,
  },
  // Apple — iOS 18 signature, ζ=0.82, ~280ms
  apple: {
    damping: 30,
    stiffness: 400,
    mass: 0.8,
  },
  appleGentle: {
    damping: 28,
    stiffness: 220,
    mass: 1.0,
  },
  appleBounce: {
    damping: 22,
    stiffness: 450,
    mass: 0.6,
  },
  applePress: {
    damping: 30,
    stiffness: 700,
    mass: 0.4,
  },
};

export const durations = {
  instant: 80,
  fast: 150,
  standard: 240,
  slow: 380,
  hero: 620,
  apple: 280,
};

export const stagger = {
  tight: 30,
  standard: 60,
  loose: 100,
  apple: 40,
};

export const onboardingMotionSpec = {
  enterSpring: springs.apple,
  exitSpring: { ...springs.apple, damping: 32 },
  phaseOffsets: {
    image: 0.0,
    badge: 0.06,
    title: 0.14,
    subtitle: 0.22,
  },
};

// Press springs — tactile, Apple-like
export const PRESS_IN_SPRING = {
  damping: 20,
  stiffness: 500,
  mass: 0.45,
};

export const PRESS_OUT_SPRING = {
  damping: 26,
  stiffness: 420,
  mass: 0.55,
};

export const CARD_PRESS_IN_SPRING = {
  damping: 28,
  stiffness: 360,
  mass: 0.65,
};

export const CARD_PRESS_OUT_SPRING = {
  damping: 30,
  stiffness: 320,
  mass: 0.7,
};

// Entrance — Apple focal moment
export const ENTRANCE_SPRING = {
  damping: 26,
  stiffness: 320,
  mass: 0.85,
};

export const APPLE_ENTRANCE_SPRING = {
  damping: 30,
  stiffness: 400,
  mass: 0.8,
};

export const APPLE_LIST_SPRING = {
  damping: 28,
  stiffness: 350,
  mass: 0.75,
};

export const PROGRESS_SPRING = springs.appleGentle;