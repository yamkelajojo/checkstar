/**
 * Tab Transitions — Apple-polished, directional, with motion-blur simulation
 *
 * Implements:
 * - Direction-aware swipe (right → content enters from right, left → from left)
 * - Snappy, fluid timing (Apple spring 400/30, 280ms)
 * - Motion-blur intensity based on velocity + progress
 * - Staggered content entrance coordinated with tab transition
 * - Reduced motion support
 */

export const TAB_ORDER = ['Home', 'Browse', 'Favorites', 'Cart', 'Account'] as const;
export type TabName = typeof TAB_ORDER[number];

export function getTabIndex(name: TabName): number {
  return (TAB_ORDER as readonly string[]).indexOf(name);
}

/**
 * Direction: 1 = moving right (to higher index), -1 = left, 0 = same or initial
 * Content should swipe naturally: right movement → content slides left (enters from right)
 */
export function getTabDirection(prevIndex: number, nextIndex: number): number {
  if (prevIndex < 0) return 0; // initial mount, no direction
  if (prevIndex === nextIndex) return 0;
  return nextIndex > prevIndex ? 1 : -1;
}

export interface TabTransitionConfig {
  enteringX: number;
  exitingX: number;
  spring: { damping: number; stiffness: number; mass: number };
  duration: number;
  easing: [number, number, number, number]; // cubic bezier
}

/**
 * Returns transition config based on direction and screen width
 * enteringX: where incoming screen starts (off-screen)
 * exitingX: where outgoing screen ends
 */
export function getTabTransitionConfig(direction: number, screenWidth = 390): TabTransitionConfig {
  // Apple iOS 18: translate ~28% of width for snappy feel, not full width (feels faster, less travel)
  const translateFraction = 0.32;
  const baseTranslate = Math.round(screenWidth * translateFraction);

  // Clamp to reasonable range: 20px min, full width max
  const clampedTranslate = Math.max(20, Math.min(baseTranslate, screenWidth));

  return {
    enteringX: direction === 0 ? 0 : direction * clampedTranslate,
    exitingX: direction === 0 ? 0 : -direction * clampedTranslate * 0.45, // outgoing moves less (parallax)
    spring: {
      damping: 30,
      stiffness: 400,
      mass: 0.8,
    },
    duration: 280, // Apple standard
    easing: [0.16, 1, 0.3, 1],
  };
}

/**
 * Stagger delay for inner content (products, loaders, empty states)
 * Coordinated with tab transition: first items enter shortly after tab starts moving
 */
export function getStaggerDelayForContent(
  index: number,
  isEntering: boolean,
  baseDelay = 40
): number {
  if (!isEntering) {
    // Exiting: fast, no stagger or minimal
    return Math.min(index * 12, 80);
  }

  // Entering: Apple stagger 38ms per item, base 40ms, cap total to 300ms
  const staggerPerItem = 38;
  const delay = baseDelay + index * staggerPerItem;

  // Cap to avoid long waits on large lists
  return Math.min(delay, 300);
}

/**
 * Motion blur intensity 0..1 based on velocity and scroll progress
 * velocity: 0..1+ (normalized swipe velocity)
 * progressOffset: 0..1 (how far from rest position, 0.5 = mid-transition)
 */
export function getMotionBlurIntensity(velocity: number, progressOffset: number): number {
  const normalizedVelocity = Math.min(Math.abs(velocity), 2); // cap
  const normalizedProgress = Math.min(Math.abs(progressOffset), 1);

  // Velocity contributes 60%, progress 40% — both create sense of speed
  const velocityComponent = normalizedVelocity * 0.6;
  const progressComponent = normalizedProgress * 0.4 * 0.6; // progress less intense

  // Combined, with curve to keep subtle at low speeds
  const raw = velocityComponent + progressComponent;

  // Apply ease-out curve to keep low values subtle, high values punchy but capped
  // Use sqrt for gentle rise at low end
  const curved = Math.sqrt(raw) * 0.5;

  // Cap to 1, and ensure typical swipes stay <0.4 for subtlety
  return Math.min(curved, 1);
}

export interface MotionBlurStyle {
  scaleX: number;
  scaleY: number;
  opacity: number;
  // For future: could include translate for ghost layer
}

/**
 * Returns subtle stretch + opacity to simulate realistic motion blur
 * Very subtle: max 1.06 scaleX, 0.96 scaleY, 0.85 opacity
 * Keeps it realistic, not artificial
 */
export function getMotionBlurStyle(intensity: number): MotionBlurStyle {
  const clamped = Math.max(0, Math.min(intensity, 1));

  if (clamped === 0) {
    return { scaleX: 1, scaleY: 1, opacity: 1 };
  }

  // ScaleX: 1 → 1.06 max, with curve that stays subtle at low intensity
  const scaleX = 1 + clamped * 0.06;

  // ScaleY: conserve volume slightly, 1 → 0.97 min
  const scaleY = 1 - clamped * 0.03;

  // Opacity: 1 → 0.88 min, subtle dip
  const opacity = 1 - clamped * 0.12;

  return {
    scaleX: Math.min(scaleX, 1.06),
    scaleY: Math.max(scaleY, 0.96),
    opacity: Math.max(opacity, 0.85),
  };
}

export function shouldAnimateTabTransition(
  prevIndex: number,
  nextIndex: number,
  reduceMotion = false
): boolean {
  if (reduceMotion) return false;
  return prevIndex !== nextIndex;
}

/**
 * Interpolation for tab indicator position
 * Returns translateX for indicator based on active index and tab widths
 */
export function getTabIndicatorPosition(
  activeIndex: number,
  tabWidth: number,
  progress = 1
): number {
  return activeIndex * tabWidth * progress;
}
