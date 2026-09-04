export * from './curves';

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
};

export const durations = {
  instant: 100,
  fast: 180,
  standard: 260,
  slow: 420,
  hero: 680,
};

export const stagger = {
  tight: 40,
  standard: 70,
  loose: 120,
};

export const onboardingMotionSpec = {
  enterSpring: springs.gentle,
  exitSpring: { ...springs.snappy, damping: 24 },
  phaseOffsets: {
    image: 0.0,
    badge: 0.08,
    title: 0.16,
    subtitle: 0.24,
  },
};

export const PRESS_IN_SPRING = {
  damping: 18,
  stiffness: 450,
  mass: 0.5,
};

export const PRESS_OUT_SPRING = {
  damping: 22,
  stiffness: 400,
  mass: 0.6,
};

export const CARD_PRESS_IN_SPRING = {
  damping: 24,
  stiffness: 320,
  mass: 0.7,
};

export const CARD_PRESS_OUT_SPRING = {
  damping: 26,
  stiffness: 280,
  mass: 0.75,
};

export const ENTRANCE_SPRING = {
  damping: 20,
  stiffness: 180,
  mass: 0.9,
};

export const PROGRESS_SPRING = springs.gentle;