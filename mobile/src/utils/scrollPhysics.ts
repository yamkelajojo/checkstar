'use strict';

/**
 * Predicts where a scroll will naturally come to rest.
 * iOS UIScrollView exponential decay formula.
 */
export function projectEndpoint(
  currentOffset: number,
  velocity: number,
  deceleration: number = 0.998,
): number {
  'worklet';
  const tau = deceleration / (1 - deceleration);
  return currentOffset + velocity * tau;
}

/**
 * Decides which card to snap to based on predicted endpoint and velocity.
 */
export function snapDecision(
  currentOffset: number,
  predictedEndpoint: number,
  velocity: number,
  snapInterval: number,
  contentOffset: number,
  maxIndex: number,
  velocityThreshold: number = 0.3,
): { targetOffset: number; targetIndex: number } {
  'worklet';

  const rawIndex = (predictedEndpoint - contentOffset) / snapInterval;
  const currentIndex = (currentOffset - contentOffset) / snapInterval;

  let targetIndex: number;

  if (Math.abs(velocity) > velocityThreshold) {
    if (velocity > 0) {
      const minTarget = Math.ceil(currentIndex + 0.001);
      const predictedTarget = Math.round(rawIndex);
      targetIndex = Math.max(minTarget, predictedTarget);
    } else {
      const maxTarget = Math.floor(currentIndex - 0.001);
      const predictedTarget = Math.round(rawIndex);
      targetIndex = Math.min(maxTarget, predictedTarget);
    }
  } else {
    targetIndex = Math.round(rawIndex);
  }

  targetIndex = Math.max(0, Math.min(maxIndex, targetIndex));
  const targetOffset = contentOffset + targetIndex * snapInterval;

  return { targetOffset, targetIndex };
}

/**
 * Apple's elastic resistance curve for over-scroll.
 */
export function rubberBand(x: number, dim: number): number {
  'worklet';
  return (1 - 1 / ((Math.abs(x) * 0.55) / dim + 1)) * dim * Math.sign(x);
}
